"use client";

import { motion } from "motion/react";
import { CheckCircle } from "lucide-react";

interface StrengthsListProps {
  strengths: string[];
}

export function StrengthsList({ strengths }: StrengthsListProps) {
  return (
    <div className="glass rounded-xl p-6 border-t-2 border-green-500/40">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-400" />
        Strengths
      </h3>
      <ul className="space-y-3">
        {strengths.map((strength, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.08 * i }}
            className="flex items-start gap-3 text-sm"
          >
            <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">{strength}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
