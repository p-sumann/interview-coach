"use client";

import { motion } from "motion/react";
import { Settings2, Mic, ClipboardCheck } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: Settings2,
    title: "Configure",
    description:
      "Choose your target role, experience level, tech stack, and interview type. Pick from HR, Behavioral, Technical, or a full Mock round.",
  },
  {
    number: 2,
    icon: Mic,
    title: "Practice",
    description:
      "Join a live AI interview session. Speak naturally while receiving real-time coaching on your delivery, body language, and technical depth.",
  },
  {
    number: 3,
    icon: ClipboardCheck,
    title: "Review",
    description:
      "Get a detailed scorecard with category scores, key moments, level calibration, and actionable improvement areas to focus your preparation.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How it works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Three simple steps to a better interview performance.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 * i }}
              className="text-center"
            >
              {/* Number + icon */}
              <div className="relative inline-flex mb-6">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {step.number}
                </span>
              </div>

              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                {step.description}
              </p>

              {/* Connector line (hidden on last) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-border/50" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
