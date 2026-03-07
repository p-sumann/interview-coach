"use client";

import type { AgentState, InterviewPhase } from "@/lib/types";
import { Camera, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VideoPanelProps {
  agentState: AgentState;
  volumeLevel: number;
  currentQuestion: number;
  totalQuestions: number;
  currentPhase: InterviewPhase | undefined;
}

function SimulatedOrb({ agentState }: { agentState: AgentState }) {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="relative h-24 w-24">
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-primary/20 transition-all duration-700",
            agentState === "talking" && "animate-pulse scale-110 bg-primary/30",
            agentState === "thinking" && "animate-pulse scale-100 bg-amber-500/20",
            agentState === "listening" && "scale-90 bg-primary/10"
          )}
        />
        <div
          className={cn(
            "absolute inset-3 rounded-full bg-primary/30 transition-all duration-500",
            agentState === "talking" && "animate-pulse scale-105 bg-primary/40"
          )}
        />
        <div className="absolute inset-6 rounded-full bg-primary/50 flex items-center justify-center">
          <div
            className={cn(
              "h-3 w-3 rounded-full bg-primary transition-all",
              agentState === "talking" && "animate-ping"
            )}
          />
        </div>
      </div>
    </div>
  );
}

export function VideoPanel({
  agentState,
  currentQuestion,
  totalQuestions,
  currentPhase,
}: VideoPanelProps) {
  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Camera placeholder */}
      <div className="relative rounded-xl bg-muted/30 border border-border/30 aspect-[3/4] flex items-center justify-center overflow-hidden">
        <div className="flex flex-col items-center gap-2 text-muted-foreground/30">
          <User className="h-16 w-16" />
          <Camera className="h-5 w-5" />
        </div>
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500 live-pulse" />
          <span className="text-[10px] font-medium text-red-400 uppercase tracking-wider">
            Live
          </span>
        </div>
      </div>

      {/* Simulated audio orb (CSS-only replacement for Three.js VoiceOrb) */}
      <SimulatedOrb agentState={agentState} />

      {/* Question progress */}
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Question{" "}
          <span className="font-mono font-bold text-foreground">
            {currentQuestion}
          </span>{" "}
          of ~{totalQuestions}
        </p>

        {currentPhase && (
          <Badge variant="outline" className="text-xs">
            {currentPhase.interviewerName} · {currentPhase.role}
          </Badge>
        )}
      </div>
    </div>
  );
}
