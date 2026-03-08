"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { getUserId } from "@/lib/user-id";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectableCard } from "./selectable-card";
import { CameraPreview } from "./camera-preview";
import type { InterviewConfig, InterviewType, RoleType } from "@/lib/types";
import { api } from "@/lib/api";
import {
  INTERVIEW_TYPE_CONFIGS,
  EXPERIENCE_LEVELS,
  ROLE_TYPES,
  PRIMARY_LANGUAGES,
  TARGET_ROLES,
  SYSTEM_DESIGN_COVERAGE,
} from "@/lib/constants";
import {
  Mic,
  Loader2,
  Handshake,
  Brain,
  Code,
  Server,
  Monitor,
  Layers,
  BrainCircuit,
  BarChart3,
  User,
  Briefcase,
  Zap,
  Clock,
  AlertTriangle,
} from "lucide-react";

const roleIcons: Record<string, typeof Server> = {
  Server,
  Monitor,
  Layers,
  BrainCircuit,
  BarChart3,
};

const interviewIcons: Record<string, typeof Handshake> = {
  Handshake,
  Brain,
  Code,
};

interface SetupFormProps {
  defaultInterviewType?: string | null;
}

const TARGET_ROLE_TO_ROLE_TYPE: Record<string, string> = {
  "ML Engineer": "ai_ml",
  "AI Engineer": "ai_ml",
  "Data Engineer": "data",
  "Data Scientist": "data",
  "Frontend Engineer": "frontend",
  "Backend Engineer": "backend",
  "Fullstack Engineer": "fullstack",
};

const ROLE_TYPE_LABELS: Record<string, string> = {
  backend: "backend",
  frontend: "frontend",
  fullstack: "fullstack",
  ai_ml: "AI/ML",
  data: "data",
};

export function SetupForm({ defaultInterviewType }: SetupFormProps) {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof InterviewConfig, string>>>({});
  const [config, setConfig] = useState<InterviewConfig>({
    candidateName: "",
    targetRole: "",
    experienceLevel: "mid",
    roleType: "backend",
    primaryLanguage: "python",
    techStack: [],
    interviewType: (defaultInterviewType as InterviewType) || "technical",
  });

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof InterviewConfig, string>> = {};
    if (!config.candidateName.trim()) {
      newErrors.candidateName = "Name is required";
    }
    if (!config.targetRole) {
      newErrors.targetRole = "Please select a target role";
    }
    setErrors(newErrors);

    const firstErrorKey = Object.keys(newErrors)[0] as keyof InterviewConfig | undefined;
    if (firstErrorKey) {
      const fieldMap: Partial<Record<keyof InterviewConfig, string>> = {
        candidateName: "name",
        targetRole: "target-role",
      };
      const el = document.getElementById(fieldMap[firstErrorKey] ?? "");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el?.tagName === "INPUT") el.focus();
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleStart = async () => {
    if (!validate()) return;
    setIsStarting(true);
    try {
      const session = await api.createSession(config, getUserId());
      router.push(`/interview/${session.id}`);
    } catch {
      const params = new URLSearchParams();
      params.set("name", config.candidateName || "Candidate");
      params.set("role", config.targetRole || "Software Engineer");
      params.set("level", config.experienceLevel);
      params.set("roleType", config.roleType);
      params.set("lang", config.primaryLanguage);
      params.set("type", config.interviewType);
      if (config.techStack.length > 0) {
        params.set("stack", config.techStack.join(","));
      }
      router.push(`/interview/offline?${params.toString()}`);
    } finally {
      setIsStarting(false);
    }
  };

  const selectedTypeConfig = INTERVIEW_TYPE_CONFIGS.find(
    (c) => c.type === config.interviewType
  );

  return (
    <div className="space-y-6">
      {/* Section 1: About You */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <User className="h-4 w-4 text-primary" />
          About You
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">Your Name</Label>
          <Input
            id="name"
            placeholder="Suman"
            value={config.candidateName}
            onChange={(e) => {
              setConfig((c) => ({ ...c, candidateName: e.target.value }));
              if (errors.candidateName) setErrors((prev) => ({ ...prev, candidateName: undefined }));
            }}
            className={errors.candidateName ? "border-destructive" : ""}
          />
          {errors.candidateName && (
            <p className="text-xs text-destructive">{errors.candidateName}</p>
          )}
        </div>

        {/* Target Role */}
        <div className="space-y-2">
          <Label>Target Role</Label>
          <Select
            value={config.targetRole}
            onValueChange={(v) => {
              const suggestedRole = TARGET_ROLE_TO_ROLE_TYPE[v] as RoleType | undefined;
              setConfig((c) => ({
                ...c,
                targetRole: v,
                ...(suggestedRole ? { roleType: suggestedRole } : {}),
              }));
              if (errors.targetRole) setErrors((prev) => ({ ...prev, targetRole: undefined }));
            }}
          >
            <SelectTrigger id="target-role" className={errors.targetRole ? "border-destructive" : ""}>
              <SelectValue placeholder="Select a role..." />
            </SelectTrigger>
            <SelectContent>
              {TARGET_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.targetRole && (
            <p className="text-xs text-destructive">{errors.targetRole}</p>
          )}
        </div>

        {/* Experience Level */}
        <div className="space-y-2">
          <Label>Experience Level</Label>
          <div className="grid grid-cols-4 gap-2">
            {EXPERIENCE_LEVELS.map((level) => (
              <SelectableCard
                key={level.level}
                selected={config.experienceLevel === level.level}
                onClick={() =>
                  setConfig((c) => ({
                    ...c,
                    experienceLevel: level.level,
                  }))
                }
                className="text-center py-3"
              >
                <p className="text-sm font-medium">{level.label}</p>
                <p className="text-[10px] text-muted-foreground">
                  {level.range}
                </p>
              </SelectableCard>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Section 2: Technical Profile */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
        className="glass rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Briefcase className="h-4 w-4 text-primary" />
          Technical Profile
        </div>

        {/* Role Type */}
        <div className="space-y-2">
          <Label>Role Type</Label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {ROLE_TYPES.map((rt) => {
              const Icon = roleIcons[rt.icon] ?? Server;
              return (
                <SelectableCard
                  key={rt.type}
                  selected={config.roleType === rt.type}
                  onClick={() =>
                    setConfig((c) => ({ ...c, roleType: rt.type }))
                  }
                  className="flex flex-col items-center gap-1.5 py-3"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">{rt.label}</span>
                </SelectableCard>
              );
            })}
          </div>
          {config.targetRole &&
            TARGET_ROLE_TO_ROLE_TYPE[config.targetRole] &&
            TARGET_ROLE_TO_ROLE_TYPE[config.targetRole] !== config.roleType && (
              <p className="text-xs text-amber-400/80 mt-1.5">
                Your background is {ROLE_TYPE_LABELS[config.roleType] ?? config.roleType} but
                you&apos;re targeting {config.targetRole} — the interviewer will
                tailor questions accordingly.
              </p>
            )}
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label>Primary Language</Label>
          <Select
            value={config.primaryLanguage}
            onValueChange={(v) =>
              setConfig((c) => ({
                ...c,
                primaryLanguage: v as InterviewConfig["primaryLanguage"],
              }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIMARY_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tech Stack */}
        <div className="space-y-2">
          <Label htmlFor="stack">Tech Stack (optional)</Label>
          <Input
            id="stack"
            placeholder="Django, PostgreSQL, Redis, Docker"
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                techStack: e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              }))
            }
          />
        </div>
      </motion.section>

      {/* Section 3: Interview Type + Camera side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Interview Type */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="glass rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Zap className="h-4 w-4 text-primary" />
            Interview Type
          </div>

          <div className="grid grid-cols-2 gap-3">
            {INTERVIEW_TYPE_CONFIGS.map((it) => {
              const Icon = interviewIcons[it.icon] ?? Code;
              return (
                <SelectableCard
                  key={it.type}
                  selected={config.interviewType === it.type}
                  onClick={() =>
                    setConfig((c) => ({ ...c, interviewType: it.type }))
                  }
                  badge={it.badge}
                  className="py-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">
                      {it.displayName}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {it.description}
                  </p>
                </SelectableCard>
              );
            })}
          </div>

          {selectedTypeConfig && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 pt-1">
              <Clock className="h-3 w-3" />
              ~{selectedTypeConfig.defaultDurationMinutes} min &middot;{" "}
              {selectedTypeConfig.phases} phase
              {selectedTypeConfig.phases > 1 ? "s" : ""}
            </div>
          )}
        </motion.section>

        {/* Camera */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Monitor className="h-4 w-4 text-primary" />
            Camera Check
          </div>
          <CameraPreview />
        </motion.section>
      </div>

      {/* Coverage warning */}
      {config.interviewType === "technical" &&
        !SYSTEM_DESIGN_COVERAGE[config.roleType]?.includes(config.experienceLevel) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3"
          >
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-400/80 leading-relaxed">
              System design questions for{" "}
              <span className="font-medium text-amber-400">
                {ROLE_TYPE_LABELS[config.roleType] ?? config.roleType}
              </span>{" "}
              at{" "}
              <span className="font-medium text-amber-400">{config.experienceLevel}</span>{" "}
              level will be generated by the AI interviewer in real-time.
            </p>
          </motion.div>
        )}

      {/* Submit */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24 }}
      >
        <Button
          size="lg"
          className="w-full text-lg h-14 gap-3 pulse-glow cursor-pointer"
          onClick={handleStart}
          disabled={isStarting}
        >
          {isStarting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
          {isStarting ? "Setting up..." : "Start Interview"}
        </Button>
      </motion.div>
    </div>
  );
}
