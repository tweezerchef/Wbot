import { useMemo } from 'react';

import styles from './BreathingProgress.module.css';
import type { BreathingProgressProps } from './types';

/**
 * BreathingProgress - Subtle cycle progress indicator
 *
 * Displays a row of dots at the top of the screen showing
 * completed, current, and remaining cycles. Designed to be
 * unobtrusive while providing helpful progress feedback.
 *
 * States:
 * - Complete: Filled white dot with glow
 * - Current: Blue dot with pulse animation
 * - Pending: Outline only
 *
 * @example
 * ```tsx
 * <BreathingProgress currentCycle={2} totalCycles={4} />
 * ```
 */
export function BreathingProgress({ currentCycle, totalCycles }: BreathingProgressProps) {
  // Generate array of dot states
  const dots = useMemo(() => {
    return Array.from({ length: totalCycles }, (_, index) => {
      const cycleNumber = index + 1;
      if (cycleNumber < currentCycle) {
        return 'complete';
      } else if (cycleNumber === currentCycle) {
        return 'current';
      } else {
        return 'pending';
      }
    });
  }, [currentCycle, totalCycles]);

  // Get the CSS class for a dot state
  const getDotClass = (state: 'complete' | 'current' | 'pending') => {
    switch (state) {
      case 'complete':
        return styles.dotComplete;
      case 'current':
        return styles.dotCurrent;
      case 'pending':
        return styles.dotPending;
    }
  };

  return (
    <div
      className={styles.progress}
      role="progressbar"
      aria-valuenow={currentCycle}
      aria-valuemin={1}
      aria-valuemax={totalCycles}
      aria-label={`Cycle ${String(currentCycle)} of ${String(totalCycles)}`}
    >
      {dots.map((state, index) => (
        <div key={index} className={`${styles.dot} ${getDotClass(state)}`} aria-hidden="true" />
      ))}
      {/* Text for mobile and screen readers */}
      <span className={styles.cycleText}>
        Cycle {currentCycle} of {totalCycles}
      </span>
    </div>
  );
}
