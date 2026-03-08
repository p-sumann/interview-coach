"use client";

import { motion } from "motion/react";
import type { CoachingNote } from "@/lib/types";
import { formatTime, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CoachingNoteCardProps {
  note: CoachingNote;
}

const borderColors: Record<CoachingNote["type"], string> = {
  positive: "border-l-green-400",
  suggestion: "border-l-amber-400",
  concern: "border-l-red-400",
};

const categoryLabels: Record<CoachingNote["category"], string> = {
  delivery: "Delivery",
  content: "Content",
  communication: "Communication",
  technical: "Technical",
};

export function CoachingNoteCard({ note }: CoachingNoteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-lg border-l-[3px] bg-muted/30 p-3",
        borderColors[note.type]
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          {categoryLabels[note.category]}
        </Badge>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          {formatTime(note.timestamp)}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {note.message}
      </p>
    </motion.div>
  );
}
