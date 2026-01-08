/* ============================================================================
   WimHofExercise Component
   ============================================================================
   Interactive Wim Hof Method breathing exercise component.

   Features:
   - Round-based structure (3 rounds by default)
   - Rapid breathing phase with breath counter
   - User-controlled retention phase with stopwatch
   - Recovery phases between rounds
   - Both auto-paced and manual breathing modes
   - Session statistics tracking
   - Safety notices for first-time users

   The Wim Hof Method differs from continuous breathing exercises with its
   unique round-based structure and breath retention focus.
   ============================================================================ */

import { useState, useCallback, useEffect, useRef } from 'react';

import { useWimHofLoop } from '../../hooks';
import type { WimHofExerciseProps, CompletionStats } from '../../types';

import styles from './WimHofExercise.module.css';

export function WimHofExercise({
  technique,
  introduction,
  isFirstTime = false,
  onComplete,
  onStop,
}: WimHofExerciseProps) {
  // Breathing mode: auto (timed) or manual (user-controlled)
  const [breathingMode, setBreathingMode] = useState<'auto' | 'manual'>('auto');

  // Track if exercise has completed (for showing completion screen)
  const [showComplete, setShowComplete] = useState(false);

  // Store final stats for completion screen
  const finalStatsRef = useRef<CompletionStats | null>(null);

  // Handle completion callback - store stats and show completion screen
  const handleComplete = useCallback(
    (stats: CompletionStats) => {
      finalStatsRef.current = stats;
      setShowComplete(true);
      onComplete?.(stats);
    },
    [onComplete]
  );

  // Use the Wim Hof loop hook for state management
  const { state, start, pause, resume, stop, releaseRetention, nextBreath } = useWimHofLoop(
    technique,
    handleComplete
  );

  // Handle start - reset completion state and start exercise
  const handleStart = useCallback(() => {
    setShowComplete(false);
    finalStatsRef.current = null;
    start();
  }, [start]);

  // Handle stop - stop exercise and notify parent
  const handleStop = useCallback(() => {
    stop();
    onStop?.();
  }, [stop, onStop]);

  // Handle manual breath advancement via keyboard
  useEffect(() => {
    if (!state.isActive || state.isPaused || breathingMode !== 'manual') {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && state.currentPhase === 'rapid_breathing') {
        e.preventDefault();
        nextBreath();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isActive, state.isPaused, state.currentPhase, breathingMode, nextBreath]);

  // Get phase display text
  const getPhaseText = () => {
    switch (state.currentPhase) {
      case 'rapid_breathing':
        return breathingMode === 'manual' ? 'Press space or click' : 'Breathe rapidly';
      case 'retention':
        return 'Hold your breath';
      case 'recovery_inhale':
        return 'Deep breath in, hold';
      case 'recovery_pause':
        return 'Rest and recover';
      default:
        return '';
    }
  };

  // Render idle state (not active and not showing completion)
  if (!state.isActive && !showComplete) {
    return (
      <div className={styles.container}>
        <h3 className={styles.techniqueName}>{technique.name}</h3>

        {introduction && <p className={styles.introduction}>{introduction}</p>}

        {isFirstTime && (
          <div className={styles.safetyNotice}>
            <svg
              className={styles.warningIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div>
              <strong>Safety First:</strong>
              <ul className={styles.safetyList}>
                <li>Practice sitting or lying down</li>
                <li>Tingling is normal, dizziness means slow down</li>
                <li>Never practice while driving or in water</li>
              </ul>
            </div>
          </div>
        )}

        <div className={styles.techniqueInfo}>
          <p className={styles.techniquePattern}>
            {technique.rounds} rounds × {technique.breaths_per_round} breaths
          </p>
          <p className={styles.techniqueDescription}>{technique.description}</p>
        </div>

        <div className={styles.modeSelector}>
          <label className={styles.modeToggle}>
            <input
              type="checkbox"
              checked={breathingMode === 'manual'}
              onChange={(e) => {
                setBreathingMode(e.target.checked ? 'manual' : 'auto');
              }}
            />
            <span>Manual breath control (spacebar/click)</span>
          </label>
        </div>

        <button className={`${styles.button} ${styles.buttonStart}`} onClick={handleStart}>
          Start Exercise
        </button>
      </div>
    );
  }

  // Render active state
  if (state.isActive) {
    return (
      <div className={styles.container}>
        <div className={styles.roundProgress}>
          <span className={styles.roundIndicator}>
            Round {state.currentRound} of {technique.rounds}
          </span>
          <span className={styles.phaseIndicator}>{getPhaseText()}</span>
        </div>

        <div className={styles.animationContainer}>
          <div
            className={`${styles.breathCircle} ${
              state.currentPhase === 'rapid_breathing' ? styles.breathing : ''
            } ${state.currentPhase === 'retention' ? styles.holding : ''} ${
              state.currentPhase === 'recovery_inhale' || state.currentPhase === 'recovery_pause'
                ? styles.recovery
                : ''
            }`}
            onClick={
              breathingMode === 'manual' && state.currentPhase === 'rapid_breathing'
                ? nextBreath
                : undefined
            }
            onKeyDown={
              breathingMode === 'manual' && state.currentPhase === 'rapid_breathing'
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      nextBreath();
                    }
                  }
                : undefined
            }
            role={
              breathingMode === 'manual' && state.currentPhase === 'rapid_breathing'
                ? 'button'
                : undefined
            }
            tabIndex={
              breathingMode === 'manual' && state.currentPhase === 'rapid_breathing' ? 0 : undefined
            }
            aria-label={
              breathingMode === 'manual' && state.currentPhase === 'rapid_breathing'
                ? 'Click to advance breath'
                : undefined
            }
          >
            <div className={styles.circleContent}>
              {/* Rapid Breathing Phase - show breath counter */}
              {state.currentPhase === 'rapid_breathing' && (
                <div className={styles.breathCounter}>
                  <span className={styles.currentBreath}>{state.breathCount}</span>
                  <span className={styles.breathSeparator}>/</span>
                  <span className={styles.totalBreaths}>{technique.breaths_per_round}</span>
                </div>
              )}

              {/* Retention Phase - show stopwatch */}
              {state.currentPhase === 'retention' && (
                <div className={styles.retentionDisplay}>
                  <div className={styles.stopwatch}>{formatTime(state.retentionTime)}</div>
                  <div className={styles.targetHint}>
                    Target: {technique.retention_target_seconds}s
                  </div>
                </div>
              )}

              {/* Recovery Inhale Phase - show countdown */}
              {state.currentPhase === 'recovery_inhale' && (
                <div className={styles.recoveryDisplay}>
                  <div className={styles.recoveryLabel}>Hold</div>
                  <div className={styles.recoveryTimer}>{state.recoveryTimeRemaining}s</div>
                </div>
              )}

              {/* Recovery Pause Phase - show countdown */}
              {state.currentPhase === 'recovery_pause' && (
                <div className={styles.recoveryDisplay}>
                  <div className={styles.recoveryLabel}>Rest</div>
                  <div className={styles.recoveryTimer}>{state.recoveryTimeRemaining}s</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.controls}>
          {/* Pause/Resume button */}
          <button
            className={styles.button}
            onClick={state.isPaused ? resume : pause}
            aria-label={state.isPaused ? 'Resume exercise' : 'Pause exercise'}
          >
            {state.isPaused ? 'Resume' : 'Pause'}
          </button>

          {/* Stop button */}
          <button className={styles.button} onClick={handleStop}>
            Stop
          </button>

          {/* Release button during retention */}
          {state.currentPhase === 'retention' && (
            <button
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={releaseRetention}
            >
              Release
            </button>
          )}
        </div>

        {/* Paused indicator */}
        {state.isPaused && <p className={styles.hint}>Exercise paused</p>}

        {/* Manual mode hint */}
        {breathingMode === 'manual' &&
          state.currentPhase === 'rapid_breathing' &&
          !state.isPaused && (
            <p className={styles.hint}>Press spacebar or click the circle to breathe</p>
          )}
      </div>
    );
  }

  // Render completion state
  const stats = finalStatsRef.current;
  return (
    <div className={styles.container}>
      <div className={styles.completionContainer}>
        <svg
          className={styles.completionIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>

        <h3 className={styles.completionTitle}>Powerful Session!</h3>

        <p className={styles.completionMessage}>
          You completed {technique.rounds} rounds of Wim Hof breathing.
        </p>

        {stats && stats.roundRetentions.length > 0 && (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Average Hold</span>
                <span className={styles.statValue}>{formatTime(stats.averageRetention)}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Best Round</span>
                <span className={styles.statValue}>{formatTime(stats.bestRetention)}</span>
              </div>
            </div>

            {/* Show retention time for each round */}
            <div className={styles.roundBreakdown}>
              {stats.roundRetentions.map((time, index) => (
                <div key={index} className={styles.roundStat}>
                  <span className={styles.roundStatLabel}>Round {index + 1}</span>
                  <span className={styles.roundStatValue}>{formatTime(time)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={handleStart}>
          Do Another Round
        </button>
      </div>
    </div>
  );
}

// Helper function to format seconds as MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${String(mins)}:${secs.toString().padStart(2, '0')}`;
}
