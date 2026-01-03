/* ============================================================================
   useBreathingAudio Hook
   ============================================================================
   Manages audio playback for the breathing exercise:
   - Ambient sounds (ocean waves, rain, forest)
   - Phase transition chimes
   - Volume control

   Uses Web Audio API for low-latency playback and smooth fading.
   Audio files sourced from Free Sounds Library (CC BY 4.0).
   ============================================================================ */

import { useEffect, useRef, useCallback, useState } from 'react';

import type { BreathingPhase, BreathingAudioSettings } from './types';

/** URLs for ambient sounds - royalty-free samples from Free Sounds Library (CC BY 4.0) */
const AMBIENT_SOUNDS: Record<string, string> = {
  ocean: '/audio/ocean-waves.mp3',
  rain: '/audio/gentle-rain.mp3',
  forest: '/audio/forest-ambience.mp3',
};

/** Frequencies for phase transition chimes (in Hz) */
const CHIME_FREQUENCIES: Record<BreathingPhase, number> = {
  inhale: 528, // C5 - Solfeggio frequency for transformation
  holdIn: 396, // G4 - Solfeggio frequency for liberation
  exhale: 417, // G#4 - Solfeggio frequency for change
  holdOut: 396, // G4 - Same as holdIn for consistency
};

/** Default audio settings */
const DEFAULT_SETTINGS: BreathingAudioSettings = {
  enabled: true,
  volume: 0.5,
  ambientSound: 'ocean',
  enableChimes: true,
};

/**
 * Hook for managing breathing exercise audio
 *
 * @param isActive - Whether the exercise is currently running
 * @param currentPhase - The current breathing phase
 * @param initialSettings - Optional initial audio settings
 * @returns Audio controls and current settings
 */
export function useBreathingAudio(
  isActive: boolean,
  currentPhase: BreathingPhase,
  initialSettings: Partial<BreathingAudioSettings> = {}
) {
  const [settings, setSettings] = useState<BreathingAudioSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });

  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const ambientSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ambientGainRef = useRef<GainNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const previousPhaseRef = useRef<BreathingPhase | null>(null);

  /**
   * Initialize the Web Audio API context
   * Supports both standard AudioContext and Safari's webkitAudioContext
   */
  const initAudioContext = useCallback(() => {
    // Use standard AudioContext (modern browsers all support it)
    audioContextRef.current ??= new AudioContext();
    return audioContextRef.current;
  }, []);

  /**
   * Play a gentle chime for phase transitions
   */
  const playChime = useCallback(
    (phase: BreathingPhase) => {
      if (!settings.enableChimes || !settings.enabled) {
        return;
      }

      try {
        const ctx = initAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(CHIME_FREQUENCIES[phase], ctx.currentTime);

        // Soft attack and decay for a gentle chime
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(settings.volume * 0.3, ctx.currentTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.8);
      } catch (error) {
        console.warn('Failed to play chime:', error);
      }
    },
    [settings.enableChimes, settings.enabled, settings.volume, initAudioContext]
  );

  /**
   * Load and play ambient sound from actual audio files
   */
  const startAmbientSound = useCallback(async () => {
    if (!settings.enabled || settings.ambientSound === 'none') {
      return;
    }

    try {
      const ctx = initAudioContext();

      // Resume audio context if suspended (required by browsers for user interaction)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Create gain node for volume control
      if (!ambientGainRef.current) {
        ambientGainRef.current = ctx.createGain();
        ambientGainRef.current.connect(ctx.destination);
      }

      // Set initial volume to 0 for fade-in
      ambientGainRef.current.gain.setValueAtTime(0, ctx.currentTime);

      // Get the audio file URL for the selected ambient sound
      const audioUrl = AMBIENT_SOUNDS[settings.ambientSound];
      if (!audioUrl) {
        console.warn(`No audio file found for ambient sound: ${settings.ambientSound}`);
        return;
      }

      // Fetch and decode the audio file (cache for reuse)
      if (!audioBufferRef.current) {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        audioBufferRef.current = await ctx.decodeAudioData(arrayBuffer);
      }

      // Create and configure source
      const source = ctx.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.loop = true;

      source.connect(ambientGainRef.current);

      // Store reference and start
      ambientSourceRef.current = source;
      source.start();

      // Fade in over 2 seconds
      ambientGainRef.current.gain.linearRampToValueAtTime(
        settings.volume * 0.4,
        ctx.currentTime + 2
      );
    } catch (error) {
      console.warn('Failed to start ambient sound:', error);
    }
  }, [settings.enabled, settings.ambientSound, settings.volume, initAudioContext]);

  /**
   * Stop ambient sound with fade-out
   */
  const stopAmbientSound = useCallback(() => {
    if (ambientSourceRef.current && ambientGainRef.current && audioContextRef.current) {
      const ctx = audioContextRef.current;

      // Fade out
      ambientGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);

      // Stop after fade
      setTimeout(() => {
        if (ambientSourceRef.current) {
          ambientSourceRef.current.stop();
          ambientSourceRef.current = null;
        }
      }, 1000);
    }
  }, []);

  /**
   * Update volume
   */
  const setVolume = useCallback((volume: number) => {
    setSettings((prev) => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
    if (ambientGainRef.current && audioContextRef.current) {
      ambientGainRef.current.gain.linearRampToValueAtTime(
        volume * 0.3,
        audioContextRef.current.currentTime + 0.1
      );
    }
  }, []);

  /**
   * Toggle audio on/off
   */
  const toggleAudio = useCallback(() => {
    setSettings((prev) => {
      const newEnabled = !prev.enabled;
      if (!newEnabled) {
        stopAmbientSound();
      }
      return { ...prev, enabled: newEnabled };
    });
  }, [stopAmbientSound]);

  /**
   * Toggle chimes on/off
   */
  const toggleChimes = useCallback(() => {
    setSettings((prev) => ({ ...prev, enableChimes: !prev.enableChimes }));
  }, []);

  /**
   * Set ambient sound type
   */
  const setAmbientSound = useCallback(
    (sound: BreathingAudioSettings['ambientSound']) => {
      // Clear cached audio buffer when changing sound type
      audioBufferRef.current = null;
      setSettings((prev) => ({ ...prev, ambientSound: sound }));
      // Restart ambient sound with new type
      if (isActive && settings.enabled) {
        stopAmbientSound();
        setTimeout(() => {
          void startAmbientSound();
        }, 100);
      }
    },
    [isActive, settings.enabled, stopAmbientSound, startAmbientSound]
  );

  // Start/stop ambient sound based on exercise state
  useEffect(() => {
    if (isActive && settings.enabled && settings.ambientSound !== 'none') {
      void startAmbientSound();
    } else {
      stopAmbientSound();
    }

    return stopAmbientSound;
  }, [isActive, settings.enabled, settings.ambientSound, startAmbientSound, stopAmbientSound]);

  // Play chime on phase change
  useEffect(() => {
    if (
      isActive &&
      previousPhaseRef.current !== null &&
      previousPhaseRef.current !== currentPhase
    ) {
      playChime(currentPhase);
    }
    previousPhaseRef.current = currentPhase;
  }, [isActive, currentPhase, playChime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, [stopAmbientSound]);

  return {
    settings,
    setVolume,
    toggleAudio,
    toggleChimes,
    setAmbientSound,
    playChime,
  };
}
