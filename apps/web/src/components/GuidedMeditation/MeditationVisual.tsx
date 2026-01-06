/* ============================================================================
   MeditationVisual Component
   ============================================================================
   A calming visual animation for guided meditation.

   Features:
   - Gentle pulsing orb with gradient effects
   - Syncs with playback state (playing/paused)
   - Reduced motion support for accessibility
   - Subtle, non-distracting animation

   The visual is designed to be a focal point during meditation without
   being distracting. It provides a gentle, rhythmic animation that
   encourages relaxation.
   ============================================================================ */

import styles from './MeditationVisual.module.css';
import type { MeditationPlaybackState } from './types';

export interface MeditationVisualProps {
  /** Current playback state */
  playbackState: MeditationPlaybackState;
  /** Optional custom size (default: 160px) */
  size?: number;
  /** Optional variant for different visual styles */
  variant?: 'orb' | 'rings' | 'gradient';
}

/**
 * Calming visual animation for meditation sessions
 *
 * Provides a gentle, non-distracting focal point during meditation.
 * Responds to playback state and respects reduced motion preferences.
 */
export function MeditationVisual({
  playbackState,
  size = 160,
  variant = 'orb',
}: MeditationVisualProps) {
  const isActive = playbackState === 'playing';
  const isPaused = playbackState === 'paused';

  // Determine animation state class
  const stateClass = isActive ? styles.active : isPaused ? styles.paused : styles.idle;

  if (variant === 'rings') {
    return (
      <div
        className={`${styles.container} ${stateClass}`}
        style={{ '--visual-size': `${String(size)}px` } as React.CSSProperties}
        role="presentation"
        aria-hidden="true"
      >
        <div className={styles.rings}>
          <div className={styles.ring} style={{ animationDelay: '0s' }} />
          <div className={styles.ring} style={{ animationDelay: '1s' }} />
          <div className={styles.ring} style={{ animationDelay: '2s' }} />
          <div className={styles.centerDot} />
        </div>
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <div
        className={`${styles.container} ${stateClass}`}
        style={{ '--visual-size': `${String(size)}px` } as React.CSSProperties}
        role="presentation"
        aria-hidden="true"
      >
        <div className={styles.gradientOrb}>
          <div className={styles.gradientLayer1} />
          <div className={styles.gradientLayer2} />
          <div className={styles.gradientLayer3} />
        </div>
      </div>
    );
  }

  // Default: orb variant
  return (
    <div
      className={`${styles.container} ${stateClass}`}
      style={{ '--visual-size': `${String(size)}px` } as React.CSSProperties}
      role="presentation"
      aria-hidden="true"
    >
      <div className={styles.orb}>
        <div className={styles.orbCore} />
        <div className={styles.orbGlow} />
        <div className={styles.orbPulse} />
      </div>
    </div>
  );
}
