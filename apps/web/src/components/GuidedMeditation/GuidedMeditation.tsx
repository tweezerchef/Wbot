/* ============================================================================
   GuidedMeditation Component
   ============================================================================
   Interactive guided meditation component that renders inline within the chat.

   Features:
   - Audio playback with progress tracking
   - Visual meditation animation (orb, rings, or gradient)
   - Ambient sound mixer (ocean, rain, forest)
   - Before/after mood tracking
   - Pause/resume/stop controls
   - Progress bar with seeking
   - Dual volume controls (meditation + ambient)
   - Completion celebration
   - Session data tracking for analytics

   This component is designed to be embedded within chat messages when the AI
   suggests or initiates a guided meditation session.
   ============================================================================ */

import type { MeditationSessionData } from '@wbot/shared';
import { getMoodLabel } from '@wbot/shared';
import { useCallback, useEffect, useRef, useState } from 'react';

import { MoodCheck } from '../MoodCheck';

import styles from './GuidedMeditation.module.css';
import { MeditationPlayer } from './MeditationPlayer';
import { MeditationVisual } from './MeditationVisual';
import type { AmbientSoundType, GuidedMeditationProps, MoodRating } from './types';
import { useAmbientMixer } from './useAmbientMixer';
import { useMeditationAudio } from './useMeditationAudio';

/** UI states for the meditation flow */
type UIState = 'mood_before' | 'idle' | 'playing' | 'mood_after' | 'complete';

/**
 * Main guided meditation component
 *
 * Provides a complete guided meditation experience including:
 * - Introduction message from AI
 * - Before meditation mood check (optional)
 * - Start button to begin meditation
 * - Visual animation during playback
 * - Ambient sound mixer
 * - Audio player with dual controls
 * - After meditation mood check
 * - Completion message with session stats
 */
export function GuidedMeditation({
  track,
  introduction,
  onComplete,
  onStop,
  enableAmbient = true,
}: GuidedMeditationProps) {
  // UI state management
  const [uiState, setUIState] = useState<UIState>('idle');

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

  // Handle meditation completion (from audio ended)
  const handleAudioComplete = useCallback(() => {
    // Fade out ambient sound
    fadeOutAmbient(2);

    // Show mood after check
    setUIState('mood_after');
  }, [fadeOutAmbient]);

  // Track time updates for session data
  const handleTimeUpdate = useCallback((currentTime: number) => {
    listenedDurationRef.current = currentTime;
  }, []);

  // Initialize the audio player
  const { state, volume, play, pause, stop, seek, setVolume } = useMeditationAudio({
    audioUrl: track.audioUrl,
    onEnded: handleAudioComplete,
    onTimeUpdate: handleTimeUpdate,
  });

  // Build session data helper
  const buildSessionData = useCallback(
    (completedFully: boolean): MeditationSessionData => ({
      trackId: track.id,
      listenedDuration: listenedDurationRef.current,
      totalDuration: track.durationSeconds,
      completedFully,
      stoppedAtPercent: completedFully
        ? 100
        : (listenedDurationRef.current / track.durationSeconds) * 100,
      moodBefore,
      moodAfter,
    }),
    [track, moodBefore, moodAfter]
  );

  // Handle starting the meditation
  const handleStart = useCallback(() => {
    sessionStartTimeRef.current = Date.now();
    listenedDurationRef.current = 0;
    setUIState('playing');
    void play();

    // Start ambient sound if enabled
    if (enableAmbient && ambientSettings.sound !== 'none') {
      void playAmbient();
    }
  }, [play, enableAmbient, ambientSettings.sound, playAmbient]);

  // Wrapper for play (resume) that voids the promise
  const handlePlay = useCallback(() => {
    void play();
    // Resume ambient if it was playing
    if (enableAmbient && ambientSettings.sound !== 'none' && !isAmbientPlaying) {
      void playAmbient();
    }
  }, [play, enableAmbient, ambientSettings.sound, isAmbientPlaying, playAmbient]);

  // Handle pause
  const handlePause = useCallback(() => {
    pause();
  }, [pause]);

  // Handle stop button
  const handleStop = useCallback(() => {
    stop();
    stopAmbient();
    setUIState('idle');

    const sessionData = buildSessionData(false);
    onStop?.(sessionData);
  }, [stop, stopAmbient, buildSessionData, onStop]);

  // Handle starting a new meditation after completion
  const handleRestart = useCallback(() => {
    setUIState('idle');
    setMoodBefore(undefined);
    setMoodAfter(undefined);
    sessionStartTimeRef.current = Date.now();
    listenedDurationRef.current = 0;
  }, []);

  // Handle mood before selection
  const handleMoodBeforeSelect = useCallback((mood: MoodRating) => {
    setMoodBefore(mood);
    setUIState('idle');
  }, []);

  // Handle mood before skip
  const handleMoodBeforeSkip = useCallback(() => {
    setUIState('idle');
  }, []);

  // Handle mood after selection
  const handleMoodAfterSelect = useCallback(
    (mood: MoodRating) => {
      setMoodAfter(mood);
      setUIState('complete');

      const sessionData: MeditationSessionData = {
        trackId: track.id,
        listenedDuration: listenedDurationRef.current,
        totalDuration: track.durationSeconds,
        completedFully: true,
        moodBefore,
        moodAfter: mood,
      };

      onComplete?.(sessionData);
    },
    [track, moodBefore, onComplete]
  );

  // Handle mood after skip
  const handleMoodAfterSkip = useCallback(() => {
    setUIState('complete');

    const sessionData: MeditationSessionData = {
      trackId: track.id,
      listenedDuration: listenedDurationRef.current,
      totalDuration: track.durationSeconds,
      completedFully: true,
      moodBefore,
      moodAfter: undefined,
    };

    onComplete?.(sessionData);
  }, [track, moodBefore, onComplete]);

  // Handle ambient sound change
  const handleAmbientSoundChange = useCallback(
    (sound: AmbientSoundType) => {
      setAmbientSound(sound);
    },
    [setAmbientSound]
  );

  // Handle ambient volume change
  const handleAmbientVolumeChange = useCallback(
    (vol: number) => {
      setAmbientVolume(vol);
    },
    [setAmbientVolume]
  );

  // Cleanup ambient on unmount
  useEffect(() => {
    return () => {
      stopAmbient();
    };
  }, [stopAmbient]);

  // Calculate duration display
  const durationMinutes = Math.round(track.durationSeconds / 60);

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
          {/* Checkmark icon */}
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
            You completed a {durationMinutes}-minute {track.name.toLowerCase()} meditation. Take a
            moment to notice how you feel.
          </p>

          {/* Mood change display */}
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

  // Render idle state (before starting)
  if (uiState === 'idle' && state.playbackState === 'idle' && state.currentTime === 0) {
    return (
      <div className={styles.container}>
        {/* Introduction from AI */}
        {introduction && <p className={styles.introduction}>{introduction}</p>}

        {/* Track info card */}
        <div className={styles.trackCard}>
          <div className={styles.trackIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div className={styles.trackInfo}>
            <h3 className={styles.trackName}>{track.name}</h3>
            <p className={styles.trackMeta}>
              {durationMinutes} min • {track.narrator && `Guided by ${track.narrator}`}
            </p>
            <p className={styles.trackDescription}>{track.description}</p>
          </div>
        </div>

        {/* Start button */}
        <button className={`${styles.button} ${styles.buttonStart}`} onClick={handleStart}>
          Begin Meditation
        </button>

        {/* Attribution */}
        {track.attribution && <p className={styles.attribution}>{track.attribution}</p>}
      </div>
    );
  }

  // Render active meditation state (playing/paused/loading)
  return (
    <div className={styles.container}>
      {/* Visual animation during meditation */}
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

      {/* Audio player controls */}
      <MeditationPlayer
        state={state}
        track={track}
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

      {/* Attribution */}
      {track.attribution && <p className={styles.attribution}>{track.attribution}</p>}
    </div>
  );
}
