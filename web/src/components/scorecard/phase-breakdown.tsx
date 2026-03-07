"use client";

import { motion } from "motion/react";
import type { PhaseScore, InterviewType } from "@/lib/types";
import { cn, getScoreColor, getScoreBorderColor } from "@/lib/utils";
import { Handshake, Brain, Code } from "lucide-react";

interface PhaseBreakdownProps {
  phases: PhaseScore[];
}

const phaseIcons: Record<string, typeof Handshake> = {
  hr: Handshake,
  behavioral: Brain,
  technical: Code,
};

const phaseLabels: Record<InterviewType, string> = {
  hr: "HR",
  behavioral: "Behavioral",
  technical: "Technical",
  mock: "Mock",
};

export function PhaseBreakdown({ phases }: PhaseBreakdownProps) {
  return (
    <div className="glass rounded-xl p-6">
      <h3 className="font-semibold mb-4">Phase Breakdown</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {phases.map((phase, i) => {
          const Icon = phaseIcons[phase.phaseType] ?? Code;
          return (
            <motion.div
              key={phase.phaseType}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className={cn(
                "rounded-xl border-l-4 bg-muted/30 p-5",
                getScoreBorderColor(phase.score)
              )}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">
                  {phaseLabels[phase.phaseType]}
                </span>
              </div>
              <p
                className={cn(
                  "font-mono text-3xl font-bold mb-1",
                  getScoreColor(phase.score)
                )}
              >
                {phase.score}
              </p>
              <p className="text-xs text-muted-foreground mb-1">
                {phase.interviewerName}
              </p>
              <p className="text-xs text-muted-foreground/80 mb-3">
                {phase.summary}
              </p>
              <ul className="space-y-1">
                {phase.highlights.map((h, j) => (
                  <li
                    key={j}
                    className="text-xs text-muted-foreground/60 flex items-start gap-1.5"
                  >
                    <span className="text-primary mt-0.5">•</span>
                    {h}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
