"use client";

import { motion } from "motion/react";
import type { CategoryScore } from "@/lib/types";
import {
  cn,
  getScoreColor,
  getScoreBorderColor,
  getScoreGlowColor,
} from "@/lib/utils";

interface CategoryScoresProps {
  categories: CategoryScore[];
}

export function CategoryScores({ categories }: CategoryScoresProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {categories.map((category, i) => (
        <motion.div
          key={category.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 * i }}
          className={cn(
            "glass rounded-xl p-5 border-l-4 shadow-lg",
            getScoreBorderColor(category.score),
            getScoreGlowColor(category.score)
          )}
        >
          <p className="text-sm text-muted-foreground mb-1">{category.name}</p>
          <p
            className={cn(
              "font-mono text-3xl font-bold mb-2",
              getScoreColor(category.score)
            )}
          >
            {category.score}
          </p>
          <div className="w-full bg-muted rounded-full h-1.5 mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${category.score}%` }}
              transition={{ duration: 1, delay: 0.2 * i }}
              className={cn(
                "h-1.5 rounded-full",
                category.score >= 80
                  ? "bg-green-400"
                  : category.score >= 60
                    ? "bg-amber-400"
                    : "bg-red-400"
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {category.description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
