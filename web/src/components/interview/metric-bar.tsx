"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

interface MetricBarProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
}

export function MetricBar({ label, value, icon }: MetricBarProps) {
  const springValue = useSpring(value, { stiffness: 80, damping: 20 });
  const width = useTransform(springValue, [0, 100], ["0%", "100%"]);

  const color =
    value >= 80
      ? "bg-green-400"
      : value >= 60
        ? "bg-amber-400"
        : "bg-red-400";

  const textColor =
    value >= 80
      ? "text-green-400"
      : value >= 60
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon && (
            <span className="text-muted-foreground">{icon}</span>
          )}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <span className={cn("font-mono text-xs font-semibold", textColor)}>
          {value}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", color)}
          style={{ width }}
        />
      </div>
    </div>
  );
}
