/* ============================================================================
   GuidedMeditation Component
   ============================================================================
   Interactive guided meditation component that renders inline within the chat.

   Features:
   - Audio playback with progress tracking
   - Visual meditation indicator (breathing animation)
   - Pause/resume/stop controls
   - Progress bar with seeking
   - Volume control
   - Completion celebration
   - Session data tracking for analytics

   This component is designed to be embedded within chat messages when the AI
   suggests or initiates a guided meditation session.
   ============================================================================ */

import type { MeditationSessionData } from '@wbot/shared';
import { useCallback, useRef, useState } from 'react';

import styles from './GuidedMeditation.module.css';
import { MeditationPlayer } from './MeditationPlayer';
import type { GuidedMeditationProps } from './types';
import { useMeditationAudio } from './useMeditationAudio';

/**
 * Main guided meditation component
 *
 * Provides a complete guided meditation experience including:
 * - Introduction message from AI
 * - Start button to begin meditation
 * - Audio player with controls
 * - Visual breathing indicator during playback
 * - Completion message with session stats
 */
export function GuidedMeditation({
  track,
  introduction,
  onComplete,
  onStop,
}: GuidedMeditationProps) {
  const [showCompletion, setShowCompletion] = useState(false);
  const sessionStartTimeRef = useRef<number | null>(null);
  const listenedDurationRef = useRef(0);

  // Handle meditation completion
  const handleComplete = useCallback(() => {
    setShowCompletion(true);

    const sessionData: MeditationSessionData = {
      trackId: track.id,
      listenedDuration: listenedDurationRef.current,
      totalDuration: track.durationSeconds,
      completedFully: true,
    };

    onComplete?.(sessionData);
  }, [track, onComplete]);

  // Track time updates for session data
  const handleTimeUpdate = useCallback((currentTime: number) => {
    listenedDurationRef.current = currentTime;
  }, []);

  // Initialize the audio player
  const { state, volume, play, pause, stop, seek, setVolume } = useMeditationAudio({
    audioUrl: track.audioUrl,
    onEnded: handleComplete,
    onTimeUpdate: handleTimeUpdate,
  });

  // Handle starting the meditation
  const handleStart = useCallback(() => {
    sessionStartTimeRef.current = Date.now();
    listenedDurationRef.current = 0;
    void play();
  }, [play]);

  // Wrapper for play that voids the promise (for event handlers)
  const handlePlay = useCallback(() => {
    void play();
  }, [play]);

  // Handle stop button
  const handleStop = useCallback(() => {
    stop();

    const sessionData: MeditationSessionData = {
      trackId: track.id,
      listenedDuration: listenedDurationRef.current,
      totalDuration: track.durationSeconds,
      completedFully: false,
      stoppedAtPercent: (listenedDurationRef.current / track.durationSeconds) * 100,
    };

    onStop?.(sessionData);
  }, [stop, track, onStop]);

  // Handle starting a new meditation after completion
  const handleRestart = useCallback(() => {
    setShowCompletion(false);
    sessionStartTimeRef.current = Date.now();
    listenedDurationRef.current = 0;
    void play();
  }, [play]);

  // Calculate duration display
  const durationMinutes = Math.round(track.durationSeconds / 60);

  // Render completion state
  if (showCompletion) {
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
  if (state.playbackState === 'idle' && state.currentTime === 0) {
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
          Start Meditation
        </button>

        {/* Attribution */}
        {track.attribution && <p className={styles.attribution}>{track.attribution}</p>}
      </div>
    );
  }

  // Render active meditation state
  return (
    <div className={styles.container}>
      {/* Visual breathing indicator during meditation */}
      <div className={styles.visualContainer}>
        <div
          className={`${styles.breathingCircle} ${state.playbackState === 'playing' ? styles.breathingActive : ''}`}
        >
          <div className={styles.breathingInner}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
        </div>
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
        onPause={pause}
        onStop={handleStop}
        onSeek={seek}
        volume={volume}
        onVolumeChange={setVolume}
      />

      {/* Attribution */}
      {track.attribution && <p className={styles.attribution}>{track.attribution}</p>}
    </div>
  );
}
