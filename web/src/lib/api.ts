import type {
  InterviewConfig,
  SessionResponse,
  TokenResponse,
  Scorecard,
  HealthResponse,
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

  createSession(config: InterviewConfig) {
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
      }),
    });
  },

  getSession(sessionId: string) {
    return request<SessionResponse>(`/api/v1/sessions/${sessionId}`);
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

  getScorecard(sessionId: string) {
    return request<Scorecard>(`/api/v1/sessions/${sessionId}/scorecard`);
  },
};
