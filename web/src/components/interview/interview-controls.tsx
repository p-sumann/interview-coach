"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Mic, MicOff, Camera, CameraOff, PhoneOff, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface InterviewControlsProps {
  onEndInterview: () => void;
}

export function InterviewControls({ onEndInterview }: InterviewControlsProps) {
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);

  const controls = [
    {
      label: micOn ? "Mute microphone" : "Unmute microphone",
      icon: micOn ? Mic : MicOff,
      active: micOn,
      onClick: () => setMicOn(!micOn),
      variant: "default" as const,
    },
    {
      label: cameraOn ? "Turn off camera" : "Turn on camera",
      icon: cameraOn ? Camera : CameraOff,
      active: cameraOn,
      onClick: () => setCameraOn(!cameraOn),
      variant: "default" as const,
    },
    {
      label: "End interview",
      icon: PhoneOff,
      active: false,
      onClick: onEndInterview,
      variant: "danger" as const,
    },
    {
      label: "Settings",
      icon: Settings,
      active: false,
      onClick: () => {},
      variant: "default" as const,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="flex items-center justify-center gap-3 px-6 py-4 glass-strong border-t border-border/30"
    >
      {controls.map((control) => (
        <Tooltip key={control.label}>
          <TooltipTrigger asChild>
            <button
              onClick={control.onClick}
              className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center transition-all cursor-pointer",
                control.variant === "danger"
                  ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300"
                  : control.active
                    ? "bg-muted/80 hover:bg-muted text-foreground"
                    : "bg-muted/40 hover:bg-muted/60 text-muted-foreground"
              )}
            >
              <control.icon className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">{control.label}</TooltipContent>
        </Tooltip>
      ))}
    </motion.div>
  );
}
