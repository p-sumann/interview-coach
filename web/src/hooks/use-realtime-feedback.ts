"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSessionMessages } from "@livekit/components-react";
import type { ReceivedMessage } from "@livekit/components-react";
import type { AnalyzeResponse, CoachingNote, FillerWordInstance } from "@/lib/types";
import { api } from "@/lib/api";

const MIN_CHARS_FOR_ANALYSIS = 50;
// Wait for transcription text to settle before analyzing (ms)
const SETTLE_DELAY_MS = 1500;

interface RealtimeFeedbackState {
  fillerCount: number;
  recentFillers: string[];
  repeatedWords: string[];
  coachingNotes: CoachingNote[];
  fillerInstances: FillerWordInstance[];
}

/**
 * Watches user transcription messages and sends each completed user turn
 * (>50 chars) to the backend /analyze endpoint for real-time filler word
 * detection, repetition analysis, and coaching tips.
 *
 * Transcription text streams in progressively — this hook debounces by
 * waiting for text to stop changing before sending to the backend.
 */
export function useRealtimeFeedback(sessionId: string) {
  const { messages } = useSessionMessages();

  const [state, setState] = useState<RealtimeFeedbackState>({
    fillerCount: 0,
    recentFillers: [],
    repeatedWords: [],
    coachingNotes: [],
    fillerInstances: [],
  });

  // Track which message IDs we've already analyzed (by their final text)
  const analyzedIdsRef = useRef(new Set<string>());
  // Debounce timer per message ID
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pendingRequestRef = useRef(false);

  const analyzeText = useCallback(
    async (messageId: string, text: string, agentQuestion: string) => {
      if (pendingRequestRef.current) return;
      analyzedIdsRef.current.add(messageId);
      pendingRequestRef.current = true;

      try {
        const result: AnalyzeResponse = await api.analyzeSpeech(
          sessionId,
          text,
          agentQuestion,
        );

        setState((prev) => {
          const notes = [...prev.coachingNotes];

          if (result.coachingTip) {
            notes.push({
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: result.fillerCount > 2 ? "concern" : "suggestion",
              message: result.coachingTip,
              category: "communication",
            });
          }

          if (
            result.relevanceNote &&
            !result.relevanceNote.toLowerCase().includes("on track") &&
            !result.relevanceNote.toLowerCase().includes("relevant") &&
            !result.relevanceNote.toLowerCase().includes("addresses")
          ) {
            notes.push({
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              type: "suggestion",
              message: result.relevanceNote,
              category: "content",
            });
          }

          // Create individual filler word instances linked to the transcript message
          const newInstances: FillerWordInstance[] = result.fillerWords.map(
            (word) => ({
              id: crypto.randomUUID(),
              word,
              timestamp: Date.now(),
              messageId,
            }),
          );

          return {
            fillerCount: prev.fillerCount + result.fillerCount,
            recentFillers: result.fillerWords,
            repeatedWords: result.repeatedWords,
            coachingNotes: notes,
            fillerInstances: [...prev.fillerInstances, ...newInstances],
          };
        });
      } catch (err) {
        console.warn("[useRealtimeFeedback] analyze failed:", err);
      } finally {
        pendingRequestRef.current = false;
      }
    },
    [sessionId],
  );

  useEffect(() => {
    // Find the latest agent question for relevance context
    let latestAgentQuestion = "";
    for (const msg of messages) {
      const rm = msg as ReceivedMessage;
      if (rm.type === "agentTranscript" && rm.message) {
        latestAgentQuestion = rm.message;
      }
    }

    // Check each user transcript message
    for (const msg of messages) {
      const rm = msg as ReceivedMessage;
      if (rm.type !== "userTranscript") continue;
      if (!rm.message || rm.message.length < MIN_CHARS_FOR_ANALYSIS) continue;
      if (analyzedIdsRef.current.has(rm.id)) continue;

      // Debounce: reset timer every time the text changes.
      // Once text stops changing for SETTLE_DELAY_MS, analyze it.
      const existingTimer = timersRef.current.get(rm.id);
      if (existingTimer) clearTimeout(existingTimer);

      const capturedText = rm.message;
      const capturedQuestion = latestAgentQuestion;
      const capturedId = rm.id;

      timersRef.current.set(
        rm.id,
        setTimeout(() => {
          timersRef.current.delete(capturedId);
          analyzeText(capturedId, capturedText, capturedQuestion);
        }, SETTLE_DELAY_MS),
      );
    }

    return () => {
      // Clean up all pending timers on unmount
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
    };
  }, [messages, analyzeText]);

  return state;
}
