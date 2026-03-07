"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSession } from "@livekit/components-react";
import { TokenSource } from "livekit-client";
import { AgentSessionProvider } from "@/components/agents-ui/agent-session-provider";
import { api } from "@/lib/api";

interface LiveKitSessionProps {
  sessionId: string;
  roomName: string;
  participantName: string;
  children: ReactNode;
}

interface CachedToken {
  promise: Promise<{ serverUrl: string; participantToken: string }>;
  timestamp: number;
}

// Cache duration for token deduplication (ms).
// Multiple rapid calls within this window reuse the same token.
const TOKEN_CACHE_TTL = 5_000;

export function LiveKitSession({
  sessionId,
  roomName,
  participantName,
  children,
}: LiveKitSessionProps) {
  const tokenSource = useMemo(() => {
    let cached: CachedToken | null = null;

    return TokenSource.custom(async (options) => {
      const now = Date.now();

      // Reuse in-flight or recent token to prevent duplicate API calls
      if (cached && now - cached.timestamp < TOKEN_CACHE_TTL) {
        return cached.promise;
      }

      const promise = api
        .getToken(
          options.roomName ?? roomName,
          options.participantName ?? participantName,
          sessionId,
        )
        .then((res) => ({
          serverUrl: res.url,
          participantToken: res.token,
        }));

      cached = { promise, timestamp: now };
      return promise;
    });
  }, [roomName, participantName, sessionId]);

  const session = useSession(tokenSource, {
    agentName: "interview-agent",
    roomName,
    participantName,
  });

  // Pattern from official LiveKit agents-playground:
  // useCallback with isConnected guard + hasConnected state to prevent Strict Mode double-start
  const [hasConnected, setHasConnected] = useState(false);

  const startSession = useCallback(() => {
    if (session.isConnected) return;
    session.start({
      tracks: {
        microphone: { enabled: true, publishOptions: { preConnectBuffer: true } },
        camera: { enabled: true },
      },
    });
    setHasConnected(true);
  }, [session]);

  useEffect(() => {
    if (!hasConnected) {
      startSession();
    }
  }, [hasConnected, startSession]);

  return (
    <AgentSessionProvider session={session}>{children}</AgentSessionProvider>
  );
}
