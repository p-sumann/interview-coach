"use client";

import { motion } from "motion/react";
import type { InterviewPhase } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface PhaseProgressProps {
  phases: InterviewPhase[];
}

export function PhaseProgress({ phases }: PhaseProgressProps) {
  if (phases.length <= 1) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="flex items-center justify-center gap-2 px-6"
    >
      {phases.map((phase, i) => (
        <div key={phase.phaseNumber} className="flex items-center gap-2">
          {/* Step circle */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                phase.status === "complete"
                  ? "bg-primary text-primary-foreground"
                  : phase.status === "active"
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted/50 text-muted-foreground border border-border/50"
              )}
            >
              {phase.status === "complete" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                phase.phaseNumber
              )}
            </div>
            <div className="hidden sm:block">
              <p
                className={cn(
                  "text-xs font-medium",
                  phase.status === "active"
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {phase.interviewerName}
              </p>
              <p className="text-[10px] text-muted-foreground capitalize">
                {phase.phaseType}
              </p>
            </div>
          </div>

          {/* Connector line */}
          {i < phases.length - 1 && (
            <div
              className={cn(
                "w-8 h-px",
                phase.status === "complete" ? "bg-primary" : "bg-border/50"
              )}
            />
          )}
        </div>
      ))}
    </motion.div>
  );
}
