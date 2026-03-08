"use client";

import { motion } from "motion/react";
import { Headphones, BrainCircuit, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Headphones,
    title: "Real-Time AI Coaching",
    description:
      "Get instant feedback on speaking pace, confidence, and filler words as you practice. Your AI coach listens and adapts in real-time.",
  },
  {
    icon: BrainCircuit,
    title: "Adaptive AI Interviewer",
    description:
      "Four interview modes — HR, Behavioral, Technical, and full Mock rounds. Questions adapt to your seniority level, role type, and tech stack in real-time.",
  },
  {
    icon: BarChart3,
    title: "Detailed Scorecard",
    description:
      "After each session, receive a comprehensive scorecard with category scores, key moments, level calibration, strengths, and personalized improvement areas.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to
            <span className="text-primary"> nail your interview</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Combines real-time multimodal feedback with adaptive difficulty to
            prepare you like nothing else can.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="glass rounded-xl p-6 hover:border-primary/30 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
