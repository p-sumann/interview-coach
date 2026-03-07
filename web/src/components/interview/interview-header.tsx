"use client";

import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import type { InterviewConfig, InterviewPhase } from "@/lib/types";
import { INTERVIEW_TYPE_CONFIGS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface InterviewHeaderProps {
  config: InterviewConfig;
  elapsedTime: string;
  phases: InterviewPhase[];
  currentPhase: number;
}

export function InterviewHeader({
  config,
  elapsedTime,
  phases,
  currentPhase,
}: InterviewHeaderProps) {
  const typeConfig = INTERVIEW_TYPE_CONFIGS.find(
    (t) => t.type === config.interviewType
  );

  return (
    <header className="flex items-center justify-between px-6 py-3 glass-strong border-b border-border/30">
      <div className="flex items-center gap-4">
        <Logo size="sm" />
        <div className="h-5 w-px bg-border/50" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {typeConfig?.displayName ?? "Interview"}
          </span>
        </div>
      </div>

      {/* Phase indicators (mock mode) */}
      {phases.length > 1 && (
        <div className="hidden md:flex items-center gap-1.5">
          {phases.map((phase) => (
            <div key={phase.phaseNumber} className="flex items-center gap-1.5">
              {phase.phaseNumber > 1 && (
                <div className="w-4 h-px bg-border/50" />
              )}
              <Badge
                variant={
                  phase.status === "active"
                    ? "default"
                    : phase.status === "complete"
                      ? "secondary"
                      : "outline"
                }
                className="text-[10px] px-2 py-0.5"
              >
                {phase.phaseType.toUpperCase()}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Timer + Theme */}
      <div className="flex items-center gap-3">
        <div className="font-mono text-sm tabular-nums text-muted-foreground">
          {elapsedTime}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-400">Connected</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
