"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

interface FeedbackGaugeProps {
  value: number;
  label: string;
  size?: number;
  icon?: React.ReactNode;
}

export function FeedbackGauge({
  value,
  label,
  size = 80,
  icon,
}: FeedbackGaugeProps) {
  const circumference = Math.PI * (size - 8);
  const springValue = useSpring(value, { stiffness: 80, damping: 20 });
  const strokeDashoffset = useTransform(
    springValue,
    [0, 100],
    [circumference, 0]
  );

  const color =
    value >= 80
      ? "text-green-400"
      : value >= 60
        ? "text-amber-400"
        : "text-red-400";

  const strokeColor =
    value >= 80
      ? "stroke-green-400"
      : value >= 60
        ? "stroke-amber-400"
        : "stroke-red-400";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size / 2 + 8 }}>
        <svg
          width={size}
          height={size / 2 + 8}
          viewBox={`0 0 ${size} ${size / 2 + 8}`}
          className="overflow-visible"
        >
          {/* Background arc */}
          <path
            d={`M 4 ${size / 2 + 4} A ${(size - 8) / 2} ${(size - 8) / 2} 0 0 1 ${size - 4} ${size / 2 + 4}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-muted/50"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <motion.path
            d={`M 4 ${size / 2 + 4} A ${(size - 8) / 2} ${(size - 8) / 2} 0 0 1 ${size - 4} ${size / 2 + 4}`}
            fill="none"
            strokeWidth="4"
            className={strokeColor}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
          />
        </svg>
        {/* Value text */}
        <div className="absolute inset-0 flex items-end justify-center pb-0">
          {icon ? (
            <div className={cn("mb-1", color)}>{icon}</div>
          ) : (
            <span className={cn("font-mono text-lg font-bold", color)}>
              {value}
            </span>
          )}
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
