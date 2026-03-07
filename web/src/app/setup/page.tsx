"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { AnimatedGradientBg } from "@/components/shared/animated-gradient-bg";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { SetupForm } from "@/components/setup/setup-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

function SetupContent() {
  const searchParams = useSearchParams();
  const preselectedType = searchParams.get("type");

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

      <div className="min-h-screen flex items-center justify-center px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              Configure your interview
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Set up your practice session in under a minute. Your AI interviewer
              will adapt to your role and experience level.
            </p>
          </div>

          {/* Form */}
          <SetupForm defaultInterviewType={preselectedType} />
        </motion.div>
      </div>
    </>
  );
}

export default function SetupPage() {
  return (
    <Suspense>
      <SetupContent />
    </Suspense>
  );
}
