"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { api } from "@/lib/api";
import { getUserId } from "@/lib/user-id";
import type { SessionListItem } from "@/lib/types";
import { AnimatedGradientBg } from "@/components/shared/animated-gradient-bg";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Clock,
  Trophy,
  Handshake,
  Brain,
  Code,
  Plus,
} from "lucide-react";

const typeIcons: Record<string, typeof Code> = {
  hr: Handshake,
  behavioral: Brain,
  technical: Code,
};

const typeLabels: Record<string, string> = {
  hr: "HR Screening",
  behavioral: "Behavioral",
  technical: "Technical",
};

function statusBadge(status: string) {
  switch (status) {
    case "completed":
      return <Badge variant="default" className="text-[10px]">Completed</Badge>;
    case "active":
    case "connecting":
      return <Badge variant="secondary" className="text-[10px]">In Progress</Badge>;
    case "failed":
      return <Badge variant="destructive" className="text-[10px]">Failed</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userId = getUserId();
    if (!userId) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    api
      .listSessions(userId)
      .then(setSessions)
      .catch(() => setError("Failed to load sessions"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <AnimatedGradientBg />

      {/* Top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-3 flex items-center justify-between backdrop-blur-sm bg-background/50">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <Logo size="sm" />
        <ThemeToggle />
      </header>

      <div className="min-h-screen flex flex-col items-center px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                My Sessions
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Your interview history and scorecards
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/setup">
                <Plus className="h-4 w-4 mr-1.5" />
                New Interview
              </Link>
            </Button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="glass rounded-xl p-8 text-center">
              <p className="text-muted-foreground">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && sessions.length === 0 && (
            <div className="glass rounded-xl p-12 text-center">
              <Clock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No sessions yet</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Start your first mock interview and your history will appear
                here.
              </p>
              <Button asChild>
                <Link href="/setup">Start Interview</Link>
              </Button>
            </div>
          )}

          {/* Sessions list */}
          {!loading && !error && sessions.length > 0 && (
            <div className="space-y-3">
              {sessions.map((session, i) => {
                const Icon = typeIcons[session.interviewType] ?? Code;
                const hasScorecard =
                  session.status === "completed" &&
                  session.overallScore !== null;

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.04 * i }}
                  >
                    <Link
                      href={
                        hasScorecard
                          ? `/scorecard/${session.id}`
                          : `/interview/${session.id}`
                      }
                      className="block glass rounded-xl p-4 hover:border-primary/40 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-medium text-sm truncate">
                              {typeLabels[session.interviewType] ??
                                session.interviewType}{" "}
                              &middot; {session.targetRole}
                            </span>
                            {statusBadge(session.status)}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatDate(session.createdAt)}</span>
                            <span className="capitalize">
                              {session.experienceLevel}
                            </span>
                          </div>
                        </div>

                        {/* Score */}
                        {hasScorecard && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Trophy className="h-4 w-4 text-amber-400" />
                            <span className="font-bold text-lg">
                              {session.overallScore}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}
