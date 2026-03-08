
// ---- Setup / Config Types ----

export type InterviewType = "hr" | "behavioral" | "technical";
export type ExperienceLevel = "junior" | "mid" | "senior" | "staff";
export type RoleType =
  | "backend"
  | "frontend"
  | "fullstack"
  | "ai_ml"
  | "data";
export type PrimaryLanguage =
  | "python"
  | "java"
  | "javascript"
  | "typescript"
  | "go";

export interface InterviewConfig {
  candidateName: string;
  targetRole: string;
  experienceLevel: ExperienceLevel;
  roleType: RoleType;
  primaryLanguage: PrimaryLanguage;
  techStack: string[];
  interviewType: InterviewType;
}

// ---- Interview Room Types ----

export type InterviewStatus =
  | "connecting"
  | "waiting"
  | "active"
  | "ending"
  | "complete";

export type AgentState = "idle" | "listening" | "thinking" | "talking";

export type PaceLevel = "slow" | "good" | "fast";
export type CoachingNoteType = "positive" | "suggestion" | "concern";
export type CoachingCategory =
  | "delivery"
  | "content"
  | "communication"
  | "technical";

export interface TranscriptMessage {
  id: string;
  role: "agent" | "user";
  content: string;
  timestamp: number;
  persona?: string;
}

export interface FillerWordInstance {
  id: string;
  word: string;
  timestamp: number;
  /** ID of the transcript message where this filler was detected */
  messageId: string;
}

export interface FeedbackState {
  confidence: number;
  pace: PaceLevel;
  fillerWords: number;
  fillerInstances: FillerWordInstance[];
}

export interface CoachingNote {
  id: string;
  timestamp: number;
  type: CoachingNoteType;
  message: string;
  category: CoachingCategory;
}

export interface InterviewPhase {
  phaseNumber: number;
  phaseType: InterviewType;
  interviewerName: string;
  role: string;
  status: "pending" | "active" | "complete";
}

// ---- Scorecard Types ----

export interface Scorecard {
  sessionId: string;
  interviewType: InterviewType;
  overallScore: number;
  overallSummary: string;
  categories: CategoryScore[];
  strengths: string[];
  improvements: string[];
  keyMoments: KeyMoment[];
  analytics: SessionAnalytics;
  phaseScores: PhaseScore[];
  levelCalibration: LevelCalibration;
  generatedAt: string;
  config: InterviewConfig;
  durationSeconds: number;
}

export interface CategoryScore {
  name: string;
  score: number;
  description: string;
}

export interface KeyMoment {
  id: string;
  timestamp: number;
  type: CoachingNoteType;
  message: string;
}

export interface TimeSeriesPoint {
  time: number; // seconds into interview
  value: number;
}

export interface SessionAnalytics {
  speakingTimePct: number;
  avgConfidence: number;
  fillerWordCount: number;
  fillerWordBreakdown: Record<string, number>;
  questionsAnswered: number;
  phasesCompleted: number;
  confidenceOverTime?: TimeSeriesPoint[];
  fluencyOverTime?: TimeSeriesPoint[];
  avgPace?: number; // words per minute
}

export interface PhaseScore {
  phaseType: InterviewType;
  interviewerName: string;
  score: number;
  summary: string;
  highlights: string[];
}

export interface LevelCalibration {
  selectedLevel: ExperienceLevel;
  calibratedLevel: ExperienceLevel;
  thetaPath: number[];
  strongestArea: string;
  growthArea: string;
  recommendation: string;
}

// ---- API Response Types ----

export interface SessionResponse {
  id: string;
  roomName: string;
  status: InterviewStatus | "created" | "failed";
  currentPhaseNumber: number;
  candidateName: string;
  targetRole: string;
  experienceLevel: ExperienceLevel;
  roleType: RoleType;
  primaryLanguage: PrimaryLanguage;
  techStack: string[];
  interviewType: InterviewType;
  phases: InterviewPhase[];
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

export interface SessionListItem {
  id: string;
  status: InterviewStatus | "created" | "failed";
  interviewType: InterviewType;
  targetRole: string;
  experienceLevel: ExperienceLevel;
  candidateName: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  overallScore: number | null;
}

export interface TokenResponse {
  token: string;
  url: string;
}

export interface HealthResponse {
  status: "healthy" | "degraded";
  database: string;
  redis: string;
  version: string;
}

// ---- Analyze Types ----

export interface AnalyzeResponse {
  fillerWords: string[];
  fillerCount: number;
  repeatedWords: string[];
  relevanceNote: string;
  coachingTip: string;
}

// ---- Simulation Types ----

export interface SimulatedInterviewState {
  status: InterviewStatus;
  transcript: TranscriptMessage[];
  feedback: FeedbackState;
  coachingNotes: CoachingNote[];
  currentQuestion: number;
  totalQuestions: number;
  currentPhase: number;
  phases: InterviewPhase[];
  agentState: AgentState;
  volumeLevel: number;
}
