"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn, getScoreColor } from "@/lib/utils";

interface OverallScoreProps {
  score: number;
  summary: string;
}

export function OverallScore({ score, summary }: OverallScoreProps) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [score]);

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="glass rounded-2xl p-8 flex flex-col md:flex-row items-center gap-8"
    >
      <div className="relative flex-shrink-0">
        <svg width="140" height="140" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/50"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 60 60)"
            className={cn(
              "transition-all duration-1000",
              score >= 80
                ? "stroke-green-400"
                : score >= 60
                  ? "stroke-amber-400"
                  : "stroke-red-400"
            )}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              "font-mono text-4xl font-bold",
              getScoreColor(displayScore)
            )}
          >
            {displayScore}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <div className="text-center md:text-left space-y-2">
        <h2 className="text-xl font-semibold">Overall Score</h2>
        <p className="text-muted-foreground leading-relaxed max-w-md">
          {summary}
        </p>
      </div>
    </motion.div>
  );
}
