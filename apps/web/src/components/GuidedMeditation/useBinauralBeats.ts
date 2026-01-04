/* ============================================================================
   useBinauralBeats Hook
   ============================================================================
   Generates binaural beats using Web Audio API for meditation enhancement.

   Binaural beats work by playing slightly different frequencies in each ear,
   creating a perceived "beat" at the difference frequency that can influence
   brainwave patterns.

   Frequency ranges:
   - Delta (0.5-4 Hz): Deep sleep, healing
   - Theta (4-8 Hz): Deep meditation, creativity
   - Alpha (8-14 Hz): Relaxation, calm focus
   - Beta (14-30 Hz): Alert focus (less common for meditation)
   ============================================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';

/** Binaural beat frequency presets */
export type BinauralFrequency = 'delta' | 'theta' | 'alpha' | 'beta';

/** Frequency configurations */
const FREQUENCY_PRESETS: Record<BinauralFrequency, { beat: number; description: string }> = {
  delta: { beat: 2, description: 'Deep sleep & healing (2 Hz)' },
  theta: { beat: 6, description: 'Deep meditation (6 Hz)' },
  alpha: { beat: 10, description: 'Relaxation (10 Hz)' },
  beta: { beat: 20, description: 'Alert focus (20 Hz)' },
};

export interface UseBinauralBeatsOptions {
  /** Whether binaural beats are enabled */
  enabled?: boolean;
  /** Initial frequency preset */
  frequency?: BinauralFrequency;
  /** Volume level (0-1) */
  volume?: number;
  /** Base carrier frequency in Hz (default 200) */
  carrierFrequency?: number;
}

export interface UseBinauralBeatsReturn {
  /** Whether binaural beats are currently playing */
  isPlaying: boolean;
  /** Current frequency preset */
  frequency: BinauralFrequency;
  /** Current volume */
  volume: number;
  /** Start playing binaural beats */
  start: () => void;
  /** Stop playing */
  stop: () => void;
  /** Fade out and stop */
  fadeOut: (durationSeconds?: number) => void;
  /** Set frequency preset */
  setFrequency: (freq: BinauralFrequency) => void;
  /** Set volume (0-1) */
  setVolume: (vol: number) => void;
  /** Get description for current frequency */
  getDescription: () => string;
}

/**
 * Hook for generating binaural beats using Web Audio API.
 *
 * Creates two oscillators with slightly different frequencies,
 * one panned left and one panned right.
 */
export function useBinauralBeats(
  options: UseBinauralBeatsOptions = {}
): UseBinauralBeatsReturn {
  const {
    enabled = true,
    frequency: initialFrequency = 'theta',
    volume: initialVolume = 0.3,
    carrierFrequency = 200,
  } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequencyState] = useState<BinauralFrequency>(initialFrequency);
  const [volume, setVolumeState] = useState(initialVolume);

  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const leftOscillatorRef = useRef<OscillatorNode | null>(null);
  const rightOscillatorRef = useRef<OscillatorNode | null>(null);
  const leftGainRef = useRef<GainNode | null>(null);
  const rightGainRef = useRef<GainNode | null>(null);
  const leftPannerRef = useRef<StereoPannerNode | null>(null);
  const rightPannerRef = useRef<StereoPannerNode | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    leftOscillatorRef.current?.stop();
    rightOscillatorRef.current?.stop();
    leftOscillatorRef.current?.disconnect();
    rightOscillatorRef.current?.disconnect();
    leftGainRef.current?.disconnect();
    rightGainRef.current?.disconnect();
    leftPannerRef.current?.disconnect();
    rightPannerRef.current?.disconnect();

    leftOscillatorRef.current = null;
    rightOscillatorRef.current = null;
    leftGainRef.current = null;
    rightGainRef.current = null;
    leftPannerRef.current = null;
    rightPannerRef.current = null;
  }, []);

  // Start binaural beats
  const start = useCallback(() => {
    if (!enabled || isPlaying) {return;}

    try {
      // Create or resume audio context
      audioContextRef.current ??= new AudioContext();
      const ctx = audioContextRef.current;

      if (ctx.state === 'suspended') {
        void ctx.resume();
      }

      const beatFreq = FREQUENCY_PRESETS[frequency].beat;
      const leftFreq = carrierFrequency;
      const rightFreq = carrierFrequency + beatFreq;

      // Create left channel (carrier frequency)
      const leftOsc = ctx.createOscillator();
      const leftGain = ctx.createGain();
      const leftPanner = ctx.createStereoPanner();

      leftOsc.type = 'sine';
      leftOsc.frequency.value = leftFreq;
      leftGain.gain.value = volume;
      leftPanner.pan.value = -1; // Full left

      leftOsc.connect(leftGain);
      leftGain.connect(leftPanner);
      leftPanner.connect(ctx.destination);

      // Create right channel (carrier + beat frequency)
      const rightOsc = ctx.createOscillator();
      const rightGain = ctx.createGain();
      const rightPanner = ctx.createStereoPanner();

      rightOsc.type = 'sine';
      rightOsc.frequency.value = rightFreq;
      rightGain.gain.value = volume;
      rightPanner.pan.value = 1; // Full right

      rightOsc.connect(rightGain);
      rightGain.connect(rightPanner);
      rightPanner.connect(ctx.destination);

      // Store references
      leftOscillatorRef.current = leftOsc;
      rightOscillatorRef.current = rightOsc;
      leftGainRef.current = leftGain;
      rightGainRef.current = rightGain;
      leftPannerRef.current = leftPanner;
      rightPannerRef.current = rightPanner;

      // Start oscillators
      leftOsc.start();
      rightOsc.start();

      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to start binaural beats:', error);
    }
  }, [enabled, isPlaying, frequency, volume, carrierFrequency]);

  // Stop binaural beats
  const stop = useCallback(() => {
    cleanup();
    setIsPlaying(false);
  }, [cleanup]);

  // Fade out and stop
  const fadeOut = useCallback((durationSeconds = 2) => {
    if (!isPlaying || !leftGainRef.current || !rightGainRef.current) {
      stop();
      return;
    }

    const ctx = audioContextRef.current;
    if (!ctx) {
      stop();
      return;
    }

    const now = ctx.currentTime;
    leftGainRef.current.gain.linearRampToValueAtTime(0, now + durationSeconds);
    rightGainRef.current.gain.linearRampToValueAtTime(0, now + durationSeconds);

    setTimeout(() => {
      stop();
    }, durationSeconds * 1000);
  }, [isPlaying, stop]);

  // Set frequency
  const setFrequency = useCallback((freq: BinauralFrequency) => {
    setFrequencyState(freq);

    // Update oscillators if playing
    if (isPlaying && rightOscillatorRef.current) {
      const beatFreq = FREQUENCY_PRESETS[freq].beat;
      rightOscillatorRef.current.frequency.value = carrierFrequency + beatFreq;
    }
  }, [isPlaying, carrierFrequency]);

  // Set volume
  const setVolume = useCallback((vol: number) => {
    const clampedVol = Math.max(0, Math.min(1, vol));
    setVolumeState(clampedVol);

    // Update gain nodes if playing
    if (leftGainRef.current) {
      leftGainRef.current.gain.value = clampedVol;
    }
    if (rightGainRef.current) {
      rightGainRef.current.gain.value = clampedVol;
    }
  }, []);

  // Get description
  const getDescription = useCallback(() => {
    return FREQUENCY_PRESETS[frequency].description;
  }, [frequency]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [cleanup]);

  return {
    isPlaying,
    frequency,
    volume,
    start,
    stop,
    fadeOut,
    setFrequency,
    setVolume,
    getDescription,
  };
}
