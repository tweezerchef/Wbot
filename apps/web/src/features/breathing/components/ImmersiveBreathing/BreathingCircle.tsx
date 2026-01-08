import { useMemo } from 'react';

import { PHASE_LABELS } from '../../types';
import type { BreathingCircleProps } from '../../types';

import styles from './BreathingCircle.module.css';

/**
 * BreathingCircle - Apple Watch-inspired breathing visualization
 *
 * A large animated circle with 6 flower petals that expand and contract
 * in sync with the breathing phases. The circle changes color based on
 * the current phase and displays the phase label and countdown timer.
 *
 * Visual elements:
 * - Main orb that scales 1x → 1.5x during inhale/holdIn
 * - 6 petals in flower pattern that spread outward when expanded
 * - Inner glow for depth effect
 * - Phase label and countdown timer overlay
 *
 * @example
 * ```tsx
 * <BreathingCircle
 *   phase="inhale"
 *   progress={0.5}
 *   duration={4}
 *   isActive={true}
 *   timeRemaining={2}
 * />
 * ```
 */
export function BreathingCircle({
  phase,
  progress: _progress,
  duration,
  isActive,
  timeRemaining,
}: BreathingCircleProps) {
  // Determine if we should show expanded state (inhale or holdIn)
  const isExpanded = phase === 'inhale' || phase === 'holdIn';

  // Get the CSS class for the current phase
  const circleClass = useMemo(() => {
    if (!isActive) {
      return styles.circleIdle;
    }

    switch (phase) {
      case 'inhale':
        return styles.circleInhale;
      case 'holdIn':
        return styles.circleHoldIn;
      case 'exhale':
        return styles.circleExhale;
      case 'holdOut':
        return styles.circleHoldOut;
      default:
        return styles.circleIdle;
    }
  }, [phase, isActive]);

  // Compute transition duration based on current phase duration
  // Use 90% of phase duration for smooth animation
  const transitionStyle = useMemo(() => {
    if (!isActive || duration === 0) {
      return { transitionDuration: '0.5s' };
    }
    return {
      transitionDuration: `${String(duration * 0.9)}s`,
    };
  }, [duration, isActive]);

  // Get phase label text
  const phaseLabel = isActive ? PHASE_LABELS[phase] : 'Ready';

  // Format time remaining for display
  const timerDisplay = useMemo(() => {
    if (!isActive) {
      return null;
    }
    return Math.ceil(timeRemaining);
  }, [isActive, timeRemaining]);

  // Petals class for expanded state
  const petalsClass = [styles.petals, isExpanded && styles.petalsExpanded]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={styles.container}
      role="img"
      aria-label={`Breathing circle: ${phaseLabel}${timerDisplay !== null ? `, ${String(timerDisplay)} seconds remaining` : ''}`}
    >
      <div className={styles.orb}>
        {/* Main breathing circle */}
        <div className={`${styles.circle} ${circleClass}`} style={transitionStyle} />

        {/* Flower petals */}
        <div className={petalsClass} style={transitionStyle}>
          <div className={styles.petal} />
          <div className={styles.petal} />
          <div className={styles.petal} />
          <div className={styles.petal} />
          <div className={styles.petal} />
          <div className={styles.petal} />
        </div>

        {/* Inner glow */}
        <div className={styles.innerGlow} />

        {/* Phase text and timer */}
        <div className={styles.textContainer}>
          <span className={styles.phaseLabel}>{phaseLabel}</span>
          {timerDisplay !== null ? (
            <span className={styles.timer}>{timerDisplay}</span>
          ) : (
            <span className={`${styles.timer} ${styles.timerIdle}`}>Press Start</span>
          )}
        </div>
      </div>
    </div>
  );
}
