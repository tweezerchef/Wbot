/* ============================================================================
   PersonalizedMeditation Component
   ============================================================================
   Interactive personalized meditation component with TTS-generated audio.

   This component handles meditations that are dynamically generated using
   ElevenLabs TTS API with personalization (user's name, goals, etc.).

   Features:
   - TTS generation loading state with progress indication
   - Personalized script with placeholder substitution preview
   - Audio playback once generated
   - All features from GuidedMeditation (ambient, mood tracking, etc.)
   - Cached audio detection (instant playback for repeated scripts)

   This component is designed to be embedded within chat messages when the AI
   generates a personalized meditation for the user.
   ============================================================================ */

import type { MeditationSessionData, MeditationType } from '@wbot/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import styles from './GuidedMeditation.module.css';
import { MeditationPlayer } from './MeditationPlayer';
import { MeditationVisual } from './MeditationVisual';
import { MoodCheck } from './MoodCheck';
import { getMoodLabel } from './moodHelpers';
import type { AmbientSoundType, MoodRating, PersonalizedMeditationProps } from './types';
import { useAmbientMixer } from './useAmbientMixer';
import { useMeditationAudio } from './useMeditationAudio';
import { useTTSGeneration } from './useTTSGeneration';

/** UI states for the personalized meditation flow */
type UIState =
  | 'generating'
  | 'mood_before'
  | 'idle'
  | 'playing'
  | 'mood_after'
  | 'complete'
  | 'error';

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
 * Personalized guided meditation component with TTS generation
 *
 * Provides a personalized meditation experience including:
 * - TTS generation with loading state
 * - Script preview with personalization
 * - All standard meditation features after generation
 */
export function PersonalizedMeditation({
  script,
  personalization,
  introduction,
  onComplete,
  onStop,
  enableAmbient = true,
  preGeneratedAudioUrl,
  authToken,
}: PersonalizedMeditationProps) {
  // TTS generation hook - handles API calls and progress
  const {
    state: generationState,
    audioUrl,
    progress: generationProgress,
    error: generationError,
    generate: retryGeneration,
  } = useTTSGeneration({
    script,
    personalization,
    preGeneratedAudioUrl,
    autoGenerate: true,
    authToken,
    onGenerated: () => {
      setUIState('idle');
    },
    onError: () => {
      setUIState('error');
    },
  });

  // UI state management - syncs with generation state
  const [uiState, setUIState] = useState<UIState>(preGeneratedAudioUrl ? 'idle' : 'generating');

  // Sync UI state with generation state
  useEffect(() => {
    if (generationState === 'generating') {
      setUIState('generating');
    } else if (generationState === 'error') {
      setUIState('error');
    } else if (generationState === 'ready' && uiState === 'generating') {
      setUIState('idle');
    }
  }, [generationState, uiState]);

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
      trackId: script.id,
      listenedDuration: listenedDurationRef.current,
      totalDuration: script.durationEstimateSeconds,
      completedFully,
      stoppedAtPercent: completedFully
        ? 100
        : (listenedDurationRef.current / script.durationEstimateSeconds) * 100,
      moodBefore,
      moodAfter,
    }),
    [script, moodBefore, moodAfter]
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

  // Handle retry generation
  const handleRetryGeneration = useCallback(() => {
    void retryGeneration();
  }, [retryGeneration]);

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
        trackId: script.id,
        listenedDuration: listenedDurationRef.current,
        totalDuration: script.durationEstimateSeconds,
        completedFully: true,
        moodBefore,
        moodAfter: mood,
      };

      onComplete?.(sessionData);
    },
    [script, moodBefore, onComplete]
  );

  const handleMoodAfterSkip = useCallback(() => {
    setUIState('complete');

    const sessionData: MeditationSessionData = {
      trackId: script.id,
      listenedDuration: listenedDurationRef.current,
      totalDuration: script.durationEstimateSeconds,
      completedFully: true,
      moodBefore,
      moodAfter: undefined,
    };

    onComplete?.(sessionData);
  }, [script, moodBefore, onComplete]);

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
    };
  }, [stopAmbient]);

  // Calculate duration display
  const durationMinutes = Math.round(script.durationEstimateSeconds / 60);

  // Render generating state
  if (uiState === 'generating') {
    return (
      <div className={styles.container}>
        {introduction && <p className={styles.introduction}>{introduction}</p>}

        <div className={styles.generatingContainer}>
          <div className={styles.generatingIcon}>
            <MeditationVisual playbackState="loading" variant="orb" size={100} />
          </div>

          <h3 className={styles.generatingTitle}>Creating Your Meditation</h3>

          {personalization?.userName && (
            <p className={styles.generatingPersonalization}>
              Personalizing for {personalization.userName}...
            </p>
          )}

          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${String(generationProgress)}%` }}
            />
          </div>

          <p className={styles.generatingHint}>
            {generationProgress < 30
              ? 'Preparing your script...'
              : generationProgress < 70
                ? 'Generating voice audio...'
                : 'Almost ready...'}
          </p>
        </div>

        <div className={styles.scriptPreview}>
          <p className={styles.scriptPreviewLabel}>
            {TYPE_ICONS[script.type]} {TYPE_NAMES[script.type]} • {durationMinutes} min
          </p>
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
          <p className={styles.errorMessage}>{generationError}</p>
          <button
            className={`${styles.button} ${styles.buttonStart}`}
            onClick={handleRetryGeneration}
          >
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
          <h3 className={styles.completionTitle}>
            Well Done{personalization?.userName ? `, ${personalization.userName}` : ''}!
          </h3>
          <p className={styles.completionMessage}>
            You completed your personalized {durationMinutes}-minute{' '}
            {TYPE_NAMES[script.type].toLowerCase()}. Take a moment to notice how you feel.
          </p>

          {moodBefore && moodAfter && (
            <p className={styles.completionMessage}>
              Mood: {getMoodLabel(moodBefore)} → {getMoodLabel(moodAfter)}
            </p>
          )}

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
            <span style={{ fontSize: '24px' }}>{TYPE_ICONS[script.type]}</span>
          </div>
          <div className={styles.trackInfo}>
            <h3 className={styles.trackName}>
              {script.title}
              {personalization?.userName && (
                <span className={styles.personalizedBadge}>✨ Personalized</span>
              )}
            </h3>
            <p className={styles.trackMeta}>{durationMinutes} min • AI-generated voice</p>
            <p className={styles.trackDescription}>
              {personalization?.userName
                ? `A meditation created just for you, ${personalization.userName}.`
                : 'A custom meditation generated with AI voice synthesis.'}
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
    id: script.id,
    name: script.title,
    type: script.type,
    durationSeconds: script.durationEstimateSeconds,
    durationPreset: 'medium' as const,
    description: `Personalized ${TYPE_NAMES[script.type].toLowerCase()} meditation`,
    audioUrl: audioUrl ?? '',
    narrator: 'ElevenLabs AI',
    language: script.language,
    bestFor: [],
    attribution: 'Generated with ElevenLabs TTS',
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
