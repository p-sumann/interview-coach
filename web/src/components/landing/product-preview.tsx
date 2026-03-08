"use client";

import { motion } from "motion/react";
import { Bot, User, Gauge, MessageSquareText, Video } from "lucide-react";

export function ProductPreview() {
  return (
    <div className="relative max-w-4xl mx-auto">
      {/* Glow behind card */}
      <div className="absolute -inset-4 bg-primary/5 rounded-3xl blur-3xl" />

      <div className="relative glass rounded-2xl border border-border/40 overflow-hidden shadow-2xl">
        {/* Header bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/30 bg-card/50">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Mock Interview — Senior Software Engineer
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-green-400">Live</span>
          </div>
        </div>

        {/* 3-column mock layout */}
        <div className="grid grid-cols-[1fr_1.8fr_1.2fr] gap-0 h-[320px]">
          {/* Left: Interviewer + video panel */}
          <div className="border-r border-border/20 p-4 flex flex-col items-center justify-center gap-4">
            {/* Interviewer avatar */}
            <div className="h-20 w-20 rounded-full bg-linear-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <Bot className="h-8 w-8 text-primary/60" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium">Alex Rivera</p>
              <p className="text-[10px] text-muted-foreground">
                Staff Software Engineer
              </p>
            </div>

            {/* Mini video feed placeholder */}
            <div className="w-full rounded-lg bg-muted/40 border border-border/20 aspect-video flex items-center justify-center">
              <Video className="h-4 w-4 text-muted-foreground/40" />
            </div>

            <p className="text-xs text-muted-foreground">
              Question 3 of ~10
            </p>
          </div>

          {/* Center: Transcript */}
          <div className="p-4 space-y-3 overflow-hidden">
            <TranscriptBubble
              role="agent"
              name="Alex Rivera"
              message="Can you walk me through how you'd design a rate limiter for a distributed API?"
              delay={0}
            />
            <TranscriptBubble
              role="user"
              message="Sure. I'd use a sliding window approach with Redis as the backing store..."
              delay={0.2}
            />
            <TranscriptBubble
              role="agent"
              name="Alex Rivera"
              message="Good start. What happens when one Redis node goes down? How would you handle that failure?"
              delay={0.4}
            />
          </div>

          {/* Right: Metrics */}
          <div className="border-l border-border/20 p-4 space-y-4">
            <p className="text-xs font-semibold">Live Coaching</p>

            <MetricRow icon={Gauge} label="Confidence" value={85} color="text-green-400" />

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Pace</span>
              <span className="text-green-400 font-medium">Good</span>
            </div>

            <div className="border-t border-border/20 pt-3">
              <div className="flex items-center gap-1.5 mb-2">
                <MessageSquareText className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  Coaching Notes
                </span>
              </div>
              <div className="rounded-md border-l-2 border-l-green-400 bg-muted/30 p-2">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Great use of concrete examples when explaining trade-offs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TranscriptBubble({
  role,
  name,
  message,
  delay,
}: {
  role: "agent" | "user";
  name?: string;
  message: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 + delay }}
      className={`flex gap-2 ${role === "user" ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
          role === "agent" ? "bg-primary/20" : "bg-accent/20"
        }`}
      >
        {role === "agent" ? (
          <Bot className="h-3 w-3 text-primary" />
        ) : (
          <User className="h-3 w-3 text-accent" />
        )}
      </div>
      <div
        className={`rounded-lg px-3 py-2 max-w-[85%] ${
          role === "agent" ? "bg-muted/60" : "bg-card/80"
        }`}
      >
        {name && (
          <p className="text-[9px] text-primary font-medium mb-0.5">{name}</p>
        )}
        <p className="text-[11px] leading-relaxed">{message}</p>
      </div>
    </motion.div>
  );
}

function MetricRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Gauge;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
        <span className={`text-xs font-mono font-bold ${color}`}>{value}%</span>
      </div>
      <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay: 0.8 }}
          className={`h-full rounded-full ${
            value >= 80 ? "bg-green-400" : "bg-amber-400"
          }`}
        />
      </div>
    </div>
  );
}
