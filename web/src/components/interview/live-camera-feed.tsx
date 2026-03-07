"use client";

import { useEffect, useRef } from "react";
import { CameraOff, User } from "lucide-react";
import { useLocalParticipant } from "@livekit/components-react";
import { Track } from "livekit-client";

export function LiveCameraFeed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isCameraEnabled, cameraTrack, localParticipant } = useLocalParticipant();

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const publication = cameraTrack;
    const track = publication?.track;
    if (track && isCameraEnabled) {
      track.attach(el);
      return () => {
        track.detach(el);
      };
    }
  }, [cameraTrack, isCameraEnabled]);

  return (
    <div className="relative rounded-xl bg-muted/30 border border-border/30 aspect-[3/4] overflow-hidden">
      {!isCameraEnabled ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/30">
          <CameraOff className="h-12 w-12" />
          <span className="text-xs">Camera off</span>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
          />
          {!cameraTrack?.track && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
              <User className="h-16 w-16" />
            </div>
          )}
        </>
      )}
      {isCameraEnabled && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500 live-pulse" />
          <span className="text-[10px] font-medium text-red-400 uppercase tracking-wider">
            Live
          </span>
        </div>
      )}
    </div>
  );
}
