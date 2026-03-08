"use client";

import { useCallback } from "react";
import { useDataChannel } from "@livekit/components-react";
import { toast } from "sonner";

interface AgentEventPayload {
  action: string;
  sessionId?: string;
  source?: string;
  recoverable?: boolean;
  message?: string;
}

/**
 * Listens on the "events" data channel for agent control events
 * (errors, phase changes, scorecard status, etc.).
 *
 * Uses data channel instead of RPC to eliminate round-trip latency —
 * the agent fires and forgets, the frontend just reacts.
 */
export function useAgentEvents() {
  const onMessage = useCallback((msg: { payload: Uint8Array }) => {
    try {
      const text = new TextDecoder().decode(msg.payload);
      const payload: AgentEventPayload = JSON.parse(text);
      handleAgentEvent(payload);
    } catch {
      // Ignore malformed messages
    }
  }, []);

  useDataChannel("events", onMessage);
}

function handleAgentEvent(payload: AgentEventPayload) {
  switch (payload.action) {
    case "agentError":
      if (payload.recoverable) {
        toast.warning("AI connection issue", {
          description: "Experiencing a brief interruption. Reconnecting...",
          duration: 5000,
        });
      } else {
        toast.error("AI connection lost", {
          description:
            "The interviewer ran into an issue and couldn't recover. You may want to end and restart.",
          duration: 10000,
        });
      }
      break;

    case "interviewEnded":
      toast.info("Interview ended", {
        description: "The interviewer has concluded the session.",
      });
      break;

    case "scorecardReady":
      toast.success("Scorecard ready", {
        description: "Your interview scorecard has been generated.",
      });
      break;

    case "scorecardFailed":
      toast.error("Scorecard generation failed", {
        description: "We couldn't generate your scorecard. Please try again later.",
      });
      break;
  }
}
