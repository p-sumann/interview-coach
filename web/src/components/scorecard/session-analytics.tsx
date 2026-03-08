"use client";

import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { SessionAnalytics } from "@/lib/types";
import {
  MessageSquare,
  Gauge,
  AlertCircle,
  HelpCircle,
  Layers,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SessionAnalyticsCardProps {
  analytics: SessionAnalytics;
}

const speakingConfig = {
  candidate: {
    label: "You",
    color: "var(--chart-1)",
  },
  interviewer: {
    label: "Interviewer",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const fillerConfig = {
  count: {
    label: "Count",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

function getFillerSeverity(count: number): {
  label: string;
  color: string;
  icon: typeof TrendingUp;
} {
  if (count <= 3) return { label: "Excellent", color: "text-green-400", icon: TrendingDown };
  if (count <= 8) return { label: "Average", color: "text-amber-400", icon: Minus };
  return { label: "High", color: "text-red-400", icon: TrendingUp };
}

function getConfidenceLabel(confidence: number): {
  label: string;
  color: string;
} {
  if (confidence >= 80) return { label: "Strong", color: "text-green-400" };
  if (confidence >= 60) return { label: "Moderate", color: "text-amber-400" };
  return { label: "Developing", color: "text-red-400" };
}

export function SessionAnalyticsCard({ analytics }: SessionAnalyticsCardProps) {
  const speakingData = [
    { name: "candidate", value: analytics.speakingTimePct, fill: "var(--chart-1)" },
    { name: "interviewer", value: 100 - analytics.speakingTimePct, fill: "var(--chart-2)" },
  ];

  const fillerBreakdownEntries = Object.entries(analytics.fillerWordBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const fillerBarData = fillerBreakdownEntries.map(([word, count]) => ({
    word: `"${word}"`,
    count,
  }));

  const fillerSeverity = getFillerSeverity(analytics.fillerWordCount);
  const confidenceInfo = getConfidenceLabel(analytics.avgConfidence);
  const FillerIcon = fillerSeverity.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="glass rounded-xl p-6"
    >
      <h3 className="font-semibold mb-6">Session Analytics</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Speaking Time Donut */}
        <div className="rounded-xl bg-muted/30 p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Speaking Time Split</span>
          </div>
          <div className="flex items-center gap-6">
            <ChartContainer config={speakingConfig} className="h-[120px] w-[120px] shrink-0">
              <PieChart>
                <Pie
                  data={speakingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={52}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {speakingData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
            <div className="space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-chart-1" />
                  <span className="text-sm text-muted-foreground">You</span>
                </div>
                <span className="font-mono text-lg font-bold">{analytics.speakingTimePct}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-chart-2" />
                  <span className="text-sm text-muted-foreground">Interviewer</span>
                </div>
                <span className="font-mono text-lg font-bold">{100 - analytics.speakingTimePct}%</span>
              </div>
              <p className="text-xs text-muted-foreground/60 pt-1">
                {analytics.speakingTimePct > 65
                  ? "Consider giving the interviewer more space"
                  : analytics.speakingTimePct < 40
                    ? "Try to elaborate more in your answers"
                    : "Good balance of speaking time"}
              </p>
            </div>
          </div>
        </div>

        {/* Filler Words Breakdown */}
        <div className="rounded-xl bg-muted/30 p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filler Words</span>
            <div className="ml-auto flex items-center gap-1.5">
              <FillerIcon className={cn("h-3.5 w-3.5", fillerSeverity.color)} />
              <span className={cn("text-xs font-medium", fillerSeverity.color)}>
                {fillerSeverity.label}
              </span>
            </div>
          </div>
          <p className="font-mono text-3xl font-bold mb-3">{analytics.fillerWordCount}</p>
          {fillerBarData.length > 0 ? (
            <ChartContainer config={fillerConfig} className="h-[100px] w-full">
              <BarChart data={fillerBarData} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="word"
                  tickLine={false}
                  axisLine={false}
                  width={60}
                  tickMargin={4}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--chart-5)" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic">No filler words detected</p>
          )}
        </div>

        {/* Confidence */}
        <div className="rounded-xl bg-muted/30 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Average Confidence</span>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-mono text-3xl font-bold">{analytics.avgConfidence}%</span>
            <span className={cn("text-sm font-medium", confidenceInfo.color)}>
              {confidenceInfo.label}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${analytics.avgConfidence}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full",
                analytics.avgConfidence >= 80
                  ? "bg-green-400"
                  : analytics.avgConfidence >= 60
                    ? "bg-amber-400"
                    : "bg-red-400"
              )}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-xl bg-muted/30 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Interview Summary</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <HelpCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Questions Answered</p>
                  <p className="text-xs text-muted-foreground">Total responses given</p>
                </div>
              </div>
              <span className="font-mono text-2xl font-bold">{analytics.questionsAnswered}</span>
            </div>
            <div className="h-px bg-border/30" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-chart-2/10 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-chart-2" />
                </div>
                <div>
                  <p className="text-sm font-medium">Phases Completed</p>
                  <p className="text-xs text-muted-foreground">Interview sections</p>
                </div>
              </div>
              <span className="font-mono text-2xl font-bold">{analytics.phasesCompleted}</span>
            </div>
            {analytics.avgPace != null && (
              <>
                <div className="h-px bg-border/30" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-chart-4/10 flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-chart-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Speaking Pace</p>
                      <p className="text-xs text-muted-foreground">Words per minute</p>
                    </div>
                  </div>
                  <span className="font-mono text-2xl font-bold">{analytics.avgPace}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
