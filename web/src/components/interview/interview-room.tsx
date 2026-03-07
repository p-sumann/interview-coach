"use client";

import { motion } from "motion/react";
import type { SimulatedInterviewState, InterviewConfig } from "@/lib/types";
import { InterviewHeader } from "./interview-header";
import { VideoPanel } from "./video-panel";
import { TranscriptPanel } from "./transcript-panel";
import { CoachingDashboard } from "./coaching-dashboard";
import { InterviewControls } from "./interview-controls";
import { PhaseProgress } from "./phase-progress";

interface InterviewRoomProps {
  state: SimulatedInterviewState;
  config: InterviewConfig;
  elapsedTime: string;
  onEndInterview: () => void;
}

export function InterviewRoom({
  state,
  config,
  elapsedTime,
  onEndInterview,
}: InterviewRoomProps) {
  const currentPhase = state.phases.find(
    (p) => p.phaseNumber === state.currentPhase
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <InterviewHeader
        config={config}
        elapsedTime={elapsedTime}
        phases={state.phases}
        currentPhase={state.currentPhase}
      />

      {/* Phase progress (mock mode) */}
      {state.phases.length > 1 && (
        <div className="py-2 border-b border-border/20">
          <PhaseProgress phases={state.phases} />
        </div>
      )}

      {/* Main 3-column grid */}
      <div className="flex-1 grid grid-cols-[1fr_1.8fr_1.2fr] gap-0 overflow-hidden">
        {/* Left: Video + Orb */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="border-r border-border/20 p-4 overflow-y-auto overflow-x-hidden"
        >
          <VideoPanel
            agentState={state.agentState}
            volumeLevel={state.volumeLevel}
            currentQuestion={state.currentQuestion}
            totalQuestions={state.totalQuestions}
            currentPhase={currentPhase}
          />
        </motion.div>

        {/* Center: Transcript */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="overflow-hidden px-4"
        >
          <TranscriptPanel
            messages={state.transcript}
            agentState={state.agentState}
          />
        </motion.div>

        {/* Right: Coaching Dashboard */}
        <div className="border-l border-border/20 overflow-hidden">
          <CoachingDashboard
            feedback={state.feedback}
            coachingNotes={state.coachingNotes}
          />
        </div>
      </div>

      {/* Bottom controls */}
      <InterviewControls onEndInterview={onEndInterview} />
    </div>
  );
}
