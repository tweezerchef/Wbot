/**
 * Tests for useBreathingLoop hook
 *
 * This hook manages timing, phase progression, and cycle counting
 * for breathing exercises. These tests focus on identifying timing bugs.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { BreathingPhase } from '../types';
import { useBreathingLoop } from '../useBreathingLoop';

import {
  testTechniqueShort,
  testTechniqueWithZeros,
  testTechniqueAllZeroHolds,
  testTechniqueSingleCycle,
  testTechniqueVeryShort,
} from './mocks/technique';

// Create wrapper with QueryClientProvider
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

/**
 * Helper to advance time and flush React effects
 *
 * The hook uses recursive setTimeout scheduling where each tick schedules the next.
 * We need to advance time in chunks that match the tick interval (100ms) and
 * only run pending timers without immediately running newly scheduled ones.
 */
async function advanceTimersAndFlush(ms: number) {
  // Advance time in 100ms chunks to match the hook's tick interval
  const tickIntervalMs = 100;
  const steps = Math.ceil(ms / tickIntervalMs);

  for (let i = 0; i < steps; i++) {
    // eslint-disable-next-line @typescript-eslint/require-await -- act() requires async callback for proper flush
    await act(async () => {
      // advanceTimersByTime fires any timers that are due, but doesn't
      // immediately fire timers scheduled during those callbacks
      vi.advanceTimersByTime(tickIntervalMs);
    });
  }
}

describe('useBreathingLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('creates initial state with correct default values', () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      expect(result.current.state.isActive).toBe(false);
      expect(result.current.state.isPaused).toBe(false);
      expect(result.current.state.isComplete).toBe(false);
      expect(result.current.state.currentCycle).toBe(1);
    });

    it('initializes with technique-specific durations', () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      // testTechniqueShort has 1 second per phase
      expect(result.current.state.phaseTimeRemaining).toBe(1);
      expect(result.current.state.phaseTotalTime).toBe(1);
    });

    it('sets totalCycles from technique config', () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      // testTechniqueShort has 2 cycles
      expect(result.current.state.totalCycles).toBe(2);
    });

    it('starts in inactive state with inhale phase', () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      expect(result.current.state.isActive).toBe(false);
      expect(result.current.state.currentPhase).toBe('inhale');
      expect(result.current.state.phaseIndex).toBe(0);
    });

    it('provides phaseProgress of 0 initially', () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      expect(result.current.phaseProgress).toBe(0);
    });
  });

  describe('start()', () => {
    it('sets isActive to true', () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      expect(result.current.state.isActive).toBe(true);
    });

    it('resets to first phase (inhale)', () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      expect(result.current.state.currentPhase).toBe('inhale');
      expect(result.current.state.phaseIndex).toBe(0);
    });

    it('sets phaseTimeRemaining to first phase duration', () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      expect(result.current.state.phaseTimeRemaining).toBe(1);
    });

    it('resets currentCycle to 1', () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      expect(result.current.state.currentCycle).toBe(1);
    });

    it('sets isComplete to false', () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      expect(result.current.state.isComplete).toBe(false);
    });

    it('sets isPaused to false', () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      expect(result.current.state.isPaused).toBe(false);
    });
  });

  describe('timing and phase progression', () => {
    it('decrements phaseTimeRemaining over time', async () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      // Advance 500ms
      await advanceTimersAndFlush(500);

      // Should have ~0.5s remaining (started with 1s)
      expect(result.current.state.phaseTimeRemaining).toBeLessThan(1);
      expect(result.current.state.phaseTimeRemaining).toBeGreaterThan(0);
    });

    it('advances from inhale to holdIn when time expires', async () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      expect(result.current.state.currentPhase).toBe('inhale');

      // Advance past inhale duration (1s) in small increments to trigger effects
      for (let i = 0; i < 12; i++) {
        await advanceTimersAndFlush(100);
      }

      expect(result.current.state.currentPhase).toBe('holdIn');
    });

    it('advances through all 4 phases in order', async () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      const phaseOrder: BreathingPhase[] = ['inhale', 'holdIn', 'exhale', 'holdOut'];

      act(() => {
        result.current.start();
      });

      // Verify initial phase
      expect(result.current.state.currentPhase).toBe('inhale');

      // Advance through each phase (1s each + buffer)
      for (let i = 0; i < 4; i++) {
        // Advance 1.2s in 100ms increments
        for (let j = 0; j < 12; j++) {
          await advanceTimersAndFlush(100);
        }

        // Check next phase (wraps to inhale on cycle 2)
        const expectedPhase = phaseOrder[(i + 1) % 4];
        expect(result.current.state.currentPhase).toBe(expectedPhase);
      }
    });

    it('updates phaseProgress as time passes', async () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      expect(result.current.phaseProgress).toBe(0);

      // Advance halfway through phase
      await advanceTimersAndFlush(500);

      // Should be approximately 50% progress
      expect(result.current.phaseProgress).toBeGreaterThan(0.4);
      expect(result.current.phaseProgress).toBeLessThan(0.6);
    });
  });

  describe('zero-duration phase handling', () => {
    it('skips phases with 0 duration', async () => {
      // testTechniqueWithZeros: [2, 0, 2, 0]
      const { result } = renderHook(() => useBreathingLoop(testTechniqueWithZeros), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      expect(result.current.state.currentPhase).toBe('inhale');

      // Complete inhale (2s) in increments
      for (let i = 0; i < 25; i++) {
        await advanceTimersAndFlush(100);
      }

      // Should have skipped holdIn (0s) and be in exhale
      expect(result.current.state.currentPhase).toBe('exhale');
    });

    it('handles technique with all zero-duration hold phases', async () => {
      // testTechniqueAllZeroHolds: [1, 0, 0, 0]
      const { result } = renderHook(() => useBreathingLoop(testTechniqueAllZeroHolds), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      expect(result.current.state.currentCycle).toBe(1);

      // Complete inhale (1s) - should skip all zero-duration phases
      for (let i = 0; i < 15; i++) {
        await advanceTimersAndFlush(100);
      }

      // After skipping zero phases, should advance to cycle 2
      expect(result.current.state.currentCycle).toBe(2);
    });
  });

  describe('cycle counting', () => {
    it('advances cycle when completing holdOut phase', async () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      expect(result.current.state.currentCycle).toBe(1);

      // Complete all 4 phases (4s total for testTechniqueShort) in increments
      for (let i = 0; i < 45; i++) {
        await advanceTimersAndFlush(100);
      }

      expect(result.current.state.currentCycle).toBe(2);
    });

    it('completes after reaching totalCycles', async () => {
      // testTechniqueSingleCycle has 1 cycle, 4 phases of 1s each
      const { result } = renderHook(() => useBreathingLoop(testTechniqueSingleCycle), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      // Complete all phases of single cycle (4s)
      for (let i = 0; i < 45; i++) {
        await advanceTimersAndFlush(100);
      }

      expect(result.current.state.isComplete).toBe(true);
    });

    it('sets isActive to false on completion', async () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueSingleCycle), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      // Complete exercise
      for (let i = 0; i < 45; i++) {
        await advanceTimersAndFlush(100);
      }

      expect(result.current.state.isActive).toBe(false);
    });
  });

  describe('phaseProgress calculation', () => {
    it('returns 0 at start of phase', () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      expect(result.current.phaseProgress).toBe(0);
    });

    it('returns value between 0 and 1 during phase', async () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      await advanceTimersAndFlush(500);

      expect(result.current.phaseProgress).toBeGreaterThan(0);
      expect(result.current.phaseProgress).toBeLessThan(1);
    });

    it('calculates progress correctly (linear)', async () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      // Advance 50% through 1s phase
      await advanceTimersAndFlush(500);

      // Progress should be ~0.5 (accounting for timing variations)
      expect(result.current.phaseProgress).toBeCloseTo(0.5, 1);
    });
  });

  describe('pause() and resume()', () => {
    it('pause() sets isPaused to true', () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.state.isPaused).toBe(true);
    });

    it('pause() stops timer decrement', async () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      // Advance 300ms
      await advanceTimersAndFlush(300);

      const timeBeforePause = result.current.state.phaseTimeRemaining;

      act(() => {
        result.current.pause();
      });

      // Advance more time while paused
      await advanceTimersAndFlush(500);

      // Time should not have changed
      expect(result.current.state.phaseTimeRemaining).toBe(timeBeforePause);
    });

    it('resume() sets isPaused to false', () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.pause();
      });

      act(() => {
        result.current.resume();
      });

      expect(result.current.state.isPaused).toBe(false);
    });

    it('resume() continues countdown from current time', async () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      // Advance 300ms
      await advanceTimersAndFlush(300);

      const timeBeforePause = result.current.state.phaseTimeRemaining;

      act(() => {
        result.current.pause();
      });

      act(() => {
        result.current.resume();
      });

      // Advance 200ms after resume
      await advanceTimersAndFlush(200);

      // Time should have decreased from the paused value
      expect(result.current.state.phaseTimeRemaining).toBeLessThan(timeBeforePause);
    });

    it('paused state preserves current phase', async () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      const phaseBeforePause = result.current.state.currentPhase;

      act(() => {
        result.current.pause();
      });

      // Advance past what would be phase transition
      await advanceTimersAndFlush(2000);

      // Phase should not have changed
      expect(result.current.state.currentPhase).toBe(phaseBeforePause);
    });
  });

  describe('stop()', () => {
    it('resets all state to initial', async () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      // Advance some time
      await advanceTimersAndFlush(500);

      act(() => {
        result.current.stop();
      });

      expect(result.current.state.isActive).toBe(false);
      expect(result.current.state.isPaused).toBe(false);
      expect(result.current.state.isComplete).toBe(false);
      expect(result.current.state.currentPhase).toBe('inhale');
      expect(result.current.state.phaseIndex).toBe(0);
      expect(result.current.state.currentCycle).toBe(1);
    });

    it('resets phaseTimeRemaining to initial value', async () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      await advanceTimersAndFlush(500);

      act(() => {
        result.current.stop();
      });

      // testTechniqueShort starts with 1s
      expect(result.current.state.phaseTimeRemaining).toBe(1);
    });
  });

  describe('reset()', () => {
    it('resets to initial state', async () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      await advanceTimersAndFlush(500);

      act(() => {
        result.current.reset();
      });

      expect(result.current.state.isActive).toBe(false);
      expect(result.current.state.currentPhase).toBe('inhale');
    });
  });

  describe('callbacks', () => {
    it('calls onComplete callback when exercise finishes', async () => {
      const onComplete = vi.fn();

      const { result } = renderHook(() => useBreathingLoop(testTechniqueSingleCycle, onComplete), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      // Complete all phases
      for (let i = 0; i < 50; i++) {
        await advanceTimersAndFlush(100);
      }

      expect(onComplete).toHaveBeenCalled();
    });

    it('calls onComplete only once', async () => {
      const onComplete = vi.fn();

      const { result } = renderHook(() => useBreathingLoop(testTechniqueSingleCycle, onComplete), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      // Complete exercise
      for (let i = 0; i < 50; i++) {
        await advanceTimersAndFlush(100);
      }

      expect(result.current.state.isComplete).toBe(true);

      // Advance more time
      await advanceTimersAndFlush(1000);

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('calls onPhaseChange when phase changes', async () => {
      const onPhaseChange = vi.fn();

      const { result } = renderHook(
        () => useBreathingLoop(testTechniqueShort, undefined, onPhaseChange),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.start();
      });

      // Should call immediately on start with 'inhale'
      expect(onPhaseChange).toHaveBeenCalledWith('inhale');

      // Complete inhale phase
      for (let i = 0; i < 12; i++) {
        await advanceTimersAndFlush(100);
      }

      expect(onPhaseChange).toHaveBeenCalledWith('holdIn');
    });

    it('does not call onPhaseChange before start', () => {
      const onPhaseChange = vi.fn();

      renderHook(() => useBreathingLoop(testTechniqueShort, undefined, onPhaseChange), {
        wrapper: createWrapper(),
      });

      expect(onPhaseChange).not.toHaveBeenCalled();
    });
  });

  describe('edge cases and potential bugs', () => {
    it('handles rapid start/stop cycles', () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      // Rapid start/stop
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.start();
        });
        act(() => {
          result.current.stop();
        });
      }

      // Should be in clean initial state
      expect(result.current.state.isActive).toBe(false);
      expect(result.current.state.currentPhase).toBe('inhale');
    });

    it('handles start while already active', async () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      await advanceTimersAndFlush(500);

      // Start again while active
      act(() => {
        result.current.start();
      });

      // Should reset to beginning
      expect(result.current.state.phaseTimeRemaining).toBe(1);
      expect(result.current.state.currentPhase).toBe('inhale');
    });

    it('handles pause when not active (no-op)', () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      // Pause without starting
      act(() => {
        result.current.pause();
      });

      expect(result.current.state.isPaused).toBe(true);
      expect(result.current.state.isActive).toBe(false);
    });

    it('handles resume when not paused (no-op)', () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      // Resume without pause
      act(() => {
        result.current.resume();
      });

      expect(result.current.state.isPaused).toBe(false);
      expect(result.current.state.isActive).toBe(true);
    });

    it('cleans up timer on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      const { result, unmount } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('handles very short phase durations', async () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueVeryShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      // testTechniqueVeryShort has 0.5s phases, 1 cycle = 2s total
      for (let i = 0; i < 30; i++) {
        await advanceTimersAndFlush(100);
      }

      expect(result.current.state.isComplete).toBe(true);
    });
  });

  describe('state consistency', () => {
    it('maintains consistent state during phase transitions', async () => {
      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      // Check state is consistent through a full cycle
      for (let phase = 0; phase < 4; phase++) {
        expect(result.current.state.phaseIndex).toBe(phase);
        expect(result.current.state.isActive).toBe(true);
        expect(result.current.state.isComplete).toBe(false);

        // Advance through phase
        for (let i = 0; i < 12; i++) {
          await advanceTimersAndFlush(100);
        }
      }
    });

    it('phaseIndex matches currentPhase', () => {
      const phaseOrder: BreathingPhase[] = ['inhale', 'holdIn', 'exhale', 'holdOut'];

      const { result } = renderHook(() => useBreathingLoop(testTechniqueShort), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.start();
      });

      // Verify initial state
      expect(result.current.state.currentPhase).toBe(phaseOrder[result.current.state.phaseIndex]);
    });
  });
});
