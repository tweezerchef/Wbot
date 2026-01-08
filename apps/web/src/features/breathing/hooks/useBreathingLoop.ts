/* ============================================================================
   useBreathingLoop Hook
   ============================================================================
   Manages the state and timing of a breathing exercise session.
   Controls phase transitions, cycle counting, and exercise completion.

   Uses TanStack Query for state management, enabling:
   - Consistent state patterns across the app
   - Easy persistence if needed
   - DevTools integration for debugging
   ============================================================================ */

import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';

import type { BreathingTechnique, BreathingPhase, BreathingExerciseState } from '../types';

/** Order of phases in a breathing cycle */
const PHASE_ORDER: BreathingPhase[] = ['inhale', 'holdIn', 'exhale', 'holdOut'];

/**
 * Creates the initial state for a breathing exercise
 */
function createInitialState(technique: BreathingTechnique): BreathingExerciseState {
  return {
    isActive: false,
    isPaused: false,
    currentPhase: 'inhale',
    phaseIndex: 0,
    phaseTimeRemaining: technique.durations[0],
    phaseTotalTime: technique.durations[0],
    currentCycle: 1,
    totalCycles: technique.cycles,
    isComplete: false,
  };
}

/**
 * Hook for managing breathing exercise state and timing
 *
 * @param technique - The breathing technique configuration
 * @param onComplete - Optional callback when exercise completes
 * @param onPhaseChange - Optional callback when phase changes
 * @returns Exercise state and control functions
 */
export function useBreathingLoop(
  technique: BreathingTechnique,
  onComplete?: () => void,
  onPhaseChange?: (phase: BreathingPhase) => void
) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<BreathingExerciseState>(() => createInitialState(technique));

  // Refs for timer management and technique access
  const techniqueRef = useRef(technique);
  const onCompleteRef = useRef(onComplete);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const tickIntervalMs = 100; // Tick every 100ms

  // Keep refs up to date
  useEffect(() => {
    techniqueRef.current = technique;
    onCompleteRef.current = onComplete;
  }, [technique, onComplete]);

  /**
   * Clears the exercise timer
   * Wrapped in useCallback to maintain stable identity for dependency arrays
   */
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Main timer tick - decrements time and advances phases
   * Uses refs to access latest values, keeping the function stable
   */
  const tick = useCallback(() => {
    setState((prev) => {
      if (!prev.isActive || prev.isPaused || prev.isComplete) {
        return prev;
      }

      // Decrement by fixed tick interval (works with fake timers that don't advance Date.now())
      const tickSeconds = tickIntervalMs / 1000; // 0.1 seconds
      const newTimeRemaining = Math.max(0, prev.phaseTimeRemaining - tickSeconds);

      // Phase complete or zero-duration - advance immediately
      if (newTimeRemaining <= 0.01 || prev.phaseTotalTime === 0) {
        // Use 0.01 threshold for floating point
        // Guard: don't advance if we just entered this phase (prevents rapid multi-advancement)
        // If current time remaining is very close to total time, we just started this phase
        const justEnteredPhase = prev.phaseTimeRemaining >= prev.phaseTotalTime * 0.95;
        if (justEnteredPhase && prev.phaseTotalTime > 0) {
          // We just entered this phase in a previous tick, don't advance yet
          // Wait for at least one more tick to confirm we've been here
          return prev;
        }

        // Calculate next phase using ref to avoid closure issues
        const currentTechnique = techniqueRef.current;
        let nextPhaseIndex = (prev.phaseIndex + 1) % 4;
        let nextPhase = PHASE_ORDER[nextPhaseIndex];
        let nextPhaseDuration = currentTechnique.durations[nextPhaseIndex];

        // Skip consecutive zero-duration phases
        while (nextPhaseDuration === 0 && nextPhaseIndex !== prev.phaseIndex) {
          nextPhaseIndex = (nextPhaseIndex + 1) % 4;
          nextPhase = PHASE_ORDER[nextPhaseIndex];
          nextPhaseDuration = currentTechnique.durations[nextPhaseIndex];
        }

        // Check for cycle completion
        if (nextPhaseIndex === 0) {
          const nextCycle = prev.currentCycle + 1;

          if (nextCycle > prev.totalCycles) {
            // Call completion callback using ref
            onCompleteRef.current?.();
            return {
              ...prev,
              isActive: false,
              isComplete: true,
            };
          }

          return {
            ...prev,
            currentPhase: nextPhase,
            phaseIndex: nextPhaseIndex,
            phaseTimeRemaining: nextPhaseDuration,
            phaseTotalTime: nextPhaseDuration,
            currentCycle: nextCycle,
          };
        }

        return {
          ...prev,
          currentPhase: nextPhase,
          phaseIndex: nextPhaseIndex,
          phaseTimeRemaining: nextPhaseDuration,
          phaseTotalTime: nextPhaseDuration,
        };
      }

      // Normal tick - just update time remaining
      return {
        ...prev,
        phaseTimeRemaining: newTimeRemaining,
      };
    });
  }, []); // Empty dependencies - uses refs for all external values

  /**
   * Effect to notify of phase changes
   */
  useEffect(() => {
    if (state.isActive && onPhaseChange) {
      onPhaseChange(state.currentPhase);
    }
  }, [state.currentPhase, state.isActive, onPhaseChange]);

  /**
   * Effect to stop timer when completed
   */
  useEffect(() => {
    if (state.isComplete) {
      clearTimer();
    }
  }, [state.isComplete, clearTimer]);

  /**
   * Effect to manage the timer using setTimeout (more predictable with fake timers)
   */
  useEffect(() => {
    if (!state.isActive || state.isPaused || state.isComplete) {
      clearTimer();
      return clearTimer;
    }

    // Use setTimeout with manual rescheduling instead of setInterval
    // This ensures only one timer pending at a time (better for fake timers)
    const scheduleNextTick = () => {
      intervalRef.current = setTimeout(() => {
        tick();
        // Schedule next tick if still active
        if (intervalRef.current !== null) {
          scheduleNextTick();
        }
      }, tickIntervalMs);
    };

    scheduleNextTick();

    return clearTimer;
  }, [state.isActive, state.isPaused, state.isComplete, clearTimer, tick]);

  /**
   * Starts the breathing exercise
   */
  const start = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: true,
      isPaused: false,
      isComplete: false,
      currentPhase: 'inhale',
      phaseIndex: 0,
      phaseTimeRemaining: technique.durations[0],
      phaseTotalTime: technique.durations[0],
      currentCycle: 1,
    }));

    // Update query cache for potential cross-component access
    queryClient.setQueryData(['breathing-exercise', technique.id], { isActive: true });
  }, [technique, queryClient]);

  /**
   * Pauses the breathing exercise
   */
  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: true }));
  }, []);

  /**
   * Resumes a paused exercise
   */
  const resume = useCallback(() => {
    setState((prev) => ({ ...prev, isPaused: false }));
  }, []);

  /**
   * Stops the breathing exercise
   */
  const stop = useCallback(() => {
    clearTimer();
    setState(createInitialState(technique));
    queryClient.setQueryData(['breathing-exercise', technique.id], { isActive: false });
  }, [technique, clearTimer, queryClient]);

  /**
   * Resets to initial state
   */
  const reset = useCallback(() => {
    clearTimer();
    setState(createInitialState(technique));
  }, [technique, clearTimer]);

  /**
   * Calculate progress through current phase (0-1)
   */
  const phaseProgress =
    state.phaseTotalTime > 0 ? 1 - state.phaseTimeRemaining / state.phaseTotalTime : 0;

  return {
    state,
    phaseProgress,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
