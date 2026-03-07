import type {
  InterviewType,
  ExperienceLevel,
  RoleType,
  PrimaryLanguage,
} from "./types";

export interface InterviewTypeConfig {
  type: InterviewType;
  displayName: string;
  icon: string;
  description: string;
  defaultDurationMinutes: number;
  phases: number;
  badge?: string;
}

export const INTERVIEW_TYPE_CONFIGS: InterviewTypeConfig[] = [
  {
    type: "hr",
    displayName: "HR Interview",
    icon: "Handshake",
    description: "Culture fit, motivation, career goals",
    defaultDurationMinutes: 10,
    phases: 1,
  },
  {
    type: "behavioral",
    displayName: "Behavioral",
    icon: "Brain",
    description: "STAR-format, leadership, teamwork",
    defaultDurationMinutes: 15,
    phases: 1,
  },
  {
    type: "technical",
    displayName: "Technical",
    icon: "Code",
    description: "System design, coding concepts",
    defaultDurationMinutes: 20,
    phases: 1,
  },
  {
    type: "mock",
    displayName: "Mock Interview",
    icon: "Target",
    description: "Full round: HR + Behavioral + Technical",
    defaultDurationMinutes: 30,
    phases: 3,
  },
];

export const EXPERIENCE_LEVELS: Array<{
  level: ExperienceLevel;
  label: string;
  range: string;
}> = [
  { level: "junior", label: "Junior", range: "0-2 yr" },
  { level: "mid", label: "Mid", range: "2-5 yr" },
  { level: "senior", label: "Senior", range: "5-10 yr" },
  { level: "staff", label: "Staff+", range: "10+ yr" },
];

export const ROLE_TYPES: Array<{
  type: RoleType;
  label: string;
  icon: string;
}> = [
  { type: "backend", label: "Backend", icon: "Server" },
  { type: "frontend", label: "Frontend", icon: "Monitor" },
  { type: "fullstack", label: "Fullstack", icon: "Layers" },
  { type: "data_ml", label: "Data/ML", icon: "BrainCircuit" },
  { type: "devops", label: "DevOps", icon: "Container" },
  { type: "mobile", label: "Mobile", icon: "Smartphone" },
];

export const PRIMARY_LANGUAGES: Array<{
  value: PrimaryLanguage;
  label: string;
}> = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "kotlin", label: "Kotlin" },
  { value: "swift", label: "Swift" },
];

export const TARGET_ROLES = [
  "Software Engineer",
  "Senior Software Engineer",
  "Staff Software Engineer",
  "Engineering Manager",
  "Frontend Engineer",
  "Backend Engineer",
  "Fullstack Engineer",
  "Data Engineer",
  "ML Engineer",
  "DevOps Engineer",
  "SRE",
  "Mobile Engineer",
];

export const MOCK_INTERVIEW_PHASES = [
  {
    phaseNumber: 1,
    phaseType: "hr" as const,
    interviewerName: "Marcus Johnson",
    role: "Director of People",
  },
  {
    phaseNumber: 2,
    phaseType: "behavioral" as const,
    interviewerName: "Sarah Chen",
    role: "Senior Engineering Manager",
  },
  {
    phaseNumber: 3,
    phaseType: "technical" as const,
    interviewerName: "Alex Rivera",
    role: "Staff Software Engineer",
  },
];
