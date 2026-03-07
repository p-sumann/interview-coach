"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import type { InterviewConfig, SessionResponse } from "@/lib/types";
import { api } from "@/lib/api";
import { LiveInterviewRoom } from "@/components/interview/live-interview-room";
import { LiveKitSession } from "@/components/interview/livekit-session";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";

const MIN_SESSION_DURATION_FOR_SCORECARD = 30;

export default function SessionInterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [sessionError, setSessionError] = useState(false);
  const [showEndOverlay, setShowEndOverlay] = useState(false);
  const [endingPhase, setEndingPhase] = useState(0);
  const sessionStartRef = useRef<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchSession() {
      try {
        const s = await api.getSession(sessionId);
        if (!controller.signal.aborted) {
          setSession(s);
          sessionStartRef.current = Date.now();
        }
      } catch {
        if (!controller.signal.aborted) setSessionError(true);
      }
    }
    fetchSession();
    return () => controller.abort();
  }, [sessionId]);

  const config: InterviewConfig | null = session
    ? {
        candidateName: session.candidateName,
        targetRole: session.targetRole,
        experienceLevel: session.experienceLevel,
        roleType: session.roleType,
        primaryLanguage: session.primaryLanguage,
        techStack: session.techStack,
        interviewType: session.interviewType,
      }
    : null;

  const handleEndInterview = useCallback(() => {
    const confirmed = window.confirm(
      "Are you sure you want to end this interview?",
    );
    if (!confirmed) return;

    setShowEndOverlay(true);
    api.endSession(sessionId).catch(() => {});

    const elapsedSeconds = sessionStartRef.current
      ? (Date.now() - sessionStartRef.current) / 1000
      : 0;
    const hasEnoughForScorecard =
      elapsedSeconds >= MIN_SESSION_DURATION_FOR_SCORECARD;

    if (hasEnoughForScorecard) {
      const steps = [
        { phase: 1, delay: 800 },
        { phase: 2, delay: 2200 },
        { phase: 3, delay: 3800 },
      ];
      steps.forEach(({ phase, delay }) => {
        setTimeout(() => setEndingPhase(phase), delay);
      });
      setTimeout(() => {
        router.push(`/scorecard/${sessionId}`);
      }, 5000);
    } else {
      setTimeout(() => {
        router.push("/setup");
      }, 1500);
    }
  }, [router, sessionId]);

  const elapsedAtEnd = sessionStartRef.current
    ? (Date.now() - sessionStartRef.current) / 1000
    : 0;
  const hasEnoughForScorecard =
    showEndOverlay && elapsedAtEnd >= MIN_SESSION_DURATION_FOR_SCORECARD;

  const endingSteps = hasEnoughForScorecard
    ? [
        "Ending interview session...",
        "Analyzing your performance...",
        "Generating scorecard...",
      ]
    : ["Ending interview session...", "Redirecting to setup..."];

  if (!session && !sessionError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-6">
        <Logo size="lg" />
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-muted-foreground">
            Loading interview session...
          </span>
        </div>
      </div>
    );
  }

  if (sessionError || !session || !config) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background gap-6">
        <Logo size="lg" />
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <h2 className="text-xl font-semibold">Session Not Found</h2>
          <p className="text-muted-foreground">
            We couldn&apos;t load this interview session. It may have expired or
            the session ID is invalid.
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
    <>
      {/* End interview overlay */}
      <AnimatePresence>
        {showEndOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center gap-8"
          >
            <Logo size="lg" />
            <div className="space-y-4 w-64">
              {endingSteps.map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 * i }}
                  className="flex items-center gap-3"
                >
                  {endingPhase > i ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                  ) : endingPhase === i ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-border/50 flex-shrink-0" />
                  )}
                  <span
                    className={
                      endingPhase >= i
                        ? "text-sm text-foreground"
                        : "text-sm text-muted-foreground/40"
                    }
                  >
                    {step}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live mode with LiveKit */}
      <LiveKitSession
        sessionId={sessionId}
        roomName={session.roomName}
        participantName={config.candidateName}
      >
        <LiveInterviewRoom
          config={config}
          onEndInterview={handleEndInterview}
        />
      </LiveKitSession>
    </>
  );
}
