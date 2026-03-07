"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { OverallScore } from "@/components/scorecard/overall-score";
import { CategoryScores } from "@/components/scorecard/category-scores";
import { StrengthsList } from "@/components/scorecard/strengths-list";
import { ImprovementsList } from "@/components/scorecard/improvements-list";
import { KeyMoments } from "@/components/scorecard/key-moments";
import { SessionAnalyticsCard } from "@/components/scorecard/session-analytics";
import { LevelCalibrationCard } from "@/components/scorecard/level-calibration";
import { PhaseBreakdown } from "@/components/scorecard/phase-breakdown";
import { api } from "@/lib/api";
import type { Scorecard } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Download, RotateCcw, Share2, Calendar, Clock, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ScorecardPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchScorecard() {
      try {
        const data = await api.getScorecard(sessionId);
        setScorecard(data);
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchScorecard();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-6">
        <Logo size="lg" />
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-muted-foreground">
            Loading your scorecard...
          </span>
        </div>
      </div>
    );
  }

  if (error || !scorecard) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-6">
        <Logo size="lg" />
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <h2 className="text-xl font-semibold">Scorecard Unavailable</h2>
          <p className="text-muted-foreground">
            We couldn&apos;t load the scorecard for this session. It may still be
            generating or the session may not exist.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Link href="/setup">
              <Button>Start New Interview</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-border/30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Interview metadata */}
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="capitalize">
            {scorecard.interviewType} Interview
          </Badge>
          <Badge variant="outline">{scorecard.config.targetRole}</Badge>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(scorecard.generatedAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {formatTime(scorecard.durationSeconds)}
          </div>
        </div>

        {/* Overall Score */}
        <OverallScore
          score={scorecard.overallScore}
          summary={scorecard.overallSummary}
        />

        {/* Category Scores */}
        <CategoryScores categories={scorecard.categories} />

        {/* Phase Breakdown (mock mode) */}
        {scorecard.interviewType === "mock" && (
          <PhaseBreakdown phases={scorecard.phaseScores} />
        )}

        {/* Strengths + Improvements side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StrengthsList strengths={scorecard.strengths} />
          <ImprovementsList improvements={scorecard.improvements} />
        </div>

        {/* Key Moments */}
        <KeyMoments moments={scorecard.keyMoments} />

        {/* Session Analytics */}
        <SessionAnalyticsCard analytics={scorecard.analytics} />

        {/* Level Calibration */}
        <LevelCalibrationCard calibration={scorecard.levelCalibration} />

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pb-8">
          <Link href="/setup">
            <Button size="lg" className="gap-2 pulse-glow">
              <RotateCcw className="h-4 w-4" />
              Practice Again
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share Results
          </Button>
        </div>
      </main>
    </div>
  );
}
