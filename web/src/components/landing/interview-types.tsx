"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { INTERVIEW_TYPE_CONFIGS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Handshake, Brain, Code, Clock } from "lucide-react";

const icons: Record<string, typeof Handshake> = {
  Handshake,
  Brain,
  Code,
};

export function InterviewTypes() {
  return (
    <section id="interview-types" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Choose your <span className="text-primary">interview mode</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Practice HR screening, behavioral, or technical interviews
            with AI interviewers that adapt to your level.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTERVIEW_TYPE_CONFIGS.map((config, i) => {
            const Icon = icons[config.icon] ?? Code;
            return (
              <motion.div
                key={config.type}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
              >
                <Link
                  href={`/setup?type=${config.type}`}
                  className="block glass rounded-xl p-6 hover:border-primary/40 transition-all group h-full"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    {config.badge && (
                      <Badge className="text-[10px]">{config.badge}</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">{config.displayName}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {config.description}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                    <Clock className="h-3 w-3" />
                    ~{config.defaultDurationMinutes} min
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
