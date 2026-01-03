/* ============================================================================
   useMeditationAudio Hook
   ============================================================================
   Manages audio playback for guided meditation using the HTML5 Audio API.

   Unlike the breathing exercise audio (which uses Web Audio API for chimes
   and ambient mixing), meditation uses a simpler HTML5 Audio approach since
   we're playing a single long-form audio track.

   Features:
   - Plays meditation audio from URL
   - Tracks playback progress
   - Supports play/pause/stop/seek
   - Volume control
   - Loading state handling
   - Error handling
   ============================================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { MeditationState } from './types';

/** Options for the useMeditationAudio hook */
export interface UseMeditationAudioOptions {
  /** URL of the audio file to play */
  audioUrl: string;
  /** Initial volume (0-1), defaults to 0.8 */
  initialVolume?: number;
  /** Callback when playback ends naturally */
  onEnded?: () => void;
  /** Callback on time update (every ~250ms) */
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  /** Callback when audio loads */
  onLoaded?: (duration: number) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/** Return type for the useMeditationAudio hook */
export interface UseMeditationAudioReturn {
  /** Current meditation state */
  state: MeditationState;
  /** Current volume (0-1) */
  volume: number;
  /** Play the audio */
  play: () => Promise<void>;
  /** Pause the audio */
  pause: () => void;
  /** Stop and reset to beginning */
  stop: () => void;
  /** Seek to a position (0-1 as percentage of duration) */
  seek: (position: number) => void;
  /** Set volume (0-1) */
  setVolume: (volume: number) => void;
}

/**
 * Hook for managing meditation audio playback
 *
 * Uses HTML5 Audio API for straightforward long-form audio playback.
 * Provides a simple interface for controlling playback and tracking progress.
 */
export function useMeditationAudio({
  audioUrl,
  initialVolume = 0.8,
  onEnded,
  onTimeUpdate,
  onLoaded,
  onError,
}: UseMeditationAudioOptions): UseMeditationAudioReturn {
  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // State
  const [state, setState] = useState<MeditationState>({
    playbackState: 'idle',
    currentTime: 0,
    duration: 0,
    progress: 0,
    isLoading: false,
    error: null,
  });
  const [volume, setVolumeState] = useState(initialVolume);

  // Refs for callbacks to avoid stale closures
  const onEndedRef = useRef(onEnded);
  const onTimeUpdateRef = useRef(onTimeUpdate);
  const onLoadedRef = useRef(onLoaded);
  const onErrorRef = useRef(onError);

  // Keep refs updated
  useEffect(() => {
    onEndedRef.current = onEnded;
    onTimeUpdateRef.current = onTimeUpdate;
    onLoadedRef.current = onLoaded;
    onErrorRef.current = onError;
  }, [onEnded, onTimeUpdate, onLoaded, onError]);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    // Set initial volume
    audio.volume = initialVolume;

    // Event handlers
    const handleLoadStart = () => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));
    };

    const handleLoadedMetadata = () => {
      setState((prev) => ({
        ...prev,
        duration: audio.duration,
        isLoading: false,
      }));
      onLoadedRef.current?.(audio.duration);
    };

    const handleCanPlay = () => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    };

    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      const duration = audio.duration || 0;
      const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

      setState((prev) => ({
        ...prev,
        currentTime,
        progress,
      }));

      onTimeUpdateRef.current?.(currentTime, duration);
    };

    const handleEnded = () => {
      setState((prev) => ({
        ...prev,
        playbackState: 'complete',
        progress: 100,
      }));
      onEndedRef.current?.();
    };

    const handleError = () => {
      const error = new Error(audio.error?.message ?? 'Failed to load audio');
      setState((prev) => ({
        ...prev,
        playbackState: 'idle',
        isLoading: false,
        error,
      }));
      onErrorRef.current?.(error);
    };

    const handlePlay = () => {
      setState((prev) => ({
        ...prev,
        playbackState: 'playing',
      }));
    };

    const handlePause = () => {
      setState((prev) => {
        // Don't change to paused if we're complete
        if (prev.playbackState === 'complete') {
          return prev;
        }
        return {
          ...prev,
          playbackState: 'paused',
        };
      });
    };

    // Attach event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    // Cleanup
    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);

      // Clean up audio element
      audio.pause();
      audio.src = '';
    };
  }, [initialVolume]);

  // Update audio source when URL changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    // Reset state
    setState({
      playbackState: 'idle',
      currentTime: 0,
      duration: 0,
      progress: 0,
      isLoading: true,
      error: null,
    });

    // Set new source
    audio.src = audioUrl;
    audio.load();
  }, [audioUrl]);

  // Play audio
  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    try {
      setState((prev) => ({
        ...prev,
        playbackState: 'loading',
        isLoading: true,
      }));

      await audio.play();
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Playback failed');
      setState((prev) => ({
        ...prev,
        playbackState: 'idle',
        isLoading: false,
        error: err,
      }));
      onErrorRef.current?.(err);
    }
  }, []);

  // Pause audio
  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
  }, []);

  // Stop and reset
  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;

    setState((prev) => ({
      ...prev,
      playbackState: 'idle',
      currentTime: 0,
      progress: 0,
    }));
  }, []);

  // Seek to position (0-1)
  const seek = useCallback((position: number) => {
    const audio = audioRef.current;
    if (!audio?.duration) {
      return;
    }

    const clampedPosition = Math.max(0, Math.min(1, position));
    audio.currentTime = clampedPosition * audio.duration;
  }, []);

  // Set volume
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);

    const audio = audioRef.current;
    if (audio) {
      audio.volume = clampedVolume;
    }
  }, []);

  return {
    state,
    volume,
    play,
    pause,
    stop,
    seek,
    setVolume,
  };
}
