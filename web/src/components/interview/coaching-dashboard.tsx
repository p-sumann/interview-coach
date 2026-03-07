"use client";

import { motion } from "motion/react";
import type { FeedbackState, CoachingNote, PostureStatus } from "@/lib/types";
import { FeedbackGauge } from "./feedback-gauge";
import { MetricBar } from "./metric-bar";
import { PaceIndicator } from "./pace-indicator";
import { CoachingNotesFeed } from "./coaching-notes-feed";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Eye,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CoachingDashboardProps {
  feedback: FeedbackState;
  coachingNotes: CoachingNote[];
}

function PostureBadge({ status }: { status: PostureStatus }) {
  const isGood = status === "good";
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">Posture</span>
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full",
          isGood
            ? "bg-green-500/10 text-green-400"
            : "bg-amber-500/10 text-amber-400"
        )}
      >
        {isGood ? (
          <ShieldCheck className="h-3 w-3" />
        ) : (
          <ShieldAlert className="h-3 w-3" />
        )}
        {isGood ? "Good" : "Adjust"}
      </div>
    </div>
  );
}

function FillerCounter({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <AlertCircle className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Filler Words</span>
      </div>
      <span
        className={cn(
          "font-mono text-sm font-bold",
          count > 5 ? "text-red-400" : count > 2 ? "text-amber-400" : "text-green-400"
        )}
      >
        {count}
      </span>
    </div>
  );
}

export function CoachingDashboard({
  feedback,
  coachingNotes,
}: CoachingDashboardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="h-full flex flex-col"
    >
      <ScrollArea className="flex-1">
        <div className="space-y-5 p-4">
          {/* Title */}
          <h3 className="text-sm font-semibold tracking-tight">
            Live Coaching
          </h3>

          {/* Confidence gauge */}
          <div className="flex justify-center">
            <FeedbackGauge
              value={feedback.confidence}
              label="Confidence"
              size={120}
            />
          </div>

          {/* Eye contact bar */}
          <MetricBar
            label="Eye Contact"
            value={feedback.eyeContact}
            icon={<Eye className="h-3 w-3" />}
          />

          {/* Pace indicator */}
          <PaceIndicator pace={feedback.pace} />

          {/* Posture */}
          <PostureBadge status={feedback.posture} />

          {/* Filler words */}
          <FillerCounter count={feedback.fillerWords} />

          <Separator className="opacity-30" />

          {/* Coaching notes */}
          <CoachingNotesFeed notes={coachingNotes} />
        </div>
      </ScrollArea>
    </motion.div>
  );
}
