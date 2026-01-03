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

import type { BreathingTechnique, BreathingPhase, BreathingExerciseState } from './types';

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

  // Refs for timer management
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(0);

  /**
   * Clears the exercise timer
   */
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * Advances to the next phase or cycle
   */
  const advancePhase = useCallback(() => {
    setState((prev) => {
      const nextPhaseIndex = (prev.phaseIndex + 1) % 4;
      const nextPhase = PHASE_ORDER[nextPhaseIndex];
      const nextPhaseDuration = technique.durations[nextPhaseIndex];

      // If we've completed all phases (back to inhale), advance cycle
      if (nextPhaseIndex === 0) {
        const nextCycle = prev.currentCycle + 1;

        // Check if exercise is complete
        if (nextCycle > prev.totalCycles) {
          clearTimer();
          return {
            ...prev,
            isActive: false,
            isComplete: true,
          };
        }

        // Skip phases with 0 duration
        if (nextPhaseDuration === 0) {
          // Recursively advance (will handle in next tick)
          return {
            ...prev,
            currentPhase: nextPhase,
            phaseIndex: nextPhaseIndex,
            phaseTimeRemaining: 0,
            phaseTotalTime: 0,
            currentCycle: nextCycle,
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

      // Skip phases with 0 duration (e.g., no hold in 4-7-8)
      if (nextPhaseDuration === 0) {
        return {
          ...prev,
          currentPhase: nextPhase,
          phaseIndex: nextPhaseIndex,
          phaseTimeRemaining: 0,
          phaseTotalTime: 0,
        };
      }

      return {
        ...prev,
        currentPhase: nextPhase,
        phaseIndex: nextPhaseIndex,
        phaseTimeRemaining: nextPhaseDuration,
        phaseTotalTime: nextPhaseDuration,
      };
    });
  }, [technique.durations, clearTimer]);

  /**
   * Main timer tick - decrements time and advances phases
   */
  const tick = useCallback(() => {
    const now = Date.now();
    const elapsed = (now - lastTickRef.current) / 1000;
    lastTickRef.current = now;

    setState((prev) => {
      if (!prev.isActive || prev.isPaused || prev.isComplete) {
        return prev;
      }

      // If current phase has 0 duration, advance immediately
      if (prev.phaseTotalTime === 0) {
        return prev; // Will be handled by advancePhase effect
      }

      const newTimeRemaining = Math.max(0, prev.phaseTimeRemaining - elapsed);

      // Phase complete - advance
      if (newTimeRemaining <= 0) {
        return prev; // Will be handled by advancePhase effect
      }

      return {
        ...prev,
        phaseTimeRemaining: newTimeRemaining,
      };
    });
  }, []);

  /**
   * Effect to handle phase advancement when time runs out
   */
  useEffect(() => {
    if (state.isActive && !state.isPaused && !state.isComplete && state.phaseTimeRemaining <= 0) {
      advancePhase();
    }
  }, [state.isActive, state.isPaused, state.isComplete, state.phaseTimeRemaining, advancePhase]);

  /**
   * Effect to notify of phase changes
   */
  useEffect(() => {
    if (state.isActive && onPhaseChange) {
      onPhaseChange(state.currentPhase);
    }
  }, [state.currentPhase, state.isActive, onPhaseChange]);

  /**
   * Effect to notify of completion
   */
  useEffect(() => {
    if (state.isComplete && onComplete) {
      onComplete();
    }
  }, [state.isComplete, onComplete]);

  /**
   * Effect to manage the timer interval
   */
  useEffect(() => {
    if (state.isActive && !state.isPaused && !state.isComplete) {
      lastTickRef.current = Date.now();
      intervalRef.current = setInterval(tick, 100); // Update every 100ms for smooth countdown
    } else {
      clearTimer();
    }

    return clearTimer;
  }, [state.isActive, state.isPaused, state.isComplete, tick, clearTimer]);

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
