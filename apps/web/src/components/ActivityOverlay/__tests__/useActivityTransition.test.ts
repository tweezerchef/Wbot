import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { useActivityTransition } from '../useActivityTransition';

describe('useActivityTransition', () => {
  describe('initialization', () => {
    it('starts in exited state when isOpen is false', () => {
      const { result } = renderHook(() => useActivityTransition({ isOpen: false }));

      expect(result.current.animationState).toBe('exited');
      expect(result.current.shouldRender).toBe(false);
    });

    it('starts in entered state when isOpen is true', () => {
      const { result } = renderHook(() => useActivityTransition({ isOpen: true }));

      expect(result.current.animationState).toBe('entered');
      expect(result.current.shouldRender).toBe(true);
    });
  });

  describe('state transitions', () => {
    it('transitions to entering when isOpen changes to true', () => {
      const { result, rerender } = renderHook(({ isOpen }) => useActivityTransition({ isOpen }), {
        initialProps: { isOpen: false },
      });

      expect(result.current.animationState).toBe('exited');

      rerender({ isOpen: true });

      expect(result.current.animationState).toBe('entering');
      expect(result.current.shouldRender).toBe(true);
    });

    it('transitions to exiting when isOpen changes to false', () => {
      const { result, rerender } = renderHook(({ isOpen }) => useActivityTransition({ isOpen }), {
        initialProps: { isOpen: true },
      });

      expect(result.current.animationState).toBe('entered');

      rerender({ isOpen: false });

      expect(result.current.animationState).toBe('exiting');
      expect(result.current.shouldRender).toBe(true);
    });

    it('stays mounted during exit animation (shouldRender true while exiting)', () => {
      const { result, rerender } = renderHook(({ isOpen }) => useActivityTransition({ isOpen }), {
        initialProps: { isOpen: true },
      });

      rerender({ isOpen: false });

      // Should still render during exit animation
      expect(result.current.shouldRender).toBe(true);
      expect(result.current.animationState).toBe('exiting');
    });
  });

  describe('animation completion', () => {
    it('transitions from entering to entered on animation complete', () => {
      const { result, rerender } = renderHook(({ isOpen }) => useActivityTransition({ isOpen }), {
        initialProps: { isOpen: false },
      });

      rerender({ isOpen: true });
      expect(result.current.animationState).toBe('entering');

      // Simulate animation completion
      act(() => {
        result.current.overlayProps.onAnimationComplete();
      });

      expect(result.current.animationState).toBe('entered');
    });

    it('transitions from exiting to exited on animation complete', () => {
      const { result, rerender } = renderHook(({ isOpen }) => useActivityTransition({ isOpen }), {
        initialProps: { isOpen: true },
      });

      rerender({ isOpen: false });
      expect(result.current.animationState).toBe('exiting');

      // Simulate animation completion
      act(() => {
        result.current.overlayProps.onAnimationComplete();
      });

      expect(result.current.animationState).toBe('exited');
      expect(result.current.shouldRender).toBe(false);
    });

    it('calls onExitComplete when exit animation finishes', () => {
      const onExitComplete = vi.fn();
      const { result, rerender } = renderHook(
        ({ isOpen }) => useActivityTransition({ isOpen, onExitComplete }),
        { initialProps: { isOpen: true } }
      );

      rerender({ isOpen: false });

      // Simulate animation completion
      act(() => {
        result.current.overlayProps.onAnimationComplete();
      });

      expect(onExitComplete).toHaveBeenCalledTimes(1);
    });

    it('does not call onExitComplete during enter animation', () => {
      const onExitComplete = vi.fn();
      const { result, rerender } = renderHook(
        ({ isOpen }) => useActivityTransition({ isOpen, onExitComplete }),
        { initialProps: { isOpen: false } }
      );

      rerender({ isOpen: true });

      // Simulate animation completion
      act(() => {
        result.current.overlayProps.onAnimationComplete();
      });

      expect(onExitComplete).not.toHaveBeenCalled();
    });
  });

  describe('overlayProps', () => {
    it('provides correct initial animation values', () => {
      const { result } = renderHook(() => useActivityTransition({ isOpen: true }));

      expect(result.current.overlayProps.initial).toEqual({
        opacity: 0,
        scale: 0.95,
      });
    });

    it('provides correct animate values', () => {
      const { result } = renderHook(() => useActivityTransition({ isOpen: true }));

      expect(result.current.overlayProps.animate).toEqual({
        opacity: 1,
        scale: 1,
      });
    });

    it('provides correct exit animation values', () => {
      const { result } = renderHook(() => useActivityTransition({ isOpen: true }));

      expect(result.current.overlayProps.exit).toEqual({
        opacity: 0,
        scale: 0.98,
        y: 20,
      });
    });

    it('uses 0.5s duration for enter animation', () => {
      const { result, rerender } = renderHook(({ isOpen }) => useActivityTransition({ isOpen }), {
        initialProps: { isOpen: false },
      });

      rerender({ isOpen: true });

      expect(result.current.overlayProps.transition.duration).toBe(0.5);
    });

    it('uses 0.4s duration for exit animation', () => {
      const { result, rerender } = renderHook(({ isOpen }) => useActivityTransition({ isOpen }), {
        initialProps: { isOpen: true },
      });

      rerender({ isOpen: false });

      expect(result.current.overlayProps.transition.duration).toBe(0.4);
    });

    it('uses correct easing curve', () => {
      const { result } = renderHook(() => useActivityTransition({ isOpen: true }));

      expect(result.current.overlayProps.transition.ease).toEqual([0.4, 0, 0.2, 1]);
    });
  });

  describe('edge cases', () => {
    it('handles rapid open/close without breaking', () => {
      const { result, rerender } = renderHook(({ isOpen }) => useActivityTransition({ isOpen }), {
        initialProps: { isOpen: false },
      });

      // Rapid toggle
      rerender({ isOpen: true });
      rerender({ isOpen: false });
      rerender({ isOpen: true });

      // Should be in a valid state
      expect(['entering', 'entered']).toContain(result.current.animationState);
      expect(result.current.shouldRender).toBe(true);
    });

    it('handles missing onExitComplete gracefully', () => {
      const { result, rerender } = renderHook(({ isOpen }) => useActivityTransition({ isOpen }), {
        initialProps: { isOpen: true },
      });

      rerender({ isOpen: false });

      // Should not throw when no callback provided
      expect(() => {
        act(() => {
          result.current.overlayProps.onAnimationComplete();
        });
      }).not.toThrow();
    });
  });
});
