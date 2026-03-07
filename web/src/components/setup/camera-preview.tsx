"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";

export function CameraPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360, facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Camera access denied");
          setLoading(false);
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-xl bg-muted/50 border border-border/30 aspect-video flex flex-col items-center justify-center gap-2">
        <CameraOff className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground/40">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-muted/50 border border-border/30 aspect-video overflow-hidden relative">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Camera className="h-8 w-8 text-muted-foreground/40 animate-pulse" />
          <p className="text-xs text-muted-foreground/40">Starting camera...</p>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover -scale-x-100"
      />
    </div>
  );
}
