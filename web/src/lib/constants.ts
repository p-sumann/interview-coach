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
    displayName: "HR Screening",
    icon: "Handshake",
    description: "Culture fit, motivation, career goals",
    defaultDurationMinutes: 5,
    phases: 1,
  },
  {
    type: "behavioral",
    displayName: "Behavioral",
    icon: "Brain",
    description: "STAR-format, leadership, teamwork",
    defaultDurationMinutes: 10,
    phases: 1,
  },
  {
    type: "technical",
    displayName: "Technical",
    icon: "Code",
    description: "System design, coding concepts",
    defaultDurationMinutes: 10,
    phases: 1,
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
  { type: "ai_ml", label: "AI/ML", icon: "BrainCircuit" },
  { type: "data", label: "Data", icon: "BarChart3" },
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
];

export const TARGET_ROLES = [
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Fullstack Engineer",
  "ML Engineer",
  "AI Engineer",
  "Data Engineer",
  "Data Scientist",
];

/** Which roleType + experienceLevel combos have system_design question bank coverage. */
export const SYSTEM_DESIGN_COVERAGE: Record<RoleType, ExperienceLevel[]> = {
  backend: ["junior", "mid", "senior", "staff"],
  frontend: ["junior", "mid", "senior", "staff"],
  fullstack: ["junior", "mid", "senior", "staff"],
  ai_ml: ["junior", "mid", "senior", "staff"],
  data: ["junior", "mid", "senior", "staff"],
};

