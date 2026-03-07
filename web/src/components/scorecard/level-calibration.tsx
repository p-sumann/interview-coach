"use client";

import { motion } from "motion/react";
import type { LevelCalibration } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EXPERIENCE_LEVELS } from "@/lib/constants";
import { TrendingUp, TrendingDown } from "lucide-react";

interface LevelCalibrationProps {
  calibration: LevelCalibration;
}

export function LevelCalibrationCard({ calibration }: LevelCalibrationProps) {
  const calibratedIndex = EXPERIENCE_LEVELS.findIndex(
    (l) => l.level === calibration.calibratedLevel
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="glass rounded-xl p-6"
    >
      <h3 className="font-semibold mb-4">Level Calibration</h3>

      <div className="space-y-6">
        {/* Selected vs Calibrated */}
        <div className="flex flex-col sm:flex-row gap-4 text-sm">
          <div className="flex-1 rounded-lg bg-muted/50 p-3">
            <span className="text-muted-foreground">You selected:</span>
            <span className="ml-2 font-semibold capitalize">
              {calibration.selectedLevel}
            </span>
          </div>
          <div className="flex-1 rounded-lg bg-muted/50 p-3">
            <span className="text-muted-foreground">
              Performance calibrates to:
            </span>
            <span className="ml-2 font-semibold capitalize text-primary">
              {calibration.calibratedLevel}
            </span>
          </div>
        </div>

        {/* Level slider */}
        <div className="relative px-4">
          <div className="flex justify-between">
            {EXPERIENCE_LEVELS.map((level, i) => (
              <div key={level.level} className="flex flex-col items-center">
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 transition-all",
                    i === calibratedIndex
                      ? "bg-primary border-primary scale-125"
                      : i < calibratedIndex
                        ? "bg-primary/40 border-primary/40"
                        : "bg-muted border-border"
                  )}
                />
                <span
                  className={cn(
                    "text-xs mt-2",
                    i === calibratedIndex
                      ? "text-primary font-semibold"
                      : "text-muted-foreground"
                  )}
                >
                  {level.label}
                </span>
              </div>
            ))}
          </div>
          {/* Connecting line */}
          <div className="absolute top-2 left-8 right-8 h-px bg-border -z-10" />
        </div>

        {/* Theta path */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Difficulty path:</span>
          {calibration.thetaPath.map((theta, i) => (
            <span key={i} className="font-mono">
              {i > 0 && "→ "}Q{i + 1}: θ={theta.toFixed(1)}
            </span>
          ))}
        </div>

        {/* Strongest/Growth areas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 rounded-lg bg-green-500/10 p-3 border border-green-500/20">
            <TrendingUp className="h-5 w-5 text-green-400 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Strongest area</p>
              <p className="text-sm font-medium">
                {calibration.strongestArea}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg bg-amber-500/10 p-3 border border-amber-500/20">
            <TrendingDown className="h-5 w-5 text-amber-400 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">Growth area</p>
              <p className="text-sm font-medium">{calibration.growthArea}</p>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
          <p className="text-sm text-muted-foreground italic leading-relaxed">
            &ldquo;{calibration.recommendation}&rdquo;
          </p>
        </div>
      </div>
    </motion.div>
  );
}
