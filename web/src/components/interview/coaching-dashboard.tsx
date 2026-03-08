"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { FeedbackState, CoachingNote, FillerWordInstance } from "@/lib/types";
import { FeedbackGauge } from "./feedback-gauge";
import { PaceIndicator } from "./pace-indicator";
import { CoachingNotesFeed } from "./coaching-notes-feed";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoachingDashboardProps {
  feedback: FeedbackState;
  coachingNotes: CoachingNote[];
  fillerInstances?: FillerWordInstance[];
  onFillerClick?: (messageId: string) => void;
}

function FillerSection({
  count,
  instances,
  onFillerClick,
}: {
  count: number;
  instances: FillerWordInstance[];
  onFillerClick?: (messageId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Group instances by word for summary pills
  const grouped = instances.reduce<Record<string, FillerWordInstance[]>>(
    (acc, inst) => {
      const key = inst.word.toLowerCase();
      (acc[key] ??= []).push(inst);
      return acc;
    },
    {},
  );
  const sortedGroups = Object.entries(grouped).sort(
    ([, a], [, b]) => b.length - a.length,
  );

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => instances.length > 0 && setExpanded((e) => !e)}
        className={cn(
          "flex w-full items-center justify-between",
          instances.length > 0 && "cursor-pointer hover:opacity-80",
        )}
      >
        <div className="flex items-center gap-1.5">
          <AlertCircle className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Filler Words</span>
          {instances.length > 0 && (
            <ChevronDown
              className={cn(
                "h-3 w-3 text-muted-foreground/60 transition-transform duration-200",
                expanded && "rotate-180",
              )}
            />
          )}
        </div>
        <span
          className={cn(
            "font-mono text-sm font-bold",
            count > 5
              ? "text-red-400"
              : count > 2
                ? "text-amber-400"
                : "text-green-400",
          )}
        >
          {count}
        </span>
      </button>

      <AnimatePresence>
        {expanded && instances.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Summary pills */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {sortedGroups.map(([word, items]) => (
                <span
                  key={word}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    items.length >= 3
                      ? "bg-red-400/10 text-red-400"
                      : items.length >= 2
                        ? "bg-amber-400/10 text-amber-400"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  &ldquo;{word}&rdquo;
                  <span className="font-mono">&times;{items.length}</span>
                </span>
              ))}
            </div>

            {/* Individual instances — clickable to jump to transcript */}
            <ScrollArea className="max-h-[120px]">
              <div className="space-y-1">
                {instances.map((inst) => {
                  const time = new Date(inst.timestamp);
                  const timeStr = time.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                  return (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => onFillerClick?.(inst.messageId)}
                      className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                        {timeStr}
                      </span>
                      <span className="text-xs text-amber-400 font-medium">
                        &ldquo;{inst.word}&rdquo;
                      </span>
                      <span className="text-[10px] text-muted-foreground/40 ml-auto">
                        click to view
                      </span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CoachingDashboard({
  feedback,
  coachingNotes,
  fillerInstances = [],
  onFillerClick,
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

          {/* Pace indicator */}
          <PaceIndicator pace={feedback.pace} />

          {/* Filler words with detail */}
          <FillerSection
            count={feedback.fillerWords}
            instances={fillerInstances}
            onFillerClick={onFillerClick}
          />

          <Separator className="opacity-30" />

          {/* Coaching notes */}
          <CoachingNotesFeed notes={coachingNotes} />
        </div>
      </ScrollArea>
    </motion.div>
  );
}
