"use client";

import { motion } from "motion/react";
import {
  CheckCircle2,
  Wrench,
  Trophy,
  BarChart3,
  Target,
  TrendingUp,
} from "lucide-react";
import { MOCK_SCORECARD } from "@/lib/mock-data";

const scorecard = MOCK_SCORECARD;

const categoryColors: Record<string, string> = {
  Communication: "bg-blue-400",
  Technical: "bg-violet-400",
  "Vocal Delivery": "bg-amber-400",
  "Overall Presence": "bg-green-400",
};

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const color =
    score >= 80
      ? "text-green-400 stroke-green-400"
      : score >= 60
        ? "text-amber-400 stroke-amber-400"
        : "text-red-400 stroke-red-400";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={4}
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          className={color}
          initial={{ strokeDashoffset: circumference }}
          whileInView={{ strokeDashoffset: circumference * (1 - score / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-bold font-mono ${color.split(" ")[0]}`}>
          {score}
        </span>
        <span className="text-[8px] text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

export function ScorePreview() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary mb-4">
            <BarChart3 className="h-3 w-3" />
            Performance Analytics
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Detailed Performance Scorecard
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            See exactly where you stand after every practice session
          </p>
        </motion.div>

        {/* Scorecard card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative"
        >
          {/* Glow */}
          <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-3xl" />

          <div className="relative glass rounded-2xl border border-border/40 overflow-hidden shadow-2xl">
            {/* Header bar */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/30 bg-card/50">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                Scorecard — Senior Software Engineer
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <Trophy className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] text-amber-400 font-medium">
                  {scorecard.overallScore}/100
                </span>
              </div>
            </div>

            {/* Main content */}
            <div className="p-5">
              {/* Top: Score ring + Categories */}
              <div className="grid grid-cols-[auto_1fr] gap-6 mb-5">
                {/* Left: Ring + summary */}
                <div className="flex flex-col items-center gap-2">
                  <ScoreRing score={scorecard.overallScore} />
                  <p className="text-[10px] text-muted-foreground text-center max-w-[120px] leading-relaxed">
                    Overall Score
                  </p>
                </div>

                {/* Right: Category bars */}
                <div className="space-y-2.5 pt-1">
                  {scorecard.categories.map((cat, i) => (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-muted-foreground">
                          {cat.name}
                        </span>
                        <span className="text-[11px] font-mono font-medium">
                          {cat.score}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${cat.score}%` }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.8,
                            delay: 0.5 + i * 0.1,
                            ease: "easeOut",
                          }}
                          className={`h-full rounded-full ${categoryColors[cat.name] ?? "bg-primary"}`}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Phase scores */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.8 }}
                className="flex gap-2 mb-5"
              >
                {scorecard.phaseScores.map((phase) => {
                  const color =
                    phase.score >= 80
                      ? "text-green-400 border-green-400/20 bg-green-400/5"
                      : "text-amber-400 border-amber-400/20 bg-amber-400/5";
                  return (
                    <div
                      key={phase.phaseType}
                      className={`flex-1 rounded-lg border px-3 py-2 text-center ${color}`}
                    >
                      <p className="text-[10px] text-muted-foreground capitalize">
                        {phase.phaseType}
                      </p>
                      <p className="text-sm font-bold font-mono">
                        {phase.score}
                      </p>
                    </div>
                  );
                })}
                {/* Level calibration chip */}
                <div className="flex-1 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-center">
                  <p className="text-[10px] text-muted-foreground">
                    Calibrated
                  </p>
                  <div className="flex items-center justify-center gap-1">
                    <Target className="h-3 w-3 text-primary" />
                    <p className="text-sm font-bold text-primary capitalize">
                      {scorecard.levelCalibration.calibratedLevel}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Strengths + Improvements */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 1.0 }}
                className="grid grid-cols-2 gap-4"
              >
                {/* Strengths */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp className="h-3 w-3 text-green-400" />
                    <span className="text-[10px] font-medium text-green-400">
                      Strengths
                    </span>
                  </div>
                  {scorecard.strengths.slice(0, 2).map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3 w-3 text-green-400/60 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {s}
                      </p>
                    </div>
                  ))}
                  <p className="text-[9px] text-muted-foreground/40 pl-4.5">
                    +{scorecard.strengths.length - 2} more...
                  </p>
                </div>

                {/* Improvements */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Wrench className="h-3 w-3 text-amber-400" />
                    <span className="text-[10px] font-medium text-amber-400">
                      Areas to Improve
                    </span>
                  </div>
                  {scorecard.improvements.slice(0, 2).map((s, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <Wrench className="h-3 w-3 text-amber-400/60 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-muted-foreground leading-relaxed">
                        {s}
                      </p>
                    </div>
                  ))}
                  <p className="text-[9px] text-muted-foreground/40 pl-4.5">
                    +{scorecard.improvements.length - 2} more...
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
