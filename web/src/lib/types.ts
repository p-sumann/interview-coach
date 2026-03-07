
// ---- Setup / Config Types ----

export type InterviewType = "hr" | "behavioral" | "technical" | "mock";
export type ExperienceLevel = "junior" | "mid" | "senior" | "staff";
export type RoleType =
  | "backend"
  | "frontend"
  | "fullstack"
  | "data_ml"
  | "devops"
  | "mobile";
export type PrimaryLanguage =
  | "python"
  | "java"
  | "javascript"
  | "typescript"
  | "go"
  | "rust"
  | "cpp"
  | "csharp"
  | "kotlin"
  | "swift";

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
export type PostureStatus = "good" | "needs_work";
export type CoachingNoteType = "positive" | "suggestion" | "concern";
export type CoachingCategory =
  | "body_language"
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

export interface FeedbackState {
  confidence: number;
  eyeContact: number;
  pace: PaceLevel;
  posture: PostureStatus;
  fillerWords: number;
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

export interface SessionAnalytics {
  speakingTimePct: number;
  avgConfidence: number;
  avgEyeContact: number;
  fillerWordCount: number;
  fillerWordBreakdown: Record<string, number>;
  questionsAnswered: number;
  phasesCompleted: number;
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
