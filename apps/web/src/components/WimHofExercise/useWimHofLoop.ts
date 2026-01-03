/* ============================================================================
   useWimHofLoop Hook
   ============================================================================
   State management for Wim Hof Method breathing exercise.

   Manages the complex state machine for round-based breathing:
   1. Rapid breathing phase (30 breaths at tempo)
   2. Retention phase (user-controlled stopwatch)
   3. Recovery inhale phase (15 second hold)
   4. Recovery pause between rounds

   Unlike continuous breathing, Wim Hof uses rounds with user-controlled
   retention that varies per round.
   ============================================================================ */

import { useState, useEffect, useRef, useCallback } from 'react';

import type { WimHofTechnique } from '../../lib/parseActivity';

import type { CompletionStats } from './WimHofExercise';

/**
 * Phases within each Wim Hof round
 */
export type WimHofPhase =
  | 'rapid_breathing' // Fast in/out breaths with counter
  | 'retention' // Holding breath (exhale and hold)
  | 'recovery_inhale' // Deep inhale and 15s hold
  | 'recovery_pause'; // Rest between rounds

/**
 * State for the Wim Hof exercise
 */
export interface WimHofState {
  isActive: boolean;
  isPaused: boolean;
  currentPhase: WimHofPhase;
  currentRound: number;
  breathCount: number;
  retentionTime: number;
  roundRetentions: number[];
  recoveryTimeRemaining: number;
}

/**
 * Hook for managing Wim Hof breathing exercise state and timing
 *
 * @param technique - Wim Hof technique configuration
 * @param onComplete - Callback when exercise completes
 * @returns State and control functions
 */
export function useWimHofLoop(
  technique: WimHofTechnique,
  onComplete?: (stats: CompletionStats) => void
) {
  const [state, setState] = useState<WimHofState>({
    isActive: false,
    isPaused: false,
    currentPhase: 'rapid_breathing',
    currentRound: 1,
    breathCount: 0,
    retentionTime: 0,
    roundRetentions: [],
    recoveryTimeRemaining: 0,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);

  // Clear timer helper
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Auto-paced rapid breathing timer
  useEffect(() => {
    if (!state.isActive || state.isPaused || state.currentPhase !== 'rapid_breathing') {
      return;
    }

    timerRef.current = setInterval(() => {
      setState((prev) => {
        const newBreathCount = prev.breathCount + 1;

        // If we've exceeded the target, transition to retention
        if (newBreathCount > technique.breaths_per_round) {
          return {
            ...prev,
            currentPhase: 'retention',
            breathCount: 0,
            retentionTime: 0,
          };
        }

        // Otherwise, update breath count
        return {
          ...prev,
          breathCount: newBreathCount,
        };
      });
    }, technique.breath_tempo_ms);

    return () => {
      clearTimer();
    };
  }, [
    state.isActive,
    state.isPaused,
    state.currentPhase,
    technique.breath_tempo_ms,
    technique.breaths_per_round,
    clearTimer,
  ]);

  // Retention timer (counts up)
  useEffect(() => {
    if (!state.isActive || state.isPaused || state.currentPhase !== 'retention') {
      return;
    }

    timerRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        retentionTime: prev.retentionTime + 1,
      }));
    }, 1000);

    return () => {
      clearTimer();
    };
  }, [state.isActive, state.isPaused, state.currentPhase, clearTimer]);

  // Recovery timer (counts down)
  useEffect(() => {
    if (!state.isActive || state.isPaused) {
      return;
    }

    if (state.currentPhase === 'recovery_inhale' || state.currentPhase === 'recovery_pause') {
      timerRef.current = setInterval(() => {
        setState((prev) => {
          // Decrement recovery timer
          const newRecoveryTime = prev.recoveryTimeRemaining - 1;

          // Check if recovery timer reached zero
          if (newRecoveryTime <= 0) {
            // Recovery complete - check if exercise is done or next round
            if (prev.currentRound >= technique.rounds) {
              // All rounds complete! Mark for completion
              hasCompletedRef.current = true;

              return {
                ...prev,
                isActive: false,
                currentPhase: 'rapid_breathing',
              };
            } else {
              // Start next round
              return {
                ...prev,
                currentPhase: 'rapid_breathing',
                currentRound: prev.currentRound + 1,
                breathCount: 0,
                recoveryTimeRemaining: 0,
              };
            }
          }

          return {
            ...prev,
            recoveryTimeRemaining: newRecoveryTime,
          };
        });
      }, 1000);

      return () => {
        clearTimer();
      };
    }
  }, [
    state.isActive,
    state.isPaused,
    state.currentPhase,
    state.recoveryTimeRemaining,
    state.currentRound,
    technique.rounds,
    clearTimer,
  ]);

  // Handle completion callback
  useEffect(() => {
    if (hasCompletedRef.current && !state.isActive && onComplete) {
      const stats: CompletionStats = {
        roundRetentions: state.roundRetentions,
        totalDuration: startTimeRef.current
          ? Math.floor((Date.now() - startTimeRef.current) / 1000)
          : 0,
        averageRetention:
          state.roundRetentions.reduce((a, b) => a + b, 0) / state.roundRetentions.length,
        bestRetention: Math.max(...state.roundRetentions),
      };

      onComplete(stats);
      hasCompletedRef.current = false; // Reset flag
    }
  }, [state.isActive, state.roundRetentions, onComplete]);

  /**
   * Start the exercise
   */
  const start = useCallback(() => {
    hasCompletedRef.current = false;
    startTimeRef.current = Date.now();
    setState({
      isActive: true,
      isPaused: false,
      currentPhase: 'rapid_breathing',
      currentRound: 1,
      breathCount: 0,
      retentionTime: 0,
      roundRetentions: [],
      recoveryTimeRemaining: 0,
    });
  }, []);

  /**
   * Pause the exercise
   */
  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: true }));
    clearTimer();
  }, [clearTimer]);

  /**
   * Resume the exercise
   */
  const resume = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: false }));
  }, []);

  /**
   * Stop the exercise
   */
  const stop = useCallback(() => {
    clearTimer();
    setState((prev) => ({
      ...prev,
      isActive: false,
      isPaused: false,
    }));
  }, [clearTimer]);

  /**
   * Release retention and move to recovery
   * Called when user clicks "Release" during retention phase
   */
  const releaseRetention = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentPhase: 'recovery_inhale',
      roundRetentions: [...prev.roundRetentions, prev.retentionTime],
      recoveryTimeRemaining: technique.inhale_hold_seconds,
    }));
  }, [technique.inhale_hold_seconds]);

  /**
   * Advance to next breath (manual mode)
   * Called when user clicks or presses spacebar
   */
  const nextBreath = useCallback(() => {
    setState((prev) => {
      if (prev.currentPhase !== 'rapid_breathing') {
        return prev;
      }

      const newBreathCount = prev.breathCount + 1;

      // If we've exceeded the target, transition to retention
      if (newBreathCount > technique.breaths_per_round) {
        return {
          ...prev,
          currentPhase: 'retention',
          breathCount: 0,
          retentionTime: 0,
        };
      }

      return {
        ...prev,
        breathCount: newBreathCount,
      };
    });
  }, [technique.breaths_per_round]);

  return {
    state,
    start,
    pause,
    resume,
    stop,
    releaseRetention,
    nextBreath,
  };
}
