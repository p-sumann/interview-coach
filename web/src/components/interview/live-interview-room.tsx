"use client";

import { motion } from "motion/react";
import {
  useAgent,
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
import { useInterviewTimer } from "@/hooks/use-interview-timer";
import { LiveCameraFeed } from "./live-camera-feed";
import { cn } from "@/lib/utils";

interface LiveInterviewRoomProps {
  config: InterviewConfig;
  onEndInterview: () => void;
}

export function LiveInterviewRoom({
  config,
  onEndInterview,
}: LiveInterviewRoomProps) {
  const agent = useAgent();
  const session = useSessionContext();
  const { messages } = useSessionMessages();
  const { feedback, coachingNotes } = useAgentFeedback();
  const isConnected = session.isConnected;
  const { formatted: elapsedTime } = useInterviewTimer(isConnected);

  const agentState = agent.state;
  const audioTrack =
    agent.state === "listening" ||
    agent.state === "thinking" ||
    agent.state === "speaking"
      ? agent.microphoneTrack
      : undefined;

  return (
    <div className="h-screen flex flex-col bg-background">
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
          animate={{ opacity: 1, x: 0 }}
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
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="overflow-hidden px-4"
        >
          <AgentChatTranscript
            agentState={agentState}
            messages={messages}
            className="h-full"
          />
        </motion.div>

        {/* Right: Coaching Dashboard */}
        <div className="border-l border-border/20 overflow-hidden">
          <CoachingDashboard
            feedback={feedback}
            coachingNotes={coachingNotes}
          />
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center px-6 py-4 border-t border-border/30">
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
      </div>
    </div>
  );
}
