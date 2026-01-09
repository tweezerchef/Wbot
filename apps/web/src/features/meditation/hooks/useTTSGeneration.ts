/* ============================================================================
   useTTSGeneration Hook
   ============================================================================
   React hook for managing TTS meditation generation state.

   Handles:
   - Calling the backend API for TTS generation
   - Progress simulation during generation
   - Error handling and retry logic
   - Cache checking for instant playback
   ============================================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  GeneratedMeditationResult,
  MeditationPersonalization,
  PersonalizedScript,
  TTSGenerationState,
} from '../types';

import {
  checkMeditationCache,
  streamMeditationWithProgressivePlayback,
  streamPersonalizedMeditation,
} from '@/lib/meditation-tts';
import { supabase } from '@/lib/supabase';

/* ----------------------------------------------------------------------------
   Request Deduplication
   ---------------------------------------------------------------------------- */

/**
 * Module-level cache to deduplicate in-flight cache check requests.
 * Prevents multiple identical requests when component re-renders or
 * multiple instances are mounted simultaneously.
 */
const pendingCacheChecks = new Map<string, Promise<string | null>>();

/**
 * Get or create a deduplicated cache check request.
 * If a request for the same key is already in flight, returns that promise.
 */
function deduplicatedCacheCheck(
  authToken: string,
  scriptId: string,
  personalization?: { userName?: string; userGoal?: string }
): Promise<string | null> {
  const cacheKey = `${scriptId}:${personalization?.userName ?? ''}:${personalization?.userGoal ?? ''}`;

  // Return existing in-flight request if available
  const existing = pendingCacheChecks.get(cacheKey);
  if (existing) {
    return existing;
  }

  // Create new request and track it
  const promise = checkMeditationCache(authToken, scriptId, personalization).finally(() => {
    pendingCacheChecks.delete(cacheKey);
  });

  pendingCacheChecks.set(cacheKey, promise);
  return promise;
}

/* ----------------------------------------------------------------------------
   Types
   ---------------------------------------------------------------------------- */

export interface UseTTSGenerationOptions {
  /** The script to generate */
  script: PersonalizedScript;
  /** Personalization options */
  personalization?: MeditationPersonalization;
  /** Pre-generated audio URL (skip generation if provided) */
  preGeneratedAudioUrl?: string;
  /** Whether to auto-start generation on mount */
  autoGenerate?: boolean;
  /**
   * Auth token to use for API calls.
   * If provided, skips Supabase session check.
   * Useful for Storybook/testing where Supabase session isn't available.
   */
  authToken?: string;
  /**
   * Enable progressive playback mode.
   * When enabled, audio starts playing within 2-3 seconds using MediaSource API.
   * When disabled, waits for full audio download before playback.
   * @default true
   */
  useProgressivePlayback?: boolean;
  /** Callback when generation completes */
  onGenerated?: (result: GeneratedMeditationResult) => void;
  /** Callback when generation fails */
  onError?: (error: Error) => void;
}

export interface UseTTSGenerationReturn {
  /** Current generation state */
  state: TTSGenerationState;
  /** Generated audio URL (null if not yet generated, or when using progressive playback) */
  audioUrl: string | null;
  /** Progress percentage (0-100) during generation */
  progress: number;
  /** Error message if generation failed */
  error: string | null;
  /** Whether audio was served from cache */
  cached: boolean;
  /** Audio element ref for progressive playback (null when using URL-based playback) */
  audioElementRef: React.RefObject<HTMLAudioElement | null>;
  /** Whether progressive playback is active (audio playing while still streaming) */
  isProgressivePlaying: boolean;
  /** Start or restart generation */
  generate: () => Promise<void>;
  /** Reset state to idle */
  reset: () => void;
}

/* ----------------------------------------------------------------------------
   Hook Implementation
   ---------------------------------------------------------------------------- */

export function useTTSGeneration({
  script,
  personalization,
  preGeneratedAudioUrl,
  autoGenerate = true,
  authToken: providedAuthToken,
  useProgressivePlayback = true,
  onGenerated,
  onError,
}: UseTTSGenerationOptions): UseTTSGenerationReturn {
  // State
  const [state, setState] = useState<TTSGenerationState>(preGeneratedAudioUrl ? 'ready' : 'idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(preGeneratedAudioUrl ?? null);
  const [progress, setProgress] = useState(preGeneratedAudioUrl ? 100 : 0);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [isProgressivePlaying, setIsProgressivePlaying] = useState(false);

  // Refs for cleanup
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasStartedRef = useRef(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element for progressive playback
  useEffect(() => {
    if (useProgressivePlayback && !audioElementRef.current) {
      audioElementRef.current = new Audio();
    }
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current.src = '';
      }
    };
  }, [useProgressivePlayback]);

  // Cleanup progress interval
  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    clearProgressInterval();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
    }
    setState('idle');
    setAudioUrl(null);
    setProgress(0);
    setError(null);
    setCached(false);
    setIsProgressivePlaying(false);
    hasStartedRef.current = false;
  }, [clearProgressInterval]);

  // Generate meditation
  const generate = useCallback(async () => {
    // Don't regenerate if already generated
    if (audioUrl && state === 'ready') {
      return;
    }

    // Cleanup any previous generation
    clearProgressInterval();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Reset state
    setState('generating');
    setProgress(0);
    setError(null);

    try {
      // Start progress simulation
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          // Slow down as we approach 90%
          if (prev < 30) {
            return prev + 5;
          }
          if (prev < 60) {
            return prev + 3;
          }
          if (prev < 80) {
            return prev + 2;
          }
          if (prev < 90) {
            return prev + 0.5;
          }
          return prev;
        });
      }, 1000);

      // Get auth token - use provided token or get from Supabase session
      let authToken = providedAuthToken;
      if (!authToken) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Please sign in to generate personalized meditations');
        }
        authToken = session.access_token;
      }

      // First, check if cached audio exists (deduplicated to prevent duplicate requests)
      const cachedUrl = await deduplicatedCacheCheck(authToken, script.id, personalization);

      if (cachedUrl) {
        // Cache hit - instant playback
        clearProgressInterval();
        setProgress(100);
        setAudioUrl(cachedUrl);
        setCached(true);
        setState('ready');

        onGenerated?.({
          scriptId: script.id,
          audioUrl: cachedUrl,
          durationSeconds: script.durationEstimateSeconds,
          voiceId: 'cached',
          cached: true,
        });
        return;
      }

      // Stream new audio from API
      if (useProgressivePlayback && audioElementRef.current) {
        // Progressive playback - audio starts playing as it streams
        await streamMeditationWithProgressivePlayback(
          authToken,
          {
            scriptId: script.id,
            personalization: {
              userName: personalization?.userName,
              userGoal: personalization?.userGoal,
            },
          },
          audioElementRef.current,
          (bytesReceived, isPlaying) => {
            // Update progress based on estimated file size
            const estimatedBytes = script.durationEstimateSeconds * 10000;
            const progressValue = Math.min(90, (bytesReceived / estimatedBytes) * 100);
            setProgress(progressValue);
            setIsProgressivePlaying(isPlaying);
          }
        );

        // Check if aborted
        if (abortControllerRef.current.signal.aborted) {
          return;
        }

        // Success - streaming complete, audio element contains full audio
        clearProgressInterval();
        setProgress(100);
        setCached(false);
        setState('ready');

        onGenerated?.({
          scriptId: script.id,
          audioUrl: '', // Audio is in audioElementRef, not a URL
          durationSeconds: script.durationEstimateSeconds,
          voiceId: 'streamed-progressive',
          cached: false,
        });
      } else {
        // Standard buffered playback - wait for full download
        const blobUrl = await streamPersonalizedMeditation(
          authToken,
          {
            scriptId: script.id,
            personalization: {
              userName: personalization?.userName,
              userGoal: personalization?.userGoal,
            },
          },
          (bytesReceived) => {
            // Update progress based on estimated file size
            const estimatedBytes = script.durationEstimateSeconds * 10000;
            const progressValue = Math.min(90, (bytesReceived / estimatedBytes) * 100);
            setProgress(progressValue);
          }
        );

        // Check if aborted
        if (abortControllerRef.current.signal.aborted) {
          URL.revokeObjectURL(blobUrl);
          return;
        }

        // Success - audio is ready to play
        clearProgressInterval();
        setProgress(100);
        setAudioUrl(blobUrl);
        setCached(false);
        setState('ready');

        onGenerated?.({
          scriptId: script.id,
          audioUrl: blobUrl,
          durationSeconds: script.durationEstimateSeconds,
          voiceId: 'streamed',
          cached: false,
        });
      }
    } catch (err) {
      // Check if aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      clearProgressInterval();
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate meditation';
      setError(errorMessage);
      setState('error');
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [
    audioUrl,
    state,
    script.id,
    script.durationEstimateSeconds,
    personalization,
    providedAuthToken,
    useProgressivePlayback,
    clearProgressInterval,
    onGenerated,
    onError,
  ]);

  // Auto-generate on mount if enabled
  useEffect(() => {
    if (autoGenerate && !hasStartedRef.current && !preGeneratedAudioUrl && state === 'idle') {
      hasStartedRef.current = true;
      void generate();
    }
  }, [autoGenerate, preGeneratedAudioUrl, state, generate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearProgressInterval();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [clearProgressInterval]);

  return {
    state,
    audioUrl,
    progress,
    error,
    cached,
    audioElementRef,
    isProgressivePlaying,
    generate,
    reset,
  };
}
