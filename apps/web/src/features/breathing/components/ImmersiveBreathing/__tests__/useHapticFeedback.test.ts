/**
 * Tests for useHapticFeedback hook
 *
 * Tests the Web Vibration API integration for haptic feedback
 * during breathing exercises on mobile devices.
 */

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useHapticFeedback } from '../../../hooks/useHapticFeedback';

describe('useHapticFeedback', () => {
  const mockVibrate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up navigator mock
    if ('vibrate' in navigator) {
      vi.restoreAllMocks();
    }
  });

  describe('when vibration is supported', () => {
    beforeEach(() => {
      // Mock navigator.vibrate
      Object.defineProperty(navigator, 'vibrate', {
        value: mockVibrate,
        writable: true,
        configurable: true,
      });
    });

    describe('when enabled', () => {
      it('calls navigator.vibrate on phase change', () => {
        const { result } = renderHook(() => useHapticFeedback(true));

        result.current.onPhaseChange();

        expect(mockVibrate).toHaveBeenCalledWith(50);
      });

      it('calls navigator.vibrate with triple pulse on cycle complete', () => {
        const { result } = renderHook(() => useHapticFeedback(true));

        result.current.onCycleComplete();

        expect(mockVibrate).toHaveBeenCalledWith([50, 50, 50, 50, 50]);
      });

      it('calls navigator.vibrate with celebration pattern on exercise complete', () => {
        const { result } = renderHook(() => useHapticFeedback(true));

        result.current.onExerciseComplete();

        expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100, 50, 200]);
      });

      it('cancels vibration when cancel is called', () => {
        const { result } = renderHook(() => useHapticFeedback(true));

        result.current.cancel();

        expect(mockVibrate).toHaveBeenCalledWith(0);
      });
    });

    describe('when disabled', () => {
      it('does not call navigator.vibrate on phase change', () => {
        const { result } = renderHook(() => useHapticFeedback(false));

        result.current.onPhaseChange();

        expect(mockVibrate).not.toHaveBeenCalled();
      });

      it('does not call navigator.vibrate on cycle complete', () => {
        const { result } = renderHook(() => useHapticFeedback(false));

        result.current.onCycleComplete();

        expect(mockVibrate).not.toHaveBeenCalled();
      });

      it('does not call navigator.vibrate on exercise complete', () => {
        const { result } = renderHook(() => useHapticFeedback(false));

        result.current.onExerciseComplete();

        expect(mockVibrate).not.toHaveBeenCalled();
      });
    });
  });

  describe('when vibration is not supported', () => {
    beforeEach(() => {
      // Remove vibrate from navigator
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    it('does not throw when calling onPhaseChange', () => {
      const { result } = renderHook(() => useHapticFeedback(true));

      expect(() => {
        result.current.onPhaseChange();
      }).not.toThrow();
    });

    it('does not throw when calling onCycleComplete', () => {
      const { result } = renderHook(() => useHapticFeedback(true));

      expect(() => {
        result.current.onCycleComplete();
      }).not.toThrow();
    });

    it('does not throw when calling onExerciseComplete', () => {
      const { result } = renderHook(() => useHapticFeedback(true));

      expect(() => {
        result.current.onExerciseComplete();
      }).not.toThrow();
    });

    it('does not throw when calling cancel', () => {
      const { result } = renderHook(() => useHapticFeedback(true));

      expect(() => {
        result.current.cancel();
      }).not.toThrow();
    });
  });

  describe('when vibrate throws', () => {
    beforeEach(() => {
      // Mock navigator.vibrate to throw (e.g., user hasn't interacted yet)
      Object.defineProperty(navigator, 'vibrate', {
        value: vi.fn(() => {
          throw new Error('Vibration not allowed');
        }),
        writable: true,
        configurable: true,
      });
    });

    it('silently catches errors without throwing', () => {
      const { result } = renderHook(() => useHapticFeedback(true));

      expect(() => {
        result.current.onPhaseChange();
      }).not.toThrow();
    });
  });

  describe('hook stability', () => {
    it('returns stable function references', () => {
      const { result, rerender } = renderHook(() => useHapticFeedback(true));

      const firstRender = { ...result.current };

      rerender();

      expect(result.current.onPhaseChange).toBe(firstRender.onPhaseChange);
      expect(result.current.onCycleComplete).toBe(firstRender.onCycleComplete);
      expect(result.current.onExerciseComplete).toBe(firstRender.onExerciseComplete);
      expect(result.current.cancel).toBe(firstRender.cancel);
    });

    it('creates new functions when enabled changes', () => {
      const { result, rerender } = renderHook(({ enabled }) => useHapticFeedback(enabled), {
        initialProps: { enabled: true },
      });

      const firstRender = { ...result.current };

      rerender({ enabled: false });

      // onPhaseChange depends on vibrate which depends on enabled
      expect(result.current.onPhaseChange).not.toBe(firstRender.onPhaseChange);
    });
  });
});
