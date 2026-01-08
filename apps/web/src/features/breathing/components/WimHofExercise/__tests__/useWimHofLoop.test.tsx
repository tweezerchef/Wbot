/**
 * Tests for useWimHofLoop hook
 *
 * This hook manages the complex state machine for Wim Hof Method breathing:
 * - Round-based structure (vs continuous cycles)
 * - Rapid breathing phase with auto/manual pacing
 * - User-controlled retention phase (stopwatch)
 * - Recovery phases between rounds
 * - Round completion and statistics tracking
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useWimHofLoop } from '../../../hooks/useWimHofLoop';
import type { WimHofTechnique } from '../../../types';

// Mock Wim Hof technique for testing
const mockTechnique: WimHofTechnique = {
  id: 'wim_hof',
  name: 'Wim Hof Method',
  type: 'wim_hof',
  description: 'Test technique',
  best_for: ['energy'],
  rounds: 2,
  breaths_per_round: 3, // Reduced for faster tests
  breath_tempo_ms: 100, // Fast tempo for testing
  retention_target_seconds: 5,
  recovery_pause_seconds: 2,
  inhale_hold_seconds: 2,
};

/**
 * Helper to advance time and flush React effects
 */
function advanceTime(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('useWimHofLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('creates initial state with correct defaults', () => {
      const { result } = renderHook(() => useWimHofLoop(mockTechnique));

      expect(result.current.state.isActive).toBe(false);
      expect(result.current.state.isPaused).toBe(false);
      expect(result.current.state.currentPhase).toBe('rapid_breathing');
      expect(result.current.state.currentRound).toBe(1);
      expect(result.current.state.breathCount).toBe(0);
      expect(result.current.state.retentionTime).toBe(0);
      expect(result.current.state.roundRetentions).toEqual([]);
      expect(result.current.state.recoveryTimeRemaining).toBe(0);
    });

    it('provides control functions', () => {
      const { result } = renderHook(() => useWimHofLoop(mockTechnique));

      expect(typeof result.current.start).toBe('function');
      expect(typeof result.current.pause).toBe('function');
      expect(typeof result.current.resume).toBe('function');
      expect(typeof result.current.stop).toBe('function');
      expect(typeof result.current.releaseRetention).toBe('function');
      expect(typeof result.current.nextBreath).toBe('function');
    });
  });

  describe('start', () => {
    it('activates the exercise', () => {
      const { result } = renderHook(() => useWimHofLoop(mockTechnique));

      act(() => {
        result.current.start();
      });

      expect(result.current.state.isActive).toBe(true);
      expect(result.current.state.currentPhase).toBe('rapid_breathing');
      expect(result.current.state.currentRound).toBe(1);
    });

    it('resets state when starting', () => {
      const { result } = renderHook(() => useWimHofLoop(mockTechnique));

      // Start and progress
      act(() => {
        result.current.start();
      });
      advanceTime(200); // 2 breaths

      // Start again (restart)
      act(() => {
        result.current.start();
      });

      expect(result.current.state.breathCount).toBe(0);
      expect(result.current.state.currentRound).toBe(1);
      expect(result.current.state.roundRetentions).toEqual([]);
    });
  });

  describe('rapid breathing phase', () => {
    it('increments breath count on auto-pace timer', () => {
      const { result } = renderHook(() => useWimHofLoop(mockTechnique));

      act(() => {
        result.current.start();
      });

      expect(result.current.state.breathCount).toBe(0);

      // Advance by breath tempo (100ms)
      advanceTime(100);
      expect(result.current.state.breathCount).toBe(1);

      advanceTime(100);
      expect(result.current.state.breathCount).toBe(2);

      advanceTime(100);
      expect(result.current.state.breathCount).toBe(3);
    });

    it('transitions to retention after completing all breaths', () => {
      const { result } = renderHook(() => useWimHofLoop(mockTechnique));

      act(() => {
        result.current.start();
      });

      // After 3 breaths, should show final count
      advanceTime(300);
      expect(result.current.state.breathCount).toBe(3);
      expect(result.current.state.currentPhase).toBe('rapid_breathing');

      // Next tick triggers transition
      advanceTime(100);
      expect(result.current.state.currentPhase).toBe('retention');
      expect(result.current.state.breathCount).toBe(0); // Reset for next round
      expect(result.current.state.retentionTime).toBe(0);
    });

    it('supports manual breath advancement', () => {
      const { result } = renderHook(() => useWimHofLoop(mockTechnique));

      act(() => {
        result.current.start();
      });

      // Manually advance breaths (not waiting for timer)
      act(() => {
        result.current.nextBreath();
      });
      expect(result.current.state.breathCount).toBe(1);

      act(() => {
        result.current.nextBreath();
      });
      expect(result.current.state.breathCount).toBe(2);

      act(() => {
        result.current.nextBreath();
      });
      expect(result.current.state.breathCount).toBe(3);
      expect(result.current.state.currentPhase).toBe('rapid_breathing');

      // Next manual breath should trigger retention
      act(() => {
        result.current.nextBreath();
      });
      expect(result.current.state.currentPhase).toBe('retention');
      expect(result.current.state.breathCount).toBe(0);
    });
  });

  describe('retention phase', () => {
    beforeEach(() => {
      // Helper to get to retention phase
    });

    it('counts retention time in seconds', () => {
      const { result } = renderHook(() => useWimHofLoop(mockTechnique));

      act(() => {
        result.current.start();
      });

      // Get to retention (3 breaths + 1 tick to transition = 400ms)
      advanceTime(400);

      expect(result.current.state.currentPhase).toBe('retention');
      expect(result.current.state.retentionTime).toBe(0);

      // Advance 1 second
      advanceTime(1000);
      expect(result.current.state.retentionTime).toBe(1);

      advanceTime(1000);
      expect(result.current.state.retentionTime).toBe(2);

      advanceTime(3000);
      expect(result.current.state.retentionTime).toBe(5);
    });

    it('user can release retention manually', () => {
      const { result } = renderHook(() => useWimHofLoop(mockTechnique));

      act(() => {
        result.current.start();
      });

      // Get to retention
      advanceTime(400);

      // Hold for 3 seconds
      advanceTime(3000);
      expect(result.current.state.retentionTime).toBe(3);

      // User releases
      act(() => {
        result.current.releaseRetention();
      });

      expect(result.current.state.currentPhase).toBe('recovery_inhale');
      expect(result.current.state.roundRetentions).toEqual([3]);
      expect(result.current.state.recoveryTimeRemaining).toBe(2); // inhale_hold_seconds
    });
  });

  describe('recovery phases', () => {
    it('counts down recovery inhale duration', () => {
      const { result } = renderHook(() => useWimHofLoop(mockTechnique));

      act(() => {
        result.current.start();
      });

      // Get to retention
      advanceTime(400);

      // Release immediately
      act(() => {
        result.current.releaseRetention();
      });

      expect(result.current.state.recoveryTimeRemaining).toBe(2);

      advanceTime(1000);
      expect(result.current.state.recoveryTimeRemaining).toBe(1);

      advanceTime(1000);
      expect(result.current.state.recoveryTimeRemaining).toBe(0);
    });

    it('starts next round after recovery completes', () => {
      const { result } = renderHook(() => useWimHofLoop(mockTechnique));

      act(() => {
        result.current.start();
      });

      // Complete round 1
      advanceTime(300); // Rapid breathing
      act(() => {
        result.current.releaseRetention();
      });
      advanceTime(2000); // Recovery inhale

      // Should now be in round 2
      expect(result.current.state.currentRound).toBe(2);
      expect(result.current.state.currentPhase).toBe('rapid_breathing');
      expect(result.current.state.breathCount).toBe(0);
    });
  });

  describe('round completion', () => {
    it('tracks retention time for each round', () => {
      const { result } = renderHook(() => useWimHofLoop(mockTechnique));

      act(() => {
        result.current.start();
      });

      // Round 1: hold for 5 seconds
      advanceTime(400); // Rapid breathing (3 breaths + transition)
      advanceTime(5000); // Hold 5s
      act(() => {
        result.current.releaseRetention();
      });

      expect(result.current.state.roundRetentions).toEqual([5]);

      // Complete recovery
      advanceTime(2000);

      // Round 2: hold for 7 seconds
      advanceTime(400); // Rapid breathing (3 breaths + transition)
      advanceTime(7000); // Hold 7s
      act(() => {
        result.current.releaseRetention();
      });

      expect(result.current.state.roundRetentions).toEqual([5, 7]);
    });

    it('calls onComplete when all rounds finished', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => useWimHofLoop(mockTechnique, onComplete));

      act(() => {
        result.current.start();
      });

      // Complete round 1
      advanceTime(400); // Rapid breathing
      advanceTime(3000); // Retention
      act(() => {
        result.current.releaseRetention();
      });
      advanceTime(2000); // Recovery

      expect(onComplete).not.toHaveBeenCalled();

      // Complete round 2 (final round)
      advanceTime(400); // Rapid breathing
      advanceTime(4000); // Retention
      act(() => {
        result.current.releaseRetention();
      });
      advanceTime(2000); // Recovery

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          roundRetentions: [3, 4],
          averageRetention: 3.5,
          bestRetention: 4,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          totalDuration: expect.any(Number),
        })
      );
    });

    it('sets isActive to false after completion', () => {
      const { result } = renderHook(() => useWimHofLoop(mockTechnique));

      act(() => {
        result.current.start();
      });

      // Complete both rounds
      for (let i = 0; i < 2; i++) {
        advanceTime(400); // Rapid breathing (3 breaths + transition)
        advanceTime(2000); // Retention
        act(() => {
          result.current.releaseRetention();
        });
        advanceTime(2000); // Recovery
      }

      expect(result.current.state.isActive).toBe(false);
    });
  });

  describe('pause and resume', () => {
    it('pauses the exercise', () => {
      const { result } = renderHook(() => useWimHofLoop(mockTechnique));

      act(() => {
        result.current.start();
      });

      act(() => {
        result.current.pause();
      });

      expect(result.current.state.isPaused).toBe(true);

      // Timer should not advance while paused
      const breathCount = result.current.state.breathCount;
      advanceTime(1000);
      expect(result.current.state.breathCount).toBe(breathCount);
    });

    it('resumes the exercise', () => {
      const { result } = renderHook(() => useWimHofLoop(mockTechnique));

      act(() => {
        result.current.start();
      });

      advanceTime(100);
      const breathCountBeforePause = result.current.state.breathCount;

      act(() => {
        result.current.pause();
      });

      advanceTime(1000); // Should not advance while paused

      act(() => {
        result.current.resume();
      });

      expect(result.current.state.isPaused).toBe(false);

      // Should continue from where it paused
      advanceTime(100);
      expect(result.current.state.breathCount).toBe(breathCountBeforePause + 1);
    });
  });

  describe('stop', () => {
    it('stops the exercise and deactivates', () => {
      const { result } = renderHook(() => useWimHofLoop(mockTechnique));

      act(() => {
        result.current.start();
      });

      advanceTime(200);

      act(() => {
        result.current.stop();
      });

      expect(result.current.state.isActive).toBe(false);
      expect(result.current.state.isPaused).toBe(false);

      // Should not advance after stop
      const breathCount = result.current.state.breathCount;
      advanceTime(1000);
      expect(result.current.state.breathCount).toBe(breathCount);
    });
  });

  describe('edge cases', () => {
    it('handles zero breath tempo gracefully', () => {
      const badTechnique = { ...mockTechnique, breath_tempo_ms: 0 };
      const { result } = renderHook(() => useWimHofLoop(badTechnique));

      act(() => {
        result.current.start();
      });

      // Should not crash
      expect(result.current.state.isActive).toBe(true);
    });

    it('handles single round configuration', () => {
      const onComplete = vi.fn();
      const singleRoundTechnique = { ...mockTechnique, rounds: 1 };
      const { result } = renderHook(() => useWimHofLoop(singleRoundTechnique, onComplete));

      act(() => {
        result.current.start();
      });

      // Complete the single round
      advanceTime(400); // Rapid breathing
      advanceTime(2000); // Retention
      act(() => {
        result.current.releaseRetention();
      });
      advanceTime(2000); // Recovery

      expect(onComplete).toHaveBeenCalled();
      expect(result.current.state.isActive).toBe(false);
    });

    it('nextBreath does nothing during non-rapid-breathing phases', () => {
      const { result } = renderHook(() => useWimHofLoop(mockTechnique));

      act(() => {
        result.current.start();
      });

      // Get to retention
      advanceTime(300);

      const retentionTime = result.current.state.retentionTime;

      act(() => {
        result.current.nextBreath(); // Should do nothing in retention
      });

      expect(result.current.state.currentPhase).toBe('retention');
      expect(result.current.state.retentionTime).toBe(retentionTime);
    });
  });
});
