"use client";

import { motion } from "motion/react";
import type { KeyMoment } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";

interface KeyMomentsProps {
  moments: KeyMoment[];
}

const typeColors = {
  positive: "bg-green-400",
  suggestion: "bg-amber-400",
  concern: "bg-red-400",
} as const;

const typeBorderColors = {
  positive: "border-green-400/30",
  suggestion: "border-amber-400/30",
  concern: "border-red-400/30",
} as const;

export function KeyMoments({ moments }: KeyMomentsProps) {
  return (
    <div className="glass rounded-xl p-6">
      <h3 className="font-semibold mb-6">Key Moments</h3>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

        <div className="space-y-4">
          {moments.map((moment, i) => (
            <motion.div
              key={moment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              className="flex items-start gap-4 relative"
            >
              {/* Dot */}
              <div
                className={cn(
                  "h-[10px] w-[10px] rounded-full mt-1.5 flex-shrink-0 z-10 ring-4 ring-card",
                  typeColors[moment.type]
                )}
              />
              {/* Content */}
              <div
                className={cn(
                  "flex-1 rounded-lg border p-3",
                  typeBorderColors[moment.type]
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatTime(moment.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {moment.message}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
