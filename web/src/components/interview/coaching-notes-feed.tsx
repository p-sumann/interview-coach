"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "motion/react";
import type { CoachingNote } from "@/lib/types";
import { CoachingNoteCard } from "./coaching-note-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquareText } from "lucide-react";

interface CoachingNotesFeedProps {
  notes: CoachingNote[];
}

export function CoachingNotesFeed({ notes }: CoachingNotesFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [notes.length]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <MessageSquareText className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Coaching Notes
        </span>
        {notes.length > 0 && (
          <span className="text-[10px] font-mono text-primary">
            {notes.length}
          </span>
        )}
      </div>

      <ScrollArea className="h-[260px]">
        <div className="space-y-2 pr-2">
          {notes.length === 0 && (
            <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/40">
              Notes will appear as you speak...
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {notes.map((note) => (
              <CoachingNoteCard key={note.id} note={note} />
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
