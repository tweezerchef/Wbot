import type { MoodRating } from '@wbot/shared';
import { useState, useCallback, useEffect, useRef } from 'react';

import { useHapticFeedback, useBreathingAudio, useBreathingLoop } from '../../hooks';
import type { ImmersiveBreathingProps, ImmersiveBreathingState, BreathingStats } from '../../types';

import { BreathingBackground } from './BreathingBackground';
import { BreathingCircle } from './BreathingCircle';
import { BreathingControls } from './BreathingControls';
import { BreathingProgress } from './BreathingProgress';
import styles from './ImmersiveBreathing.module.css';

import { MoodCheck } from '@/features/wellness';

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
  moodBefore,
  autoStart = false,
}: ImmersiveBreathingProps) {
  // UI state - extended to include mood check after completion
  // When autoStart is true, skip intro and go directly to active state
  const [uiState, setUiState] = useState<ImmersiveBreathingState | 'mood_check'>(
    autoStart ? 'active' : 'intro'
  );
  const [audioEnabled, setAudioEnabled] = useState(initialAudioEnabled);

  // Mood after exercise
  const [moodAfter, setMoodAfter] = useState<MoodRating | null>(null);

  // Track start time for stats
  const startTimeRef = useRef<number | null>(null);

  // Breathing loop hook - returns { state, phaseProgress, start, pause, resume, stop, reset }
  // When complete, show mood check if we had a moodBefore, otherwise go straight to complete
  const breathing = useBreathingLoop(technique, () => {
    if (moodBefore !== undefined) {
      setUiState('mood_check');
    } else {
      setUiState('complete');
    }
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

  // Auto-start the breathing loop when autoStart is true
  // This runs once on mount when coming from confirmation flow
  useEffect(() => {
    if (autoStart && !isActive && !isComplete) {
      startTimeRef.current = Date.now();
      breathing.start();
    }
  }, [autoStart, isActive, isComplete, breathing]);

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

  // Handle mood selection after exercise
  const handleMoodAfterSelect = useCallback((mood: MoodRating) => {
    setMoodAfter(mood);
  }, []);

  // Continue from mood check to completion screen
  const handleMoodCheckContinue = useCallback(() => {
    setUiState('complete');
  }, []);

  // Complete and call onComplete with stats
  const handleDone = useCallback(() => {
    const endTime = Date.now();
    const totalDuration = startTimeRef.current
      ? Math.round((endTime - startTimeRef.current) / 1000)
      : 0;

    const stats: BreathingStats = {
      techniqueName: technique.name,
      techniqueId: technique.id,
      cyclesCompleted: currentCycle,
      totalDuration,
      completedFully: isComplete,
      moodBefore,
      moodAfter: moodAfter ?? undefined,
    };

    onComplete(stats);
  }, [technique.name, technique.id, currentCycle, isComplete, moodBefore, moodAfter, onComplete]);

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

      {/* Mood check after exercise */}
      {uiState === 'mood_check' && (
        <div className={styles.complete}>
          <h2 className={styles.completeTitle}>How do you feel now?</h2>
          <MoodCheck
            label="After the exercise, how are you feeling?"
            value={moodAfter ?? undefined}
            onSelect={handleMoodAfterSelect}
            allowSkip={false}
          />

          <button
            type="button"
            className={styles.doneButton}
            onClick={handleMoodCheckContinue}
            disabled={moodAfter === null}
          >
            Continue
          </button>
        </div>
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

          {/* Show mood change if we tracked it */}
          {moodBefore !== undefined && moodAfter !== null && (
            <div className={styles.moodChange}>
              <span className={styles.moodLabel}>Mood change:</span>
              <span className={styles.moodDelta}>
                {moodAfter > moodBefore ? '+' : ''}
                {moodAfter - moodBefore}
              </span>
            </div>
          )}

          <button type="button" className={styles.doneButton} onClick={handleDone}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}
