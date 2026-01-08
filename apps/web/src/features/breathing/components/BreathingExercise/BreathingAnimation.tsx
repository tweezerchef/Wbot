/* ============================================================================
   BreathingAnimation Component
   ============================================================================
   Visual representation of the breathing exercise - an animated circle that
   expands on inhale and contracts on exhale, with calming color transitions.

   Features:
   - Smooth scaling animation synced to breath phases
   - Phase-specific color gradients
   - Pulsing ring effect for visual rhythm
   - Accessible reduced-motion support
   ============================================================================ */

import { useMemo } from 'react';

import type { BreathingAnimationProps, BreathingPhase } from '../../types';
import { PHASE_LABELS, PHASE_TIMING_FUNCTIONS } from '../../types';

import styles from './BreathingExercise.module.css';

/**
 * Maps phases to their CSS class names
 */
const PHASE_CLASSES: Record<BreathingPhase, string> = {
  inhale: styles.circleInhale,
  holdIn: styles.circleHoldIn,
  exhale: styles.circleExhale,
  holdOut: styles.circleHoldOut,
};

/**
 * Breathing animation circle component
 *
 * Displays an animated circle that represents the current breathing phase.
 * The circle expands during inhale and contracts during exhale, with
 * color changes to indicate hold states.
 */
export function BreathingAnimation({
  phase,
  progress,
  duration,
  isActive,
}: BreathingAnimationProps) {
  // Calculate the CSS class for the current phase
  const circleClass = useMemo(() => {
    if (!isActive) {
      return `${styles.breathCircle} ${styles.circleIdle}`;
    }
    return `${styles.breathCircle} ${PHASE_CLASSES[phase]}`;
  }, [isActive, phase]);

  // Calculate transition duration based on phase duration
  const transitionStyle = useMemo(() => {
    if (!isActive) {
      return { transitionDuration: '0.5s' };
    }
    // Use the phase duration for smooth animation
    // Reduce slightly to ensure animation completes before phase ends
    const animationDuration = Math.max(0.5, duration * 0.9);
    return {
      transitionDuration: `${String(animationDuration)}s`,
      transitionTimingFunction: PHASE_TIMING_FUNCTIONS[phase],
    };
  }, [isActive, duration, phase]);

  // Format the time remaining for display
  const timeDisplay = useMemo(() => {
    const remaining = Math.ceil(duration * (1 - progress));
    return remaining > 0 ? remaining : '';
  }, [duration, progress]);

  return (
    <div className={styles.circleContainer}>
      {/* Pulsing ring effect */}
      <div
        className={`${styles.breathRing} ${isActive ? styles.breathRingActive : ''}`}
        aria-hidden="true"
      />

      {/* Main breathing circle */}
      <div
        className={circleClass}
        style={transitionStyle}
        role="img"
        aria-label={
          isActive
            ? `${PHASE_LABELS[phase]}: ${String(timeDisplay)} seconds remaining`
            : 'Breathing exercise ready'
        }
      />

      {/* Inner glow effect */}
      <div className={styles.innerGlow} aria-hidden="true" />

      {/* Phase text display */}
      <div className={styles.phaseDisplay}>
        <span className={styles.phaseLabel}>{isActive ? PHASE_LABELS[phase] : 'Ready'}</span>
        {isActive && duration > 0 && <span className={styles.phaseTimer}>{timeDisplay}</span>}
      </div>
    </div>
  );
}
