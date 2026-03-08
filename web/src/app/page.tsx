"use client";

import { AnimatedGradientBg } from "@/components/shared/animated-gradient-bg";
import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { ScorePreview } from "@/components/landing/score-preview";
import { HowItWorks } from "@/components/landing/how-it-works";
import { InterviewTypes } from "@/components/landing/interview-types";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <AnimatedGradientBg />
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ScorePreview />
        <HowItWorks />
        <InterviewTypes />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
