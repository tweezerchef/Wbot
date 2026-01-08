/* ============================================================================
   BreathingExercise Component
   ============================================================================
   Interactive breathing exercise component that renders inline within the chat.

   Features:
   - Visual breathing animation with calming colors
   - Multiple breathing techniques (Box, 4-7-8, Coherent)
   - Ambient audio (ocean waves) with volume control
   - Progress tracking with cycle counter
   - Pause/resume/stop controls
   - Completion celebration
   - Accessibility support

   This component is designed to be embedded within chat messages when the AI
   suggests or initiates a breathing exercise.
   ============================================================================ */

import { useCallback, useState } from 'react';

import { useBreathingAudio, useBreathingLoop } from '../../hooks';
import type { BreathingExerciseProps } from '../../types';

import { BreathingAnimation } from './BreathingAnimation';
import styles from './BreathingExercise.module.css';

/**
 * Main breathing exercise component
 *
 * Provides a complete interactive breathing exercise experience including:
 * - Introduction message from AI
 * - Start button to begin exercise
 * - Animated breathing circle
 * - Progress indicator
 * - Audio controls
 * - Pause/Stop controls
 * - Completion message
 */
export function BreathingExercise({
  technique,
  introduction,
  onComplete,
  onStop,
  enableAudio = true,
}: BreathingExerciseProps) {
  const [showCompletion, setShowCompletion] = useState(false);

  // Handle exercise completion
  const handleComplete = useCallback(() => {
    setShowCompletion(true);
    onComplete?.();
  }, [onComplete]);

  // Initialize the breathing loop
  const { state, phaseProgress, start, pause, resume, stop } = useBreathingLoop(
    technique,
    handleComplete
  );

  // Initialize audio (ambient sounds + chimes)
  const audio = useBreathingAudio(state.isActive, state.currentPhase, {
    enabled: enableAudio,
  });

  // Handle stop button
  const handleStop = useCallback(() => {
    stop();
    onStop?.();
  }, [stop, onStop]);

  // Handle starting a new exercise after completion
  const handleRestart = useCallback(() => {
    setShowCompletion(false);
    start();
  }, [start]);

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
            You completed {technique.cycles} cycles of {technique.name}. Take a moment to notice how
            you feel.
          </p>
          <div className={styles.controls}>
            <button
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={handleRestart}
            >
              Do Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render idle state (before starting)
  if (!state.isActive) {
    return (
      <div className={styles.container}>
        {/* Introduction from AI */}
        {introduction && <p className={styles.introduction}>{introduction}</p>}

        {/* Technique info */}
        <div
          className={styles.techniqueInfo}
          style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)' }}
        >
          <h3 className={styles.techniqueName}>{technique.name}</h3>
          <p className={styles.techniqueTiming}>
            {technique.durations.join('-')} pattern · {technique.cycles} cycles
          </p>
        </div>

        {/* Preview animation */}
        <BreathingAnimation
          phase="inhale"
          progress={0}
          duration={technique.durations[0]}
          isActive={false}
        />

        {/* Start button */}
        <button className={`${styles.button} ${styles.buttonStart}`} onClick={start}>
          Start Exercise
        </button>

        {/* Audio toggle */}
        {enableAudio && (
          <button className={styles.audioToggle} onClick={audio.toggleAudio}>
            <svg
              className={styles.audioIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {audio.settings.enabled ? (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </>
              ) : (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </>
              )}
            </svg>
            {audio.settings.enabled ? 'Sound On' : 'Sound Off'}
          </button>
        )}
      </div>
    );
  }

  // Render active exercise state
  return (
    <div className={styles.container}>
      {/* Breathing animation */}
      <BreathingAnimation
        phase={state.currentPhase}
        progress={phaseProgress}
        duration={state.phaseTotalTime}
        isActive={true}
      />

      {/* Progress indicator */}
      <div className={styles.progressContainer}>
        <div className={styles.progressDots}>
          {Array.from({ length: state.totalCycles }, (_, i) => {
            const cycleNum = i + 1;
            let dotClass = styles.progressDot;
            if (cycleNum < state.currentCycle) {
              dotClass += ` ${styles.progressDotComplete}`;
            } else if (cycleNum === state.currentCycle) {
              dotClass += ` ${styles.progressDotActive}`;
            }
            return <div key={i} className={dotClass} />;
          })}
        </div>
        <span className={styles.progressText}>
          Cycle {state.currentCycle} of {state.totalCycles}
        </span>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {state.isPaused ? (
          <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={resume}>
            Resume
          </button>
        ) : (
          <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={pause}>
            Pause
          </button>
        )}
        <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={handleStop}>
          Stop
        </button>
      </div>

      {/* Audio toggle (smaller during exercise) */}
      {enableAudio && (
        <button className={styles.audioToggle} onClick={audio.toggleAudio}>
          <svg
            className={styles.audioIcon}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {audio.settings.enabled ? (
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            ) : (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </>
            )}
          </svg>
        </button>
      )}
    </div>
  );
}
