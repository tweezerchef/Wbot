import { useMemo } from 'react';

import type { BreathingBackgroundProps } from '../../types';

import styles from './BreathingBackground.module.css';

/**
 * BreathingBackground - Animated gradient background for immersive breathing
 *
 * Creates an ambient, living atmosphere that subtly shifts colors based on
 * the current breathing phase. Includes floating particles for added depth.
 *
 * Features:
 * - Slow 15-second gradient animation cycle
 * - Phase-specific color overlays (blue for inhale, green for exhale, etc.)
 * - Floating particle effect for ambient atmosphere
 * - Supports prefers-reduced-motion
 *
 * @example
 * ```tsx
 * <BreathingBackground phase="inhale" isActive={true} />
 * ```
 */
export function BreathingBackground({ phase, isActive }: BreathingBackgroundProps) {
  // Compute phase-specific class name
  const phaseClass = useMemo(() => {
    if (!isActive) {
      return styles.phaseIdle;
    }

    switch (phase) {
      case 'inhale':
        return styles.phaseInhale;
      case 'holdIn':
        return styles.phaseHoldIn;
      case 'exhale':
        return styles.phaseExhale;
      case 'holdOut':
        return styles.phaseHoldOut;
      default:
        return styles.phaseIdle;
    }
  }, [phase, isActive]);

  // Combine classes for the background container
  const containerClasses = [styles.background, phaseClass, !isActive && styles.paused]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} aria-hidden="true">
      {/* Animated gradient layer */}
      <div className={styles.gradient} />

      {/* Phase-specific color overlay */}
      <div className={styles.phaseOverlay} />

      {/* Floating particles for ambient effect */}
      <div className={styles.particles}>
        <div className={styles.particle} />
        <div className={styles.particle} />
        <div className={styles.particle} />
        <div className={styles.particle} />
        <div className={styles.particle} />
      </div>
    </div>
  );
}
