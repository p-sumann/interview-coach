"use client";

import { useState, useEffect, useRef } from "react";
import { formatTime } from "@/lib/utils";

export function useInterviewTimer(isActive: boolean) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  return {
    elapsedSeconds,
    formatted: formatTime(elapsedSeconds),
  };
}
