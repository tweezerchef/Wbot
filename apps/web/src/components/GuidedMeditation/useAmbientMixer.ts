/* ============================================================================
   useAmbientMixer Hook
   ============================================================================
   Manages ambient sound playback for guided meditation:
   - Ocean waves, rain, forest ambience
   - Volume control with smooth fading
   - Fade in/out transitions

   Uses Web Audio API for smooth volume control and crossfading.
   Adapted from useBreathingAudio for meditation-specific use.
   ============================================================================ */

import { useEffect, useRef, useCallback, useState } from 'react';

/** Available ambient sound types */
export type AmbientSoundType = 'ocean' | 'rain' | 'forest' | 'none';

/** URLs for ambient sounds - royalty-free samples from Free Sounds Library (CC BY 4.0) */
const AMBIENT_SOUNDS: Record<Exclude<AmbientSoundType, 'none'>, string> = {
  ocean: '/audio/ocean-waves.mp3',
  rain: '/audio/gentle-rain.mp3',
  forest: '/audio/forest-ambience.mp3',
};

/** Ambient mixer settings */
export interface AmbientMixerSettings {
  /** Whether ambient sound is enabled */
  enabled: boolean;
  /** Current volume (0-1) */
  volume: number;
  /** Selected ambient sound */
  sound: AmbientSoundType;
}

/** Return type for useAmbientMixer hook */
export interface UseAmbientMixerReturn {
  /** Current settings */
  settings: AmbientMixerSettings;
  /** Whether ambient sound is currently playing */
  isPlaying: boolean;
  /** Start playing ambient sound */
  play: () => Promise<void>;
  /** Stop ambient sound with fade out */
  stop: () => void;
  /** Set volume (0-1) */
  setVolume: (volume: number) => void;
  /** Change ambient sound type */
  setSound: (sound: AmbientSoundType) => void;
  /** Toggle enabled state */
  toggle: () => void;
  /** Fade out over specified duration (default 1s) */
  fadeOut: (duration?: number) => void;
}

/** Default ambient mixer settings */
const DEFAULT_SETTINGS: AmbientMixerSettings = {
  enabled: true,
  volume: 0.3,
  sound: 'ocean',
};

/**
 * Hook for managing ambient sounds during guided meditation
 *
 * Uses Web Audio API for smooth volume control and crossfading.
 * Automatically handles audio context suspension/resume for browser compatibility.
 *
 * @param initialSettings - Optional initial settings
 * @returns Ambient mixer controls and state
 */
export function useAmbientMixer(
  initialSettings: Partial<AmbientMixerSettings> = {}
): UseAmbientMixerReturn {
  const [settings, setSettings] = useState<AmbientMixerSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const audioBufferCacheRef = useRef<Map<AmbientSoundType, AudioBuffer>>(new Map());

  /**
   * Initialize or get the Web Audio API context
   */
  const getAudioContext = useCallback(() => {
    audioContextRef.current ??= new AudioContext();
    return audioContextRef.current;
  }, []);

  /**
   * Load audio buffer for a sound type (cached)
   */
  const loadAudioBuffer = useCallback(
    async (sound: Exclude<AmbientSoundType, 'none'>): Promise<AudioBuffer> => {
      // Check cache first
      const cached = audioBufferCacheRef.current.get(sound);
      if (cached) {
        return cached;
      }

      const ctx = getAudioContext();
      const url = AMBIENT_SOUNDS[sound];

      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      // Cache for reuse
      audioBufferCacheRef.current.set(sound, audioBuffer);
      return audioBuffer;
    },
    [getAudioContext]
  );

  /**
   * Start playing ambient sound
   */
  const play = useCallback(async () => {
    if (!settings.enabled || settings.sound === 'none') {
      return;
    }

    try {
      const ctx = getAudioContext();

      // Resume audio context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Stop any existing playback
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
      }

      // Create gain node for volume control
      gainRef.current = ctx.createGain();
      gainRef.current.connect(ctx.destination);

      // Start at 0 for fade-in
      gainRef.current.gain.setValueAtTime(0, ctx.currentTime);

      // Load and play audio
      const buffer = await loadAudioBuffer(settings.sound);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gainRef.current);

      sourceRef.current = source;
      source.start();

      // Fade in over 2 seconds
      gainRef.current.gain.linearRampToValueAtTime(settings.volume, ctx.currentTime + 2);

      setIsPlaying(true);
    } catch (error) {
      console.warn('[AmbientMixer] Failed to start ambient sound:', error);
    }
  }, [settings.enabled, settings.sound, settings.volume, getAudioContext, loadAudioBuffer]);

  /**
   * Stop ambient sound with fade out
   */
  const stop = useCallback(() => {
    if (!sourceRef.current || !gainRef.current || !audioContextRef.current) {
      setIsPlaying(false);
      return;
    }

    const ctx = audioContextRef.current;
    const source = sourceRef.current;
    const gain = gainRef.current;

    // Fade out over 1 second
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);

    // Stop after fade completes
    setTimeout(() => {
      try {
        source.stop();
      } catch {
        // Already stopped
      }
      sourceRef.current = null;
      setIsPlaying(false);
    }, 1000);
  }, []);

  /**
   * Fade out over specified duration
   */
  const fadeOut = useCallback(
    (duration = 1) => {
      if (!gainRef.current || !audioContextRef.current || !sourceRef.current) {
        setIsPlaying(false);
        return;
      }

      const ctx = audioContextRef.current;
      const source = sourceRef.current;

      gainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);

      setTimeout(
        () => {
          try {
            source.stop();
          } catch {
            // Already stopped
          }
          sourceRef.current = null;
          setIsPlaying(false);
        },
        duration * 1000 + 50
      );
    },
    []
  );

  /**
   * Set volume with smooth transition
   */
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setSettings((prev) => ({ ...prev, volume: clampedVolume }));

    // Update live audio if playing
    if (gainRef.current && audioContextRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(
        clampedVolume,
        audioContextRef.current.currentTime + 0.1
      );
    }
  }, []);

  /**
   * Change ambient sound type
   */
  const setSound = useCallback(
    (sound: AmbientSoundType) => {
      setSettings((prev) => ({ ...prev, sound }));

      // If currently playing, restart with new sound
      if (isPlaying && sound !== 'none') {
        stop();
        // Small delay before starting new sound
        setTimeout(() => {
          void play();
        }, 100);
      } else if (sound === 'none') {
        stop();
      }
    },
    [isPlaying, stop, play]
  );

  /**
   * Toggle enabled state
   */
  const toggle = useCallback(() => {
    setSettings((prev) => {
      const newEnabled = !prev.enabled;
      if (!newEnabled && isPlaying) {
        stop();
      }
      return { ...prev, enabled: newEnabled };
    });
  }, [isPlaying, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch {
          // Already stopped
        }
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, []);

  return {
    settings,
    isPlaying,
    play,
    stop,
    setVolume,
    setSound,
    toggle,
    fadeOut,
  };
}
