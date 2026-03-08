"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useAgent,
  useLocalParticipant,
  useSessionContext,
  useSessionMessages,
} from "@livekit/components-react";
import type { InterviewConfig } from "@/lib/types";
import { InterviewHeader } from "./interview-header";
import { AgentAudioVisualizerBar } from "@/components/agents-ui/agent-audio-visualizer-bar";
import { AgentChatTranscript } from "@/components/agents-ui/agent-chat-transcript";
import { AgentControlBar } from "@/components/agents-ui/agent-control-bar";
import { CoachingDashboard } from "./coaching-dashboard";
import { useAgentFeedback } from "@/hooks/use-agent-feedback";
import { useAudioAnalysis } from "@/hooks/use-audio-analysis";
import { useAgentEvents } from "@/hooks/use-agent-events";
import { useRealtimeFeedback } from "@/hooks/use-realtime-feedback";
import { useInterviewTimer } from "@/hooks/use-interview-timer";
import { LiveCameraFeed } from "./live-camera-feed";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle2 } from "lucide-react";

// Time (ms) to wait for the agent to join before treating it as a failure.
const AGENT_TIMEOUT_MS = 15_000;

interface LiveInterviewRoomProps {
  sessionId: string;
  config: InterviewConfig;
  onEndInterview: () => void;
  onAgentTimeout?: () => void;
}

const CONNECTING_STEPS = [
  "Connecting to session...",
  "Setting up audio & video...",
  "Waiting for interviewer...",
];

export function LiveInterviewRoom({
  sessionId,
  config,
  onEndInterview,
  onAgentTimeout,
}: LiveInterviewRoomProps) {
  const agent = useAgent();
  const session = useSessionContext();
  const { messages } = useSessionMessages();
  const { feedback, coachingNotes: agentCoachingNotes } = useAgentFeedback();
  const realtimeFeedback = useRealtimeFeedback(sessionId);
  useAgentEvents();

  // Client-side audio analysis using LiveKit's RTC audio pipeline
  // Skip analysis when agent is speaking (speaker audio leaks into mic)
  const { microphoneTrack } = useLocalParticipant();
  const localAudioTrack = microphoneTrack?.track;
  const isAgentSpeaking = agent.state === "speaking";
  const audioMetrics = useAudioAnalysis(localAudioTrack, isAgentSpeaking);

  // Merge client-side metrics with agent-side feedback
  // Client-side audio analysis holds last values when silent, so prefer it when available
  const mergedFeedback = {
    ...feedback,
    confidence:
      audioMetrics.confidence > 0
        ? audioMetrics.confidence
        : feedback.confidence,
    pace: audioMetrics.confidence > 0 ? audioMetrics.pace : feedback.pace,
    fillerWords: feedback.fillerWords + realtimeFeedback.fillerCount,
  };

  // Combine agent coaching notes with LLM-generated realtime coaching notes
  const allCoachingNotes = [...agentCoachingNotes, ...realtimeFeedback.coachingNotes]
    .sort((a, b) => a.timestamp - b.timestamp);

  // Filler word click → scroll to transcript message
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const handleFillerClick = useCallback((messageId: string) => {
    setHighlightMessageId(messageId);
  }, []);
  const handleHighlightComplete = useCallback(() => {
    setHighlightMessageId(null);
  }, []);

  const isConnected = session.isConnected;
  const { formatted: elapsedTime } = useInterviewTimer(isConnected);

  const agentState = agent.state;
  const audioTrack =
    agent.state === "listening" ||
    agent.state === "thinking" ||
    agent.state === "speaking"
      ? agent.microphoneTrack
      : undefined;

  // Connecting overlay: show until the agent is ready (listening/speaking/thinking)
  const agentReady =
    agentState === "listening" ||
    agentState === "speaking" ||
    agentState === "thinking";

  const [connectingPhase, setConnectingPhase] = useState(0);
  const [showRoom, setShowRoom] = useState(false);

  // Progress through connecting steps based on connection state
  useEffect(() => {
    if (showRoom) return;

    // Step 1 → 2: when connected to room
    if (isConnected && connectingPhase < 1) {
      const t = setTimeout(() => setConnectingPhase(1), 0);
      return () => clearTimeout(t);
    }
    // Step 2 → 3: shortly after connection (agent dispatching)
    if (isConnected && connectingPhase === 1) {
      const timer = setTimeout(() => setConnectingPhase(2), 800);
      return () => clearTimeout(timer);
    }
    // All done: agent is ready
    if (agentReady && connectingPhase >= 1) {
      const t1 = setTimeout(() => setConnectingPhase(3), 0);
      const t2 = setTimeout(() => setShowRoom(true), 600);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isConnected, agentReady, connectingPhase, showRoom]);

  // If the room is connected but the agent never joins, fire timeout callback.
  useEffect(() => {
    if (!isConnected || agentReady) return;

    const timer = setTimeout(() => {
      if (!agentReady) {
        onAgentTimeout?.();
      }
    }, AGENT_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [isConnected, agentReady, onAgentTimeout]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Connecting overlay */}
      <AnimatePresence>
        {!showRoom && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-8"
          >
            <Logo size="lg" />
            <div className="space-y-3 w-64">
              {CONNECTING_STEPS.map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 * i }}
                  className="flex items-center gap-3"
                >
                  {connectingPhase > i ? (
                    <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                  ) : connectingPhase === i ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-border/50 shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      connectingPhase >= i
                        ? "text-foreground"
                        : "text-muted-foreground/40",
                    )}
                  >
                    {step}
                  </span>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/60 mt-2">
              {config.targetRole} • {config.interviewType} interview
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <InterviewHeader
        config={config}
        elapsedTime={elapsedTime}
        phases={[]}
        currentPhase={1}
      />

      <div className="flex-1 grid grid-cols-[1fr_1.8fr_1.2fr] gap-0 overflow-hidden">
        {/* Left: Camera + Agent State */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: showRoom ? 1 : 0, x: showRoom ? 0 : -20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="border-r border-border/20 p-4 overflow-y-auto overflow-x-hidden"
        >
          <div className="flex flex-col gap-4 h-full">
            <LiveCameraFeed />

            {/* Agent state indicator */}
            <div className="flex flex-col items-center gap-3 py-4">
              <AgentAudioVisualizerBar
                state={agentState}
                audioTrack={audioTrack}
                barCount={5}
                className="h-12"
              />
              <span
                className={cn(
                  "text-xs font-medium capitalize tracking-wider",
                  agentState === "speaking"
                    ? "text-green-400"
                    : agentState === "thinking"
                      ? "text-amber-400"
                      : agentState === "listening"
                        ? "text-blue-400"
                        : "text-muted-foreground",
                )}
              >
                {agentState === "connecting"
                  ? "Waiting for agent..."
                  : agentState}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Center: Chat Transcript */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: showRoom ? 1 : 0, y: showRoom ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="overflow-hidden px-4"
        >
          <AgentChatTranscript
            agentState={agentState}
            messages={messages}
            className="h-full"
            highlightMessageId={highlightMessageId}
            onHighlightComplete={handleHighlightComplete}
          />
        </motion.div>

        {/* Right: Coaching Dashboard */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showRoom ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="border-l border-border/20 overflow-hidden"
        >
          <CoachingDashboard
            feedback={mergedFeedback}
            coachingNotes={allCoachingNotes}
            fillerInstances={realtimeFeedback.fillerInstances}
            onFillerClick={handleFillerClick}
          />
        </motion.div>
      </div>

      {/* Bottom controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: showRoom ? 1 : 0, y: showRoom ? 0 : 10 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex items-center justify-center px-6 py-4 border-t border-border/30"
      >
        <AgentControlBar
          variant="livekit"
          isConnected={isConnected}
          onDisconnect={onEndInterview}
          controls={{
            microphone: true,
            camera: true,
            screenShare: false,
            chat: true,
            leave: true,
          }}
        />
      </motion.div>
    </div>
  );
}
