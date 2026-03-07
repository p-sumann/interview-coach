"use client";

import { motion } from "motion/react";
import type { PaceLevel } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PaceIndicatorProps {
  pace: PaceLevel;
}

const zones = [
  { key: "slow", label: "Slow", color: "bg-amber-400" },
  { key: "good", label: "Good", color: "bg-green-400" },
  { key: "fast", label: "Fast", color: "bg-red-400" },
] as const;

const dotPositions: Record<PaceLevel, string> = {
  slow: "left-[16.67%]",
  good: "left-[50%]",
  fast: "left-[83.33%]",
};

export function PaceIndicator({ pace }: PaceIndicatorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Speaking Pace</span>
        <span
          className={cn(
            "text-xs font-medium capitalize",
            pace === "good"
              ? "text-green-400"
              : pace === "slow"
                ? "text-amber-400"
                : "text-red-400"
          )}
        >
          {pace}
        </span>
      </div>

      <div className="relative">
        {/* Track */}
        <div className="flex h-2 rounded-full overflow-hidden gap-px">
          {zones.map((zone) => (
            <div
              key={zone.key}
              className={cn(
                "flex-1 transition-opacity",
                pace === zone.key ? zone.color : "bg-muted/50"
              )}
            />
          ))}
        </div>

        {/* Animated dot */}
        <motion.div
          className={cn(
            "absolute top-1/2 h-4 w-4 rounded-full border-2 border-card",
            pace === "good"
              ? "bg-green-400"
              : pace === "slow"
                ? "bg-amber-400"
                : "bg-red-400"
          )}
          animate={{
            left: pace === "slow" ? "16.67%" : pace === "good" ? "50%" : "83.33%",
            y: "-50%",
            x: "-50%",
          }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between">
        {zones.map((zone) => (
          <span
            key={zone.key}
            className={cn(
              "text-[10px]",
              pace === zone.key
                ? "text-foreground font-medium"
                : "text-muted-foreground/50"
            )}
          >
            {zone.label}
          </span>
        ))}
      </div>
    </div>
  );
}
