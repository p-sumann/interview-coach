"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type {
  SimulatedInterviewState,
  InterviewConfig,
  AgentState,
} from "@/lib/types";
import {
  MOCK_TRANSCRIPT,
  MOCK_INITIAL_FEEDBACK,
  MOCK_COACHING_NOTES,
  MOCK_PHASES,
} from "@/lib/mock-data";
import { randomDelta, clampScore, shouldTrigger, pickRandom } from "@/lib/simulation";

export function useSimulatedInterview(
  _config: InterviewConfig
): SimulatedInterviewState {
  const [state, setState] = useState<SimulatedInterviewState>({
    status: "connecting",
    transcript: [],
    feedback: { ...MOCK_INITIAL_FEEDBACK },
    coachingNotes: [],
    currentQuestion: 0,
    totalQuestions: 10,
    currentPhase: 1,
    phases: MOCK_PHASES.map((p) => ({ ...p })),
    agentState: "idle",
    volumeLevel: 0,
  });

  const messageIndexRef = useRef(0);
  const noteIndexRef = useRef(0);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const clearAllIntervals = useCallback(() => {
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
  }, []);

  useEffect(() => {
    // Phase 1: connecting -> active after 1.5s
    const connectTimer = setTimeout(() => {
      setState((s) => ({ ...s, status: "active", agentState: "thinking" }));

      // Start agent thinking -> talking for first message
      const firstMsgTimer = setTimeout(() => {
        setState((s) => ({ ...s, agentState: "talking", volumeLevel: 0.6 }));
      }, 800);
      intervalsRef.current.push(firstMsgTimer as unknown as ReturnType<typeof setInterval>);
    }, 1500);

    return () => {
      clearTimeout(connectTimer);
      clearAllIntervals();
    };
  }, [clearAllIntervals]);

  // Transcript progression
  useEffect(() => {
    if (state.status !== "active") return;

    const interval = setInterval(() => {
      const idx = messageIndexRef.current;
      if (idx >= MOCK_TRANSCRIPT.length) {
        clearInterval(interval);
        return;
      }

      const msg = MOCK_TRANSCRIPT[idx];
      messageIndexRef.current = idx + 1;

      // Count agent messages as questions
      const questionCount =
        MOCK_TRANSCRIPT.slice(0, idx + 1).filter((m) => m.role === "agent")
          .length;

      // Determine agent state based on next message
      const nextMsg = MOCK_TRANSCRIPT[idx + 1];
      let nextAgentState: AgentState = "listening";
      if (nextMsg?.role === "agent") {
        // Next one is agent -> will go thinking->talking
        nextAgentState = "listening";
      } else if (!nextMsg) {
        nextAgentState = "idle";
      }

      // Determine phase from message persona
      let currentPhase = 1;
      if (msg.persona === "Sarah Chen" || (!msg.persona && idx > 6)) {
        currentPhase = 2;
      }
      if (msg.persona === "Alex Rivera" || (!msg.persona && idx > 11)) {
        currentPhase = 3;
      }

      setState((s) => ({
        ...s,
        transcript: [...s.transcript, msg],
        currentQuestion: questionCount,
        currentPhase,
        agentState: msg.role === "agent" ? "talking" : nextAgentState,
        volumeLevel: msg.role === "agent" ? 0.5 + Math.random() * 0.4 : 0.1,
        phases: s.phases.map((p) => ({
          ...p,
          status:
            p.phaseNumber < currentPhase
              ? "complete"
              : p.phaseNumber === currentPhase
                ? "active"
                : "pending",
        })),
      }));

      // After agent speaks, transition to listening
      if (msg.role === "agent") {
        setTimeout(() => {
          setState((s) => ({
            ...s,
            agentState: "listening",
            volumeLevel: 0.05 + Math.random() * 0.15,
          }));
        }, 2000);
      }

      // Before agent speaks, show thinking
      if (nextMsg?.role === "agent") {
        setTimeout(() => {
          setState((s) => ({
            ...s,
            agentState: "thinking",
            volumeLevel: 0.02,
          }));
        }, 2500);
      }
    }, 4500);

    intervalsRef.current.push(interval);
    return () => clearInterval(interval);
  }, [state.status]);

  // Feedback fluctuation
  useEffect(() => {
    if (state.status !== "active") return;

    const interval = setInterval(() => {
      setState((s) => ({
        ...s,
        feedback: {
          confidence: clampScore(
            s.feedback.confidence + randomDelta(-3, 5)
          ),
          eyeContact: clampScore(
            s.feedback.eyeContact + randomDelta(-5, 4)
          ),
          pace: shouldTrigger(0.8)
            ? "good"
            : pickRandom(["slow", "fast"] as const),
          posture: shouldTrigger(0.9) ? "good" : "needs_work",
          fillerWords: shouldTrigger(0.3)
            ? s.feedback.fillerWords + 1
            : s.feedback.fillerWords,
        },
      }));
    }, 2500);

    intervalsRef.current.push(interval);
    return () => clearInterval(interval);
  }, [state.status]);

  // Coaching notes
  useEffect(() => {
    if (state.status !== "active") return;

    const interval = setInterval(() => {
      const idx = noteIndexRef.current;
      if (idx >= MOCK_COACHING_NOTES.length) {
        clearInterval(interval);
        return;
      }
      noteIndexRef.current = idx + 1;
      setState((s) => ({
        ...s,
        coachingNotes: [...s.coachingNotes, MOCK_COACHING_NOTES[idx]],
      }));
    }, 9000);

    intervalsRef.current.push(interval);
    return () => clearInterval(interval);
  }, [state.status]);

  // Volume oscillation during talking
  useEffect(() => {
    if (state.agentState !== "talking") return;

    const interval = setInterval(() => {
      setState((s) => ({
        ...s,
        volumeLevel:
          s.agentState === "talking"
            ? 0.3 + Math.sin(Date.now() / 200) * 0.3 + Math.random() * 0.2
            : s.volumeLevel,
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [state.agentState]);

  return state;
}
