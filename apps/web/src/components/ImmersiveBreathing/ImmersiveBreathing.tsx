import { useState, useCallback, useEffect, useRef } from 'react';

import { BreathingBackground } from './BreathingBackground';
import { BreathingCircle } from './BreathingCircle';
import { BreathingControls } from './BreathingControls';
import { BreathingProgress } from './BreathingProgress';
import { useHapticFeedback } from './hooks/useHapticFeedback';
import styles from './ImmersiveBreathing.module.css';
import type { ImmersiveBreathingProps, ImmersiveBreathingState, BreathingStats } from './types';

import { useBreathingAudio } from '@/components/BreathingExercise/useBreathingAudio';
import { useBreathingLoop } from '@/components/BreathingExercise/useBreathingLoop';

/**
 * ImmersiveBreathing - Full-screen immersive breathing experience
 *
 * Orchestrates the breathing exercise with an Apple Watch-inspired
 * visual design. Manages the flow from intro → active → completion.
 *
 * Features:
 * - Animated gradient background
 * - Apple Watch-style breathing circle with petals
 * - Floating controls with glassmorphism
 * - Progress indicator
 * - Audio integration (ambient sounds, phase chimes)
 * - Haptic feedback on mobile
 * - Completion celebration animation
 *
 * @example
 * ```tsx
 * <ImmersiveBreathing
 *   technique={BREATHING_TECHNIQUES.box}
 *   introduction="Let's practice some calming breathing..."
 *   onComplete={(stats) => console.log('Completed:', stats)}
 *   onExit={() => console.log('User exited')}
 * />
 * ```
 */
export function ImmersiveBreathing({
  technique,
  introduction,
  onComplete,
  onExit,
  audioEnabled: initialAudioEnabled = true,
}: ImmersiveBreathingProps) {
  // UI state
  const [uiState, setUiState] = useState<ImmersiveBreathingState>('intro');
  const [audioEnabled, setAudioEnabled] = useState(initialAudioEnabled);

  // Track start time for stats
  const startTimeRef = useRef<number | null>(null);

  // Breathing loop hook - returns { state, phaseProgress, start, pause, resume, stop, reset }
  const breathing = useBreathingLoop(technique, () => {
    setUiState('complete');
  });

  // Destructure state for easier access
  const {
    isActive,
    isPaused,
    currentPhase,
    phaseTimeRemaining,
    phaseTotalTime,
    currentCycle,
    totalCycles,
    isComplete,
  } = breathing.state;

  // Audio hook - uses (isActive, currentPhase, initialSettings)
  const audio = useBreathingAudio(isActive && !isPaused, currentPhase, { enabled: audioEnabled });

  // Haptic feedback hook
  const haptic = useHapticFeedback(true);

  // Track phase changes for haptic feedback
  const previousPhaseRef = useRef(currentPhase);
  const previousCycleRef = useRef(currentCycle);

  useEffect(() => {
    if (isActive && !isPaused) {
      // Phase changed
      if (previousPhaseRef.current !== currentPhase) {
        haptic.onPhaseChange();
        previousPhaseRef.current = currentPhase;
      }

      // Cycle completed
      if (previousCycleRef.current !== currentCycle && currentCycle > 1) {
        haptic.onCycleComplete();
      }
      previousCycleRef.current = currentCycle;
    }
  }, [isActive, isPaused, currentPhase, currentCycle, haptic]);

  // Handle exercise completion
  useEffect(() => {
    if (isComplete) {
      haptic.onExerciseComplete();
    }
  }, [isComplete, haptic]);

  // Start the exercise
  const handleStart = useCallback(() => {
    setUiState('active');
    startTimeRef.current = Date.now();
    breathing.start();
  }, [breathing]);

  // Pause the exercise
  const handlePause = useCallback(() => {
    setUiState('paused');
    breathing.pause();
  }, [breathing]);

  // Resume the exercise
  const handleResume = useCallback(() => {
    setUiState('active');
    breathing.resume();
  }, [breathing]);

  // Stop the exercise and exit
  const handleStop = useCallback(() => {
    breathing.stop();
    haptic.cancel();
    onExit();
  }, [breathing, haptic, onExit]);

  // Toggle audio
  const handleToggleAudio = useCallback(() => {
    setAudioEnabled((prev) => !prev);
    audio.toggleAudio();
  }, [audio]);

  // Complete and call onComplete with stats
  const handleDone = useCallback(() => {
    const endTime = Date.now();
    const totalDuration = startTimeRef.current
      ? Math.round((endTime - startTimeRef.current) / 1000)
      : 0;

    const stats: BreathingStats = {
      techniqueName: technique.name,
      cyclesCompleted: currentCycle,
      totalDuration,
      completedFully: isComplete,
    };

    onComplete(stats);
  }, [technique.name, currentCycle, isComplete, onComplete]);

  // Format technique timing for display (e.g., "4-4-4-4")
  const timingDisplay = technique.durations.join('-');

  // Render based on UI state
  return (
    <div className={styles.container}>
      {/* Background - always visible */}
      <BreathingBackground phase={currentPhase} isActive={uiState === 'active'} />

      {/* Intro state */}
      {uiState === 'intro' && (
        <div className={styles.intro}>
          <h2 className={styles.introTitle}>Breathing Exercise</h2>
          {introduction && <p className={styles.introMessage}>{introduction}</p>}

          <div className={styles.techniqueInfo}>
            <span className={styles.techniqueName}>{technique.name}</span>
            <span className={styles.techniqueTiming}>{timingDisplay} seconds</span>
            <span className={styles.techniqueDescription}>{technique.description}</span>
          </div>

          <button type="button" className={styles.startButton} onClick={handleStart}>
            Begin Exercise
          </button>
        </div>
      )}

      {/* Active/Paused state */}
      {(uiState === 'active' || uiState === 'paused') && (
        <>
          {/* Progress dots */}
          <BreathingProgress currentCycle={currentCycle} totalCycles={totalCycles} />

          {/* Breathing circle */}
          <div className={styles.active}>
            <BreathingCircle
              phase={currentPhase}
              progress={breathing.phaseProgress}
              duration={phaseTotalTime}
              isActive={uiState === 'active'}
              timeRemaining={phaseTimeRemaining}
            />
          </div>

          {/* Controls */}
          <BreathingControls
            isPaused={uiState === 'paused'}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
            audioEnabled={audioEnabled}
            onToggleAudio={handleToggleAudio}
          />
        </>
      )}

      {/* Completion state */}
      {uiState === 'complete' && (
        <div className={styles.complete}>
          <div className={styles.completeIcon}>
            <svg className={styles.checkmark} viewBox="0 0 40 40">
              <path d="M10 20 L17 27 L30 14" />
            </svg>
          </div>

          <h2 className={styles.completeTitle}>Well Done!</h2>
          <p className={styles.completeMessage}>You completed {technique.name}</p>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{totalCycles}</span>
              <span className={styles.statLabel}>Cycles</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{timingDisplay}</span>
              <span className={styles.statLabel}>Pattern</span>
            </div>
          </div>

          <button type="button" className={styles.doneButton} onClick={handleDone}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}
