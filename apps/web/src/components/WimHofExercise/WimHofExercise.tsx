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

import { useState, useCallback } from 'react';

import type { WimHofTechnique } from '../../lib/parseActivity';

import styles from './WimHofExercise.module.css';

// Component will be built incrementally - for now, placeholder implementation

export interface WimHofExerciseProps {
  technique: WimHofTechnique;
  introduction?: string;
  isFirstTime?: boolean;
  onComplete?: (stats: CompletionStats) => void;
  onStop?: () => void;
}

export interface CompletionStats {
  roundRetentions: number[];
  totalDuration: number;
  averageRetention: number;
  bestRetention: number;
}

export function WimHofExercise({
  technique,
  introduction,
  isFirstTime = false,
  onComplete,
  onStop,
}: WimHofExerciseProps) {
  const [exerciseState, setExerciseState] = useState<'idle' | 'active' | 'complete'>('idle');
  const [breathingMode, setBreathingMode] = useState<'auto' | 'manual'>('auto');

  // Placeholder: Will be replaced with useWimHofLoop hook integration
  const [currentRound, setCurrentRound] = useState(1);
  const [currentPhase, _setCurrentPhase] = useState<'rapid_breathing' | 'retention' | 'recovery'>(
    'rapid_breathing'
  );
  const [breathCount, setBreathCount] = useState(0);
  const [retentionTime, _setRetentionTime] = useState(0);
  const [roundRetentions, setRoundRetentions] = useState<number[]>([]);

  const handleStart = useCallback(() => {
    setExerciseState('active');
    setCurrentRound(1);
    setBreathCount(0);
    setRoundRetentions([]);
  }, []);

  const handleStop = useCallback(() => {
    setExerciseState('idle');
    onStop?.();
  }, [onStop]);

  const handleComplete = useCallback(() => {
    const stats: CompletionStats = {
      roundRetentions,
      totalDuration: 0, // Will be calculated by useWimHofLoop
      averageRetention: roundRetentions.reduce((a, b) => a + b, 0) / roundRetentions.length || 0,
      bestRetention: Math.max(...roundRetentions, 0),
    };
    setExerciseState('complete');
    onComplete?.(stats);
  }, [roundRetentions, onComplete]);

  // Render idle state
  if (exerciseState === 'idle') {
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

  // Render active state - simplified for now
  if (exerciseState === 'active') {
    return (
      <div className={styles.container}>
        <div className={styles.roundProgress}>
          <span className={styles.roundIndicator}>
            Round {currentRound} of {technique.rounds}
          </span>
          <span className={styles.phaseIndicator}>
            {currentPhase === 'rapid_breathing' &&
              `Breath ${String(breathCount)}/${String(technique.breaths_per_round)}`}
            {currentPhase === 'retention' && `Hold: ${String(retentionTime)}s`}
            {currentPhase === 'recovery' && 'Recovery'}
          </span>
        </div>

        <div className={styles.animationContainer}>
          <div className={styles.breathCircle}>
            {/* Placeholder - will be replaced with WimHofAnimation */}
            <div className={styles.circleContent}>
              {currentPhase === 'rapid_breathing' && (
                <div className={styles.breathCounter}>
                  <span className={styles.currentBreath}>{breathCount}</span>
                  <span className={styles.breathSeparator}>/</span>
                  <span className={styles.totalBreaths}>{technique.breaths_per_round}</span>
                </div>
              )}
              {currentPhase === 'retention' && (
                <div className={styles.retentionDisplay}>
                  <div className={styles.stopwatch}>{formatTime(retentionTime)}</div>
                  <div className={styles.targetHint}>
                    Target: {technique.retention_target_seconds}s
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.controls}>
          <button className={styles.button} onClick={handleStop}>
            Stop
          </button>
          {currentPhase === 'retention' && (
            <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={handleComplete}>
              Release & Continue
            </button>
          )}
        </div>

        <p className={styles.hint}>Full functionality coming in STEP 6 with useWimHofLoop hook</p>
      </div>
    );
  }

  // Render completion state
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

        {roundRetentions.length > 0 && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Average Hold</span>
              <span className={styles.statValue}>
                {formatTime(roundRetentions.reduce((a, b) => a + b, 0) / roundRetentions.length)}
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Best Round</span>
              <span className={styles.statValue}>{formatTime(Math.max(...roundRetentions))}</span>
            </div>
          </div>
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
  const secs = seconds % 60;
  return `${String(mins)}:${secs.toString().padStart(2, '0')}`;
}
