"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { LocalAudioTrack, RemoteAudioTrack, Track } from "livekit-client";
import {
  useTrackVolume,
  useMultibandTrackVolume,
} from "@livekit/components-react";
import type { PaceLevel } from "@/lib/types";

export interface AudioAnalysisMetrics {
  pace: PaceLevel;
  confidence: number;
  speakingRatio: number;
  isCurrentlySpeaking: boolean;
}

const DEFAULT_METRICS: AudioAnalysisMetrics = {
  pace: "good",
  confidence: 0,
  speakingRatio: 0,
  isCurrentlySpeaking: false,
};

// VAD threshold on LiveKit's normalized volume (0-1)
const VAD_THRESHOLD = 0.04;
// Silence must persist this long before counting as actual silence (ms)
// Prevents micro-gaps between words in fast speech from creating false segments
const VAD_SILENCE_DEBOUNCE_MS = 180;
// Rolling window for pacing analysis (ms)
const WINDOW_MS = 30_000;
// Minimum speaking time before classifying pace (prevents reset to "good")
const MIN_SPEAKING_FOR_PACE_MS = 1500;
// EMA smoothing factor for confidence (lower = smoother transitions)
const CONFIDENCE_ALPHA = 0.18;
// Number of frequency bands for spectral analysis
const BAND_COUNT = 5;

interface Segment {
  start: number;
  end: number;
}

function pruneSegments(segments: Segment[], cutoff: number) {
  while (segments.length > 0 && segments[0].end < cutoff) {
    segments.shift();
  }
}

function classifyPace(
  speakingSegs: Segment[],
  silenceSegs: Segment[],
  now: number,
  currentSpeakingStart: number | null,
): PaceLevel {
  const windowStart = now - WINDOW_MS;

  let totalSpeaking = 0;
  for (const seg of speakingSegs) {
    totalSpeaking += seg.end - Math.max(seg.start, windowStart);
  }
  // Include current ongoing speaking segment
  if (currentSpeakingStart !== null) {
    totalSpeaking += now - Math.max(currentSpeakingStart, windowStart);
  }

  const elapsed = now - windowStart;
  // Don't classify until we have enough speaking data in the window
  if (totalSpeaking < MIN_SPEAKING_FOR_PACE_MS) return "good";

  const ratio = totalSpeaking / elapsed;

  let totalPause = 0;
  let pauseCount = 0;
  for (const seg of silenceSegs) {
    const duration = seg.end - Math.max(seg.start, windowStart);
    if (duration > 0) {
      totalPause += duration;
      pauseCount++;
    }
  }
  const avgPause = pauseCount > 0 ? totalPause / pauseCount : 1000;

  if (ratio > 0.72 || avgPause < 250) return "fast";
  if (ratio < 0.35 || avgPause > 2500) return "slow";
  return "good";
}

/**
 * Analyzes the local microphone audio using LiveKit's built-in audio
 * processing hooks (useTrackVolume + useMultibandTrackVolume) to detect
 * pacing and confidence in real-time.
 *
 * Skips analysis when the agent is speaking to avoid picking up speaker audio.
 * Pace and confidence hold their last speaking value when the user goes silent.
 *
 * @param rawTrack - The local mic track from useLocalParticipant
 * @param isAgentSpeaking - When true, volume is ignored (agent audio leaking into mic)
 */
export function useAudioAnalysis(
  rawTrack: Track | undefined,
  isAgentSpeaking: boolean = false,
): AudioAnalysisMetrics {
  // Cast to audio track type — safe because we only pass mic tracks
  const track = rawTrack as LocalAudioTrack | RemoteAudioTrack | undefined;

  // LiveKit's volume: 0-1 normalized, updated at ~30fps
  const volume = useTrackVolume(track, {
    fftSize: 256,
    smoothingTimeConstant: 0,
  });

  // LiveKit's multiband: frequency distribution for spectral analysis
  const bands = useMultibandTrackVolume(track, {
    bands: BAND_COUNT,
    loPass: 100,
    hiPass: 600,
    updateInterval: 50,
    analyserOptions: { fftSize: 2048 },
  });

  const [metrics, setMetrics] = useState<AudioAnalysisMetrics>(DEFAULT_METRICS);

  // Mutable refs for segment tracking (avoid re-creating on every render)
  const stateRef = useRef({
    wasSpeaking: false,
    segmentStart: 0,
    speakingSegments: [] as Segment[],
    silenceSegments: [] as Segment[],
    smoothedConfidence: 65,
    recentHesitations: 0,
    lastSpeakingSegDuration: 0,
    hesitationDecayCounter: 0,
    lastPace: "good" as PaceLevel,
    lastConfidence: 65,
    hasSpokeOnce: false,
    // Auto-calibrating volume baseline
    volBaseline: 0.05,
    volPeak: 0.15,
    calibrationSamples: 0,
    // Spectral stability tracking
    recentBandVariances: [] as number[],
    // Track current speaking segment start for pace calculation
    currentSpeakingStart: null as number | null,
    // VAD debounce: when silence started (null = currently speaking)
    silenceSince: null as number | null,
  });

  const computeConfidence = useCallback(
    (vol: number, bandValues: number[]): number => {
      const s = stateRef.current;

      // Auto-calibrate: track speaking volume range (only during speech, not silence)
      // This prevents volBaseline from dropping to ~0 due to silence samples
      s.calibrationSamples++;
      if (s.calibrationSamples < 60) {
        // During warmup, track the range more aggressively
        s.volPeak = Math.max(s.volPeak, vol);
        // Baseline tracks the quieter end of SPEAKING volume (not silence)
        if (vol > VAD_THRESHOLD) {
          s.volBaseline = Math.min(s.volBaseline, vol);
        }
      } else {
        // After warmup, slowly adapt
        s.volPeak = s.volPeak * 0.995 + vol * 0.005;
        if (vol > VAD_THRESHOLD) {
          s.volBaseline = s.volBaseline * 0.995 + vol * 0.005;
        }
      }

      // Energy score (0-25): how loud relative to the user's own range
      // Normal speaking ≈ mid-range → ~12-18 points. Only very loud/projected = 25
      const volRange = Math.max(s.volPeak - s.volBaseline, 0.03);
      const normalizedVol = Math.min(
        Math.max((vol - s.volBaseline) / volRange, 0),
        1,
      );
      const energyScore = normalizedVol * 25;

      // Spectral stability score (0-25): consistent frequency = steady voice
      // Shaky/trembling voice has high band variance
      if (bandValues.length >= 2) {
        const bandMean =
          bandValues.reduce((a, b) => a + b, 0) / bandValues.length;
        const bandVar =
          bandValues.reduce((sum, v) => sum + (v - bandMean) ** 2, 0) /
          bandValues.length;
        s.recentBandVariances.push(bandVar);
        if (s.recentBandVariances.length > 50) s.recentBandVariances.shift();
      }

      let stabilityScore = 15;
      if (s.recentBandVariances.length >= 5) {
        const varMean =
          s.recentBandVariances.reduce((a, b) => a + b, 0) /
          s.recentBandVariances.length;
        // Tighter threshold — more variance sensitivity
        stabilityScore = Math.max(0, 1 - varMean / 0.03) * 25;
      }

      // Fluency score (0-25): fewer hesitations = more confident
      // Hesitations detected from short-speak/short-pause patterns
      const fluencyScore = 25 - Math.min(s.recentHesitations * 4, 20);

      // Base score (0-25): provides a floor so normal speech ≈ 60-75
      // Drops with hesitations to differentiate nervous vs steady speaking
      const baseScore = 25 - Math.min(s.recentHesitations * 2, 15);

      return Math.round(
        Math.max(0, Math.min(100, baseScore + energyScore + stabilityScore + fluencyScore)),
      );
    },
    [],
  );

  useEffect(() => {
    if (!track) {
      queueMicrotask(() => setMetrics(DEFAULT_METRICS));
      return;
    }

    const s = stateRef.current;
    const now = performance.now();

    // When agent is speaking, ignore mic volume (speaker audio leaks into mic)
    // Just hold the last values — don't update segments or confidence
    if (isAgentSpeaking) {
      // If we were tracking a speaking segment, end it
      if (s.wasSpeaking) {
        s.speakingSegments.push({ start: s.segmentStart, end: now });
        s.lastSpeakingSegDuration = now - s.segmentStart;
        s.wasSpeaking = false;
        s.currentSpeakingStart = null;
        s.segmentStart = now;
      }
      return;
    }

    // Debounced VAD: require silence to persist for VAD_SILENCE_DEBOUNCE_MS
    // before transitioning from speaking → silent. Prevents micro-gaps between
    // words in fast speech from creating false silence segments.
    const aboveThreshold = volume > VAD_THRESHOLD;
    let speaking: boolean;
    if (aboveThreshold) {
      s.silenceSince = null;
      speaking = true;
    } else if (s.wasSpeaking) {
      if (s.silenceSince === null) s.silenceSince = now;
      speaking = (now - s.silenceSince) < VAD_SILENCE_DEBOUNCE_MS;
    } else {
      speaking = false;
    }

    // Handle state transitions
    if (speaking !== s.wasSpeaking) {
      const segment: Segment = { start: s.segmentStart, end: now };
      if (s.wasSpeaking) {
        s.speakingSegments.push(segment);
        s.lastSpeakingSegDuration = now - s.segmentStart;
        s.currentSpeakingStart = null;
      } else {
        s.silenceSegments.push(segment);
        const silenceDuration = now - s.segmentStart;
        // Only count hesitations for genuine stutters: very short speech burst
        // followed by a meaningful pause (not natural word gaps in fast speech)
        if (s.lastSpeakingSegDuration < 300 && silenceDuration > 200 && silenceDuration < 800) {
          s.recentHesitations++;
        }
        s.currentSpeakingStart = now;
      }
      s.segmentStart = now;
      s.wasSpeaking = speaking;
    }

    // Decay hesitations over time (~every 1.5s at 30fps)
    s.hesitationDecayCounter++;
    if (s.hesitationDecayCounter >= 45) {
      s.hesitationDecayCounter = 0;
      s.recentHesitations = Math.max(0, s.recentHesitations - 1);
    }

    // Prune old segments
    const cutoff = now - WINDOW_MS;
    pruneSegments(s.speakingSegments, cutoff);
    pruneSegments(s.silenceSegments, cutoff);

    // Speaking ratio
    const windowStart = now - WINDOW_MS;
    let totalSpeaking = 0;
    for (const seg of s.speakingSegments) {
      totalSpeaking += seg.end - Math.max(seg.start, windowStart);
    }
    if (speaking) {
      totalSpeaking += now - Math.max(s.segmentStart, windowStart);
    }
    const elapsed = Math.min(now, WINDOW_MS);
    const speakingRatio = elapsed > 0 ? totalSpeaking / elapsed : 0;

    // Only update pace/confidence while speaking — hold last values when silent
    if (speaking) {
      s.hasSpokeOnce = true;
      const rawConfidence = computeConfidence(volume, bands);
      s.smoothedConfidence =
        CONFIDENCE_ALPHA * rawConfidence +
        (1 - CONFIDENCE_ALPHA) * s.smoothedConfidence;

      s.lastPace = classifyPace(
        s.speakingSegments,
        s.silenceSegments,
        now,
        s.currentSpeakingStart,
      );
      s.lastConfidence = Math.round(s.smoothedConfidence);
    }

    queueMicrotask(() => setMetrics({
      pace: s.hasSpokeOnce ? s.lastPace : "good",
      confidence: s.hasSpokeOnce ? s.lastConfidence : 0,
      speakingRatio: Math.round(speakingRatio * 100) / 100,
      isCurrentlySpeaking: speaking,
    }));
  }, [track, volume, bands, computeConfidence, isAgentSpeaking]);

  return metrics;
}
