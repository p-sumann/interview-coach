import type {
  InterviewConfig,
  SessionResponse,
  SessionListItem,
  TokenResponse,
  Scorecard,
  HealthResponse,
  AnalyzeResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ScorecardGeneratingError extends Error {
  constructor() {
    super("Scorecard is still generating");
    this.name = "ScorecardGeneratingError";
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, body.detail || res.statusText);
  }

  return res.json() as Promise<T>;
}

export const api = {
  healthCheck() {
    return request<HealthResponse>("/api/v1/health");
  },

  createSession(config: InterviewConfig, userId?: string) {
    return request<SessionResponse>("/api/v1/sessions", {
      method: "POST",
      body: JSON.stringify({
        candidateName: config.candidateName || "Candidate",
        targetRole: config.targetRole || "Software Engineer",
        experienceLevel: config.experienceLevel,
        roleType: config.roleType,
        primaryLanguage: config.primaryLanguage,
        techStack: config.techStack,
        interviewType: config.interviewType,
        ...(userId && { userId }),
      }),
    });
  },

  listSessions(userId: string) {
    return request<SessionListItem[]>(
      `/api/v1/sessions?userId=${encodeURIComponent(userId)}`,
    );
  },

  getSession(sessionId: string, signal?: AbortSignal) {
    return request<SessionResponse>(`/api/v1/sessions/${sessionId}`, { signal });
  },

  startSession(sessionId: string) {
    return request<SessionResponse>(`/api/v1/sessions/${sessionId}/start`, {
      method: "POST",
    });
  },

  endSession(sessionId: string) {
    return request<SessionResponse>(`/api/v1/sessions/${sessionId}/end`, {
      method: "POST",
    });
  },

  getToken(roomName: string, participantName: string, sessionId?: string) {
    return request<TokenResponse>("/api/v1/token", {
      method: "POST",
      body: JSON.stringify({
        roomName,
        participantName,
        ...(sessionId && { sessionId }),
      }),
    });
  },

  async getScorecard(sessionId: string, signal?: AbortSignal): Promise<Scorecard> {
    const url = `${API_BASE}/api/v1/sessions/${sessionId}/scorecard`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      signal,
    });
    if (res.status === 202) {
      throw new ScorecardGeneratingError();
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(res.status, body.detail || res.statusText);
    }
    return res.json() as Promise<Scorecard>;
  },

  analyzeSpeech(sessionId: string, userText: string, agentQuestion: string) {
    return request<AnalyzeResponse>(
      `/api/v1/sessions/${sessionId}/analyze`,
      {
        method: "POST",
        body: JSON.stringify({ userText, agentQuestion }),
      },
    );
  },
};
