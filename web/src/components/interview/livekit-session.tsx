"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSession } from "@livekit/components-react";
import { ConnectionState, TokenSource } from "livekit-client";
import { AgentSessionProvider } from "@/components/agents-ui/agent-session-provider";
import { api } from "@/lib/api";

interface LiveKitSessionProps {
  sessionId: string;
  roomName: string;
  participantName: string;
  onConnectionError?: (error: string) => void;
  children: ReactNode;
}

interface CachedToken {
  promise: Promise<{ serverUrl: string; participantToken: string }>;
  timestamp: number;
}

// Cache duration for token deduplication (ms).
// Multiple rapid calls within this window reuse the same token.
const TOKEN_CACHE_TTL = 5_000;

// Grace period before reporting a disconnect as an error (ms).
// Allows transient disconnects (Strict Mode, HMR) to resolve.
const DISCONNECT_GRACE_MS = 3_000;

export function LiveKitSession({
  sessionId,
  roomName,
  participantName,
  onConnectionError,
  children,
}: LiveKitSessionProps) {
  const tokenSource = useMemo(() => {
    let cached: CachedToken | null = null;

    return TokenSource.custom(async (options) => {
      // eslint-disable-next-line react-hooks/purity -- Date.now() is in an async callback, not during render
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
        }))
        .catch((err) => {
          // Clear the cache so retries can try again
          cached = null;
          throw err;
        });

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
    session
      .start({
        tracks: {
          microphone: {
            enabled: true,
            publishOptions: { preConnectBuffer: true },
          },
          camera: { enabled: true },
        },
      })
      .catch((err: Error) => {
        onConnectionError?.(err.message || "Failed to connect to interview room");
      });
    setHasConnected(true);
  }, [session, onConnectionError]);

  useEffect(() => {
    if (!hasConnected) {
      startSession();
    }
  }, [hasConnected, startSession]);

  // Track whether the session ever reached a fully Connected state.
  // Only report disconnect errors after a real connection was established,
  // and debounce to handle transient states (Strict Mode, HMR, reconnects).
  const wasFullyConnectedRef = useRef(false);
  const connectionStateRef = useRef(session.connectionState);
  connectionStateRef.current = session.connectionState;

  useEffect(() => {
    if (session.connectionState === ConnectionState.Connected) {
      wasFullyConnectedRef.current = true;
    }

    if (
      wasFullyConnectedRef.current &&
      session.connectionState === ConnectionState.Disconnected
    ) {
      const timer = setTimeout(() => {
        // Only fire if still disconnected after the grace period
        if (connectionStateRef.current === ConnectionState.Disconnected) {
          onConnectionError?.("Connection to interview room was lost");
        }
      }, DISCONNECT_GRACE_MS);
      return () => clearTimeout(timer);
    }
  }, [session.connectionState, onConnectionError]);

  return (
    <AgentSessionProvider session={session}>{children}</AgentSessionProvider>
  );
}
