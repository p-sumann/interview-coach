"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, redirect } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import type { InterviewConfig } from "@/lib/types";
import { MOCK_INTERVIEW_CONFIG } from "@/lib/mock-data";
import { useSimulatedInterview } from "@/hooks/use-simulated-interview";
import { useInterviewTimer } from "@/hooks/use-interview-timer";
import { InterviewRoom } from "@/components/interview/interview-room";
import { Logo } from "@/components/shared/logo";
import { Loader2, CheckCircle2 } from "lucide-react";

const IS_DEV = process.env.NODE_ENV === "development";

function InterviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showEndOverlay, setShowEndOverlay] = useState(false);
  const [endingPhase, setEndingPhase] = useState(0);

  const config: InterviewConfig = {
    candidateName: searchParams.get("name") || MOCK_INTERVIEW_CONFIG.candidateName,
    targetRole: searchParams.get("role") || MOCK_INTERVIEW_CONFIG.targetRole,
    experienceLevel:
      (searchParams.get("level") as InterviewConfig["experienceLevel"]) ||
      MOCK_INTERVIEW_CONFIG.experienceLevel,
    roleType:
      (searchParams.get("roleType") as InterviewConfig["roleType"]) ||
      MOCK_INTERVIEW_CONFIG.roleType,
    primaryLanguage:
      (searchParams.get("lang") as InterviewConfig["primaryLanguage"]) ||
      MOCK_INTERVIEW_CONFIG.primaryLanguage,
    techStack: searchParams.get("stack")?.split(",").filter(Boolean) ||
      MOCK_INTERVIEW_CONFIG.techStack,
    interviewType:
      (searchParams.get("type") as InterviewConfig["interviewType"]) ||
      MOCK_INTERVIEW_CONFIG.interviewType,
  };

  const state = useSimulatedInterview(config);
  const { formatted: elapsedTime } = useInterviewTimer(state.status === "active");

  const handleEndInterview = useCallback(() => {
    setShowEndOverlay(true);

    // Progress through ending phases
    const steps = [
      { phase: 1, delay: 800 },
      { phase: 2, delay: 2200 },
      { phase: 3, delay: 3800 },
    ];

    steps.forEach(({ phase, delay }) => {
      setTimeout(() => setEndingPhase(phase), delay);
    });

    // Navigate to scorecard
    setTimeout(() => {
      router.push("/scorecard/session-abc-123");
    }, 5000);
  }, [router]);

  const endingSteps = [
    "Ending interview session...",
    "Analyzing your performance...",
    "Generating scorecard...",
  ];

  return (
    <>
      {/* Connecting overlay */}
      <AnimatePresence>
        {state.status === "connecting" && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-6"
          >
            <Logo size="lg" />
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-muted-foreground">
                Connecting to interview room...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Interview room */}
      <InterviewRoom
        state={state}
        config={config}
        elapsedTime={elapsedTime}
        onEndInterview={handleEndInterview}
      />
    </>
  );
}

export default function InterviewPage() {
  if (!IS_DEV) {
    redirect("/setup");
  }

  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      }
    >
      <InterviewContent />
    </Suspense>
  );
}
