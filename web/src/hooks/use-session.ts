"use client";

import { useState, useCallback } from "react";
import type { InterviewConfig, SessionResponse } from "@/lib/types";
import { api, ApiError } from "@/lib/api";

interface UseSessionReturn {
  session: SessionResponse | null;
  isLoading: boolean;
  error: string | null;
  createSession: (config: InterviewConfig) => Promise<SessionResponse | null>;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  fetchSession: (sessionId: string) => Promise<void>;
}

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getSession(sessionId);
      setSession(data);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to fetch session";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createSession = useCallback(
    async (config: InterviewConfig): Promise<SessionResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.createSession(config);
        setSession(data);
        return data;
      } catch (e) {
        const msg =
          e instanceof ApiError ? e.message : "Failed to create session";
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const startSession = useCallback(async () => {
    if (!session) return;
    try {
      const data = await api.startSession(session.id);
      setSession(data);
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : "Failed to start session";
      setError(msg);
    }
  }, [session]);

  const endSession = useCallback(async () => {
    if (!session) return;
    try {
      const data = await api.endSession(session.id);
      setSession(data);
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Failed to end session";
      setError(msg);
    }
  }, [session]);

  return {
    session,
    isLoading,
    error,
    createSession,
    startSession,
    endSession,
    fetchSession,
  };
}
