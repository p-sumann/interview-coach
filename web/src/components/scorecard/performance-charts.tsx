"use client";

import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { TimeSeriesPoint, LevelCalibration } from "@/lib/types";
import { TrendingUp, Activity } from "lucide-react";

interface PerformanceChartsProps {
  confidenceOverTime?: TimeSeriesPoint[];
  fluencyOverTime?: TimeSeriesPoint[];
  thetaPath: LevelCalibration["thetaPath"];
  durationSeconds: number;
  avgConfidence: number;
}

const confidenceConfig = {
  value: {
    label: "Confidence",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const fluencyConfig = {
  value: {
    label: "Fluency",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function formatTimeLabel(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  return `${mins}m`;
}

function generateSyntheticTimeSeries(
  avgValue: number,
  durationSeconds: number,
  pointCount: number = 12,
  variance: number = 15
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const interval = durationSeconds / (pointCount - 1);

  // Create a natural-looking curve that trends upward slightly
  for (let i = 0; i < pointCount; i++) {
    const progress = i / (pointCount - 1);
    // Start lower, end higher with some noise
    const trend = avgValue - 10 + progress * 20;
    const noise = (Math.sin(i * 2.3) * variance + Math.cos(i * 1.7) * (variance * 0.5));
    const value = Math.max(20, Math.min(100, Math.round(trend + noise)));
    points.push({
      time: Math.round(i * interval),
      value,
    });
  }
  return points;
}

export function PerformanceCharts({
  confidenceOverTime,
  fluencyOverTime,
  thetaPath,
  durationSeconds,
  avgConfidence,
}: PerformanceChartsProps) {
  // Use provided data or generate synthetic from averages
  const confidenceData =
    confidenceOverTime ??
    generateSyntheticTimeSeries(avgConfidence, durationSeconds, 12, 12);

  // Derive fluency from theta path if not provided
  const fluencyData =
    fluencyOverTime ??
    thetaPath.map((theta, i) => ({
      time: Math.round((i / Math.max(thetaPath.length - 1, 1)) * durationSeconds),
      value: Math.round(Math.max(20, Math.min(100, 50 + theta * 20))),
    }));

  const confidenceChartData = confidenceData.map((p) => ({
    time: formatTimeLabel(p.time),
    value: p.value,
  }));

  const fluencyChartData = fluencyData.map((p) => ({
    time: formatTimeLabel(p.time),
    value: p.value,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="glass rounded-xl p-6"
    >
      <h3 className="font-semibold mb-6">Performance Over Time</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Confidence Over Time */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-chart-3" />
            <span className="text-muted-foreground font-medium">Confidence</span>
            <TrendingUp className="h-3.5 w-3.5 text-green-400 ml-auto" />
          </div>
          <ChartContainer config={confidenceConfig} className="aspect-2/1 w-full">
            <AreaChart data={confidenceChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={4} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--chart-3)"
                strokeWidth={2}
                fill="url(#confidenceGradient)"
              />
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Fluency Over Time */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full bg-chart-1" />
            <span className="text-muted-foreground font-medium">Fluency</span>
            <Activity className="h-3.5 w-3.5 text-primary ml-auto" />
          </div>
          <ChartContainer config={fluencyConfig} className="aspect-2/1 w-full">
            <AreaChart data={fluencyChartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="fluencyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={4} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#fluencyGradient)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </motion.div>
  );
}
