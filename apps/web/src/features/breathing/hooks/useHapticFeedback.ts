import { useCallback } from 'react';

/**
 * useHapticFeedback - Hook for vibration feedback on mobile devices
 *
 * Provides haptic feedback functions for the breathing exercise.
 * Uses the Web Vibration API where available, gracefully degrades
 * on devices/browsers that don't support it.
 *
 * Vibration patterns:
 * - Phase change: Short 50ms pulse
 * - Cycle complete: Triple pulse [50, 50, 50]
 * - Exercise complete: Celebration pattern [100, 50, 100, 50, 200]
 *
 * @param enabled Whether haptic feedback is enabled
 * @returns Object with haptic feedback functions
 *
 * @example
 * ```tsx
 * const haptic = useHapticFeedback(true);
 *
 * // In phase change handler
 * haptic.onPhaseChange();
 *
 * // When cycle completes
 * haptic.onCycleComplete();
 *
 * // When exercise finishes
 * haptic.onExerciseComplete();
 * ```
 */
export function useHapticFeedback(enabled: boolean) {
  /**
   * Execute a vibration pattern if supported and enabled
   */
  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (enabled && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(pattern);
        } catch {
          // Silently fail if vibration not allowed (e.g., user hasn't interacted yet)
        }
      }
    },
    [enabled]
  );

  /**
   * Short pulse on phase transition
   */
  const onPhaseChange = useCallback(() => {
    vibrate(50);
  }, [vibrate]);

  /**
   * Triple pulse when a cycle completes
   */
  const onCycleComplete = useCallback(() => {
    vibrate([50, 50, 50, 50, 50]);
  }, [vibrate]);

  /**
   * Celebration pattern when exercise finishes
   */
  const onExerciseComplete = useCallback(() => {
    vibrate([100, 50, 100, 50, 200]);
  }, [vibrate]);

  /**
   * Cancel any ongoing vibration
   */
  const cancel = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch {
        // Silently fail
      }
    }
  }, []);

  return {
    onPhaseChange,
    onCycleComplete,
    onExerciseComplete,
    cancel,
  };
}
