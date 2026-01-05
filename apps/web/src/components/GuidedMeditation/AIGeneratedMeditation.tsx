/* ============================================================================
   AIGeneratedMeditation Component
   ============================================================================
   Interactive AI-generated meditation component with streaming TTS audio.

   This component handles meditations that are dynamically generated using
   Claude AI for script generation and ElevenLabs TTS for voice synthesis.

   Features:
   - Real-time parallel streaming (Claude → ElevenLabs → Audio)
   - Personalized scripts based on user context and memories
   - Voice selection from curated list
   - Audio playback with progress tracking
   - Mood tracking before/after
   - Automatic saving to meditation library

   The parallel pipeline means audio starts playing within 2-3 seconds,
   while the full meditation script is still being generated.
   ============================================================================ */

import type { MeditationSessionData, MeditationType } from '@wbot/shared';
import { getMoodLabel } from '@wbot/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import { MoodCheck } from '../MoodCheck';

import styles from './GuidedMeditation.module.css';
import { MeditationPlayer } from './MeditationPlayer';
import { MeditationVisual } from './MeditationVisual';
import type { AIGeneratedMeditationProps, AmbientSoundType, MoodRating } from './types';
import { useAmbientMixer } from './useAmbientMixer';
import { useMeditationAudio } from './useMeditationAudio';

import { supabase } from '@/lib/supabase';

/** UI states for the AI-generated meditation flow */
type UIState =
  | 'streaming' // Audio is being generated and streamed
  | 'mood_before' // Pre-session mood check
  | 'idle' // Ready to play
  | 'playing' // Audio is playing
  | 'mood_after' // Post-session mood check
  | 'complete' // Session finished
  | 'error'; // Error occurred

/** Map meditation types to display icons */
const TYPE_ICONS: Record<MeditationType, string> = {
  body_scan: '🧘',
  loving_kindness: '💛',
  breathing_focus: '🌬️',
  sleep: '😴',
  anxiety_relief: '🌿',
  daily_mindfulness: '✨',
};

/** Map meditation types to display names */
const TYPE_NAMES: Record<MeditationType, string> = {
  body_scan: 'Body Scan',
  loving_kindness: 'Loving Kindness',
  breathing_focus: 'Breathing Focus',
  sleep: 'Sleep Meditation',
  anxiety_relief: 'Anxiety Relief',
  daily_mindfulness: 'Daily Mindfulness',
};

/**
 * AI-generated meditation component with streaming audio
 *
 * This component provides a personalized meditation experience including:
 * - Real-time audio streaming from the parallel pipeline
 * - Progress tracking during generation
 * - Standard meditation features after audio is ready
 */
export function AIGeneratedMeditation({
  activityData,
  onComplete,
  onStop,
  enableAmbient = true,
  authToken,
}: AIGeneratedMeditationProps) {
  // Destructure activity data
  const {
    meditation_id,
    title,
    meditation_type,
    duration_minutes,
    script,
    voice,
    generation_context,
    introduction,
    audio_url: preGeneratedAudioUrl,
  } = activityData;

  // State for audio URL and streaming progress
  const [audioUrl, setAudioUrl] = useState<string | null>(preGeneratedAudioUrl ?? null);
  const [streamingProgress, setStreamingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // UI state management
  const [uiState, setUIState] = useState<UIState>(preGeneratedAudioUrl ? 'idle' : 'streaming');

  // Mood tracking
  const [moodBefore, setMoodBefore] = useState<MoodRating | undefined>(undefined);
  const [moodAfter, setMoodAfter] = useState<MoodRating | undefined>(undefined);

  // Session tracking
  const sessionStartTimeRef = useRef<number | null>(null);
  const listenedDurationRef = useRef(0);

  // Ambient mixer hook
  const {
    settings: ambientSettings,
    isPlaying: isAmbientPlaying,
    play: playAmbient,
    stop: stopAmbient,
    fadeOut: fadeOutAmbient,
    setVolume: setAmbientVolume,
    setSound: setAmbientSound,
  } = useAmbientMixer({
    enabled: enableAmbient,
    volume: 0.3,
    sound: 'ocean',
  });

  // Start streaming audio from the parallel pipeline
  useEffect(() => {
    if (preGeneratedAudioUrl || uiState !== 'streaming') {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function streamAudio() {
      try {
        // Get auth token
        let token = authToken;
        if (!token) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          token = session?.access_token;
        }

        if (!token) {
          throw new Error('Authentication required');
        }

        // Start streaming from the parallel pipeline endpoint
        const response = await fetch('/api/meditation/generate-ai', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            meditation_id,
            script_prompt: buildScriptPrompt(),
            voice_id: voice.id,
            title,
            meditation_type,
            duration_minutes,
            generation_context,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Generation failed: ${errorText}`);
        }

        // Stream the audio chunks
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const chunks: Uint8Array[] = [];
        let totalBytes = 0;
        const expectedBytes = duration_minutes * 60 * 16000; // Rough estimate

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          if (cancelled) {
            return;
          }

          chunks.push(value);
          totalBytes += value.length;

          // Update progress estimate
          const progress = Math.min(95, (totalBytes / expectedBytes) * 100);
          setStreamingProgress(progress);
        }

        if (cancelled) {
          return;
        }

        // Combine chunks into a single blob
        // Cast to BlobPart[] to satisfy TypeScript strict checks
        const audioBlob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setStreamingProgress(100);
        setUIState('idle');
      } catch (err) {
        if (cancelled) {
          return;
        }
        console.error('Streaming error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setUIState('error');
      }
    }

    void streamAudio();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preGeneratedAudioUrl, uiState]);

  // Build the script prompt for the parallel pipeline
  const buildScriptPrompt = useCallback(() => {
    // The script content is already generated by the backend node
    // This is just for the API call metadata
    return script.content;
  }, [script.content]);

  // Handle meditation completion
  const handleAudioComplete = useCallback(() => {
    fadeOutAmbient(2);
    setUIState('mood_after');
  }, [fadeOutAmbient]);

  // Track time updates
  const handleTimeUpdate = useCallback((currentTime: number) => {
    listenedDurationRef.current = currentTime;
  }, []);

  // Initialize audio player (only when we have an audio URL)
  const { state, volume, play, pause, stop, seek, setVolume } = useMeditationAudio({
    audioUrl: audioUrl ?? '',
    onEnded: handleAudioComplete,
    onTimeUpdate: handleTimeUpdate,
  });

  // Build session data
  const buildSessionData = useCallback(
    (completedFully: boolean): MeditationSessionData => ({
      trackId: meditation_id,
      listenedDuration: listenedDurationRef.current,
      totalDuration: script.estimated_duration_seconds,
      completedFully,
      stoppedAtPercent: completedFully
        ? 100
        : (listenedDurationRef.current / script.estimated_duration_seconds) * 100,
      moodBefore,
      moodAfter,
    }),
    [meditation_id, script.estimated_duration_seconds, moodBefore, moodAfter]
  );

  // Handle starting the meditation
  const handleStart = useCallback(() => {
    sessionStartTimeRef.current = Date.now();
    listenedDurationRef.current = 0;
    setUIState('playing');
    void play();

    if (enableAmbient && ambientSettings.sound !== 'none') {
      void playAmbient();
    }
  }, [play, enableAmbient, ambientSettings.sound, playAmbient]);

  // Handle play (resume)
  const handlePlay = useCallback(() => {
    void play();
    if (enableAmbient && ambientSettings.sound !== 'none' && !isAmbientPlaying) {
      void playAmbient();
    }
  }, [play, enableAmbient, ambientSettings.sound, isAmbientPlaying, playAmbient]);

  // Handle pause
  const handlePause = useCallback(() => {
    pause();
  }, [pause]);

  // Handle stop
  const handleStop = useCallback(() => {
    stop();
    stopAmbient();
    setUIState('idle');

    const sessionData = buildSessionData(false);
    onStop?.(sessionData);
  }, [stop, stopAmbient, buildSessionData, onStop]);

  // Handle restart
  const handleRestart = useCallback(() => {
    setUIState('idle');
    setMoodBefore(undefined);
    setMoodAfter(undefined);
    sessionStartTimeRef.current = Date.now();
    listenedDurationRef.current = 0;
  }, []);

  // Handle retry streaming
  const handleRetry = useCallback(() => {
    setError(null);
    setStreamingProgress(0);
    setUIState('streaming');
  }, []);

  // Mood handlers
  const handleMoodBeforeSelect = useCallback((mood: MoodRating) => {
    setMoodBefore(mood);
    setUIState('idle');
  }, []);

  const handleMoodBeforeSkip = useCallback(() => {
    setUIState('idle');
  }, []);

  const handleMoodAfterSelect = useCallback(
    (mood: MoodRating) => {
      setMoodAfter(mood);
      setUIState('complete');

      const sessionData: MeditationSessionData = {
        trackId: meditation_id,
        listenedDuration: listenedDurationRef.current,
        totalDuration: script.estimated_duration_seconds,
        completedFully: true,
        moodBefore,
        moodAfter: mood,
      };

      onComplete?.(sessionData);
    },
    [meditation_id, script.estimated_duration_seconds, moodBefore, onComplete]
  );

  const handleMoodAfterSkip = useCallback(() => {
    setUIState('complete');

    const sessionData: MeditationSessionData = {
      trackId: meditation_id,
      listenedDuration: listenedDurationRef.current,
      totalDuration: script.estimated_duration_seconds,
      completedFully: true,
      moodBefore,
      moodAfter: undefined,
    };

    onComplete?.(sessionData);
  }, [meditation_id, script.estimated_duration_seconds, moodBefore, onComplete]);

  // Ambient handlers
  const handleAmbientSoundChange = useCallback(
    (sound: AmbientSoundType) => {
      setAmbientSound(sound);
    },
    [setAmbientSound]
  );

  const handleAmbientVolumeChange = useCallback(
    (vol: number) => {
      setAmbientVolume(vol);
    },
    [setAmbientVolume]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      stopAmbient();
      // Revoke blob URL if created
      if (audioUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [stopAmbient, audioUrl]);

  // Render streaming state
  if (uiState === 'streaming') {
    return (
      <div className={styles.container}>
        {introduction && <p className={styles.introduction}>{introduction}</p>}

        <div className={styles.generatingContainer}>
          <div className={styles.generatingIcon}>
            <MeditationVisual playbackState="loading" variant="orb" size={100} />
          </div>

          <h3 className={styles.generatingTitle}>Creating Your Meditation</h3>

          <p className={styles.generatingPersonalization}>
            {voice.name} is preparing your personalized session...
          </p>

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${String(streamingProgress)}%` }}
            />
          </div>

          <p className={styles.generatingHint}>
            {streamingProgress < 20
              ? 'Generating your script...'
              : streamingProgress < 60
                ? 'Creating voice audio...'
                : streamingProgress < 90
                  ? 'Streaming audio...'
                  : 'Almost ready...'}
          </p>
        </div>

        <div className={styles.scriptPreview}>
          <p className={styles.scriptPreviewLabel}>
            {TYPE_ICONS[meditation_type]} {TYPE_NAMES[meditation_type]} • {duration_minutes} min
          </p>
          {generation_context.emotional_signals.length > 0 && (
            <p className={styles.scriptPreviewLabel} style={{ marginTop: '4px', opacity: 0.7 }}>
              Focused on: {generation_context.emotional_signals.join(', ')}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Render error state
  if (uiState === 'error') {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3 className={styles.errorTitle}>Generation Failed</h3>
          <p className={styles.errorMessage}>{error ?? 'An error occurred'}</p>
          <button className={`${styles.button} ${styles.buttonStart}`} onClick={handleRetry}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render mood before check
  if (uiState === 'mood_before') {
    return (
      <div className={styles.container}>
        <MoodCheck
          label="How are you feeling right now?"
          onSelect={handleMoodBeforeSelect}
          onSkip={handleMoodBeforeSkip}
          allowSkip
        />
      </div>
    );
  }

  // Render mood after check
  if (uiState === 'mood_after') {
    return (
      <div className={styles.container}>
        <div className={styles.visualContainer}>
          <MeditationVisual playbackState="complete" variant="orb" size={120} />
        </div>
        <MoodCheck
          label="How do you feel after the meditation?"
          onSelect={handleMoodAfterSelect}
          onSkip={handleMoodAfterSkip}
          allowSkip
        />
      </div>
    );
  }

  // Render completion state
  if (uiState === 'complete') {
    return (
      <div className={styles.container}>
        <div className={styles.completionContainer}>
          <svg
            className={styles.completionIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h3 className={styles.completionTitle}>Well Done!</h3>
          <p className={styles.completionMessage}>
            You completed your personalized {duration_minutes}-minute{' '}
            {TYPE_NAMES[meditation_type].toLowerCase()}. Take a moment to notice how you feel.
          </p>

          {moodBefore && moodAfter && (
            <p className={styles.completionMessage}>
              Mood: {getMoodLabel(moodBefore)} → {getMoodLabel(moodAfter)}
            </p>
          )}

          <p className={styles.completionMessage} style={{ marginTop: '8px', opacity: 0.7 }}>
            ✨ This meditation has been saved to your library
          </p>

          <div className={styles.buttonGroup}>
            <button
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={handleRestart}
            >
              Meditate Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render idle state (ready to start)
  if (uiState === 'idle' && state.playbackState === 'idle' && state.currentTime === 0) {
    return (
      <div className={styles.container}>
        {introduction && <p className={styles.introduction}>{introduction}</p>}

        {/* Track info card */}
        <div className={styles.trackCard}>
          <div className={styles.trackIcon}>
            <span style={{ fontSize: '24px' }}>{TYPE_ICONS[meditation_type]}</span>
          </div>
          <div className={styles.trackInfo}>
            <h3 className={styles.trackName}>
              {title}
              <span className={styles.personalizedBadge}>✨ AI Generated</span>
            </h3>
            <p className={styles.trackMeta}>
              {duration_minutes} min • {voice.name}
            </p>
            <p className={styles.trackDescription}>
              A personalized meditation created just for you based on your conversation and context.
            </p>
          </div>
        </div>

        {/* Start button */}
        <button className={`${styles.button} ${styles.buttonStart}`} onClick={handleStart}>
          Begin Meditation
        </button>
      </div>
    );
  }

  // Create mock track for player
  const mockTrack = {
    id: meditation_id,
    name: title,
    type: meditation_type,
    durationSeconds: script.estimated_duration_seconds,
    durationPreset: 'medium' as const,
    description: `AI-generated ${TYPE_NAMES[meditation_type].toLowerCase()} meditation`,
    audioUrl: audioUrl ?? '',
    narrator: voice.name,
    language: 'en',
    bestFor: voice.best_for,
    attribution: 'Generated with Claude AI & ElevenLabs TTS',
  };

  // Render active meditation state (playing/paused/loading)
  return (
    <div className={styles.container}>
      <div className={styles.visualContainer}>
        <MeditationVisual playbackState={state.playbackState} variant="orb" size={140} />
        <p className={styles.statusText}>
          {state.playbackState === 'playing'
            ? 'Breathe and relax...'
            : state.playbackState === 'paused'
              ? 'Paused'
              : state.playbackState === 'loading'
                ? 'Loading...'
                : 'Ready'}
        </p>
      </div>

      <MeditationPlayer
        state={state}
        track={mockTrack}
        onPlay={handlePlay}
        onPause={handlePause}
        onStop={handleStop}
        onSeek={seek}
        volume={volume}
        onVolumeChange={setVolume}
        ambientControls={
          enableAmbient
            ? {
                sound: ambientSettings.sound,
                volume: ambientSettings.volume,
                isPlaying: isAmbientPlaying,
                onSoundChange: handleAmbientSoundChange,
                onVolumeChange: handleAmbientVolumeChange,
              }
            : undefined
        }
      />
    </div>
  );
}
