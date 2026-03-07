"use client";

import { motion } from "motion/react";
import type { SessionAnalytics } from "@/lib/types";
import {
  MessageSquare,
  Gauge,
  Eye,
  AlertCircle,
  HelpCircle,
  Layers,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SessionAnalyticsCardProps {
  analytics: SessionAnalytics;
}

export function SessionAnalyticsCard({ analytics }: SessionAnalyticsCardProps) {
  const stats = [
    {
      label: "Speaking Time",
      value: `${analytics.speakingTimePct}%`,
      sublabel: `You ${analytics.speakingTimePct}% | Interviewer ${100 - analytics.speakingTimePct}%`,
      icon: MessageSquare,
    },
    {
      label: "Avg Confidence",
      value: `${analytics.avgConfidence}%`,
      icon: Gauge,
    },
    {
      label: "Eye Contact",
      value: `${analytics.avgEyeContact}%`,
      icon: Eye,
    },
    {
      label: "Filler Words",
      value: `${analytics.fillerWordCount}`,
      sublabel: Object.entries(analytics.fillerWordBreakdown)
        .map(([word, count]) => `${word}: ${count}`)
        .join(", "),
      icon: AlertCircle,
    },
    {
      label: "Questions Answered",
      value: `${analytics.questionsAnswered}`,
      icon: HelpCircle,
    },
    {
      label: "Phases Completed",
      value: `${analytics.phasesCompleted}`,
      icon: Layers,
    },
  ];

  return (
    <div className="glass rounded-xl p-6">
      <h3 className="font-semibold mb-4">Session Analytics</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.05 * i }}
            className="rounded-lg bg-muted/50 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {stat.label}
              </span>
            </div>
            <p className="font-mono text-2xl font-bold">{stat.value}</p>
            {stat.sublabel && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground/60 mt-1 truncate cursor-help">
                    {stat.sublabel}
                  </p>
                </TooltipTrigger>
                <TooltipContent>{stat.sublabel}</TooltipContent>
              </Tooltip>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
