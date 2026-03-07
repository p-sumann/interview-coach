import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

export function getScoreBorderColor(score: number): string {
  if (score >= 80) return "border-green-400/50";
  if (score >= 60) return "border-amber-400/50";
  return "border-red-400/50";
}

export function getScoreGlowColor(score: number): string {
  if (score >= 80) return "shadow-green-400/5";
  if (score >= 60) return "shadow-amber-400/5";
  return "shadow-red-400/5";
}
