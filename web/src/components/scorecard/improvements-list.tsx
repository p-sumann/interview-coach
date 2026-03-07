"use client";

import { motion } from "motion/react";
import { Wrench } from "lucide-react";

interface ImprovementsListProps {
  improvements: string[];
}

export function ImprovementsList({ improvements }: ImprovementsListProps) {
  return (
    <div className="glass rounded-xl p-6 border-t-2 border-amber-500/40">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Wrench className="h-5 w-5 text-amber-400" />
        Areas for Improvement
      </h3>
      <ul className="space-y-3">
        {improvements.map((item, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.08 * i }}
            className="flex items-start gap-3 text-sm"
          >
            <Wrench className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground">{item}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
