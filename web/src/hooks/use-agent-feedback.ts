"use client";

import { useState, useCallback } from "react";
import { useDataChannel } from "@livekit/components-react";
import type {
  FeedbackState,
  CoachingNote,
  PaceLevel,
  CoachingNoteType,
  CoachingCategory,
} from "@/lib/types";

const DEFAULT_FEEDBACK: FeedbackState = {
  confidence: 0,
  pace: "good",
  fillerWords: 0,
  fillerInstances: [],
};

interface AgentFeedbackMessage {
  type: "feedback" | "coaching_note";
  data: Record<string, unknown>;
}

export function useAgentFeedback() {
  const [feedback, setFeedback] = useState<FeedbackState>(DEFAULT_FEEDBACK);
  const [coachingNotes, setCoachingNotes] = useState<CoachingNote[]>([]);

  const onMessage = useCallback(
    (msg: { payload: Uint8Array }) => {
      try {
        const text = new TextDecoder().decode(msg.payload);
        const parsed = JSON.parse(text) as AgentFeedbackMessage;

        if (parsed.type === "feedback") {
          setFeedback((prev) => ({
            ...prev,
            confidence:
              (parsed.data.confidence as number | undefined) ?? prev.confidence,
            pace: (parsed.data.pace as PaceLevel | undefined) ?? prev.pace,
            fillerWords:
              (parsed.data.filler_words as number | undefined) ??
              prev.fillerWords,
          }));
        } else if (parsed.type === "coaching_note") {
          const note: CoachingNote = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type: (parsed.data.note_type as CoachingNoteType) ?? "suggestion",
            message: (parsed.data.message as string) ?? "",
            category:
              (parsed.data.category as CoachingCategory) ?? "communication",
          };
          setCoachingNotes((prev) => [...prev, note]);
        }
      } catch {
        // Ignore malformed messages
      }
    },
    []
  );

  useDataChannel("feedback", onMessage);

  return { feedback, coachingNotes };
}
