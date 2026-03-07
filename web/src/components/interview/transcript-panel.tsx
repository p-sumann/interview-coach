"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { TranscriptMessage, AgentState } from "@/lib/types";
import { formatTime, cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, User } from "lucide-react";

interface TranscriptPanelProps {
  messages: TranscriptMessage[];
  agentState: AgentState;
}

export function TranscriptPanel({ messages, agentState }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-4 py-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground/40">
            Waiting for interviewer to begin...
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                  msg.role === "agent"
                    ? "bg-primary/20"
                    : "bg-accent/20"
                )}
              >
                {msg.role === "agent" ? (
                  <Bot className="h-4 w-4 text-primary" />
                ) : (
                  <User className="h-4 w-4 text-accent" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  "rounded-xl px-4 py-3 max-w-[85%]",
                  msg.role === "agent"
                    ? "bg-muted/80 rounded-tl-sm"
                    : "bg-card/80 rounded-tr-sm"
                )}
              >
                {msg.persona && (
                  <p className="text-[10px] text-primary font-medium mb-1">
                    {msg.persona}
                  </p>
                )}
                <p className="text-sm leading-relaxed">{msg.content}</p>
                <p className="text-[10px] text-muted-foreground/40 mt-1.5">
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking indicator */}
        {agentState === "thinking" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted/80 rounded-xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
