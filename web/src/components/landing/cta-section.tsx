"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-24 px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto text-center"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to practice?
        </h2>
        <p className="text-muted-foreground mb-8">
          Set up your interview in under a minute and start getting real-time
          feedback from your AI coach.
        </p>
        <Button asChild size="lg" className="gap-2 h-12 px-8 text-base pulse-glow">
          <Link href="/setup">
            Start Practicing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </motion.div>
    </section>
  );
}
