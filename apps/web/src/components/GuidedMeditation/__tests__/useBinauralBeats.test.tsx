import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { useBinauralBeats } from '../useBinauralBeats';

describe('useBinauralBeats', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('starts with isPlaying false', () => {
      const { result } = renderHook(() => useBinauralBeats());
      expect(result.current.isPlaying).toBe(false);
    });

    it('uses default theta frequency', () => {
      const { result } = renderHook(() => useBinauralBeats());
      expect(result.current.frequency).toBe('theta');
    });

    it('uses custom initial frequency', () => {
      const { result } = renderHook(() => useBinauralBeats({ frequency: 'alpha' }));
      expect(result.current.frequency).toBe('alpha');
    });

    it('uses default volume of 0.3', () => {
      const { result } = renderHook(() => useBinauralBeats());
      expect(result.current.volume).toBe(0.3);
    });

    it('uses custom initial volume', () => {
      const { result } = renderHook(() => useBinauralBeats({ volume: 0.5 }));
      expect(result.current.volume).toBe(0.5);
    });
  });

  describe('start/stop', () => {
    it('sets isPlaying to true when start() is called', () => {
      const { result } = renderHook(() => useBinauralBeats());

      act(() => {
        result.current.start();
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it('sets isPlaying to false when stop() is called', () => {
      const { result } = renderHook(() => useBinauralBeats());

      act(() => {
        result.current.start();
      });
      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.stop();
      });
      expect(result.current.isPlaying).toBe(false);
    });

    it('does not start when disabled', () => {
      const { result } = renderHook(() => useBinauralBeats({ enabled: false }));

      act(() => {
        result.current.start();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('does not start if already playing', () => {
      const { result } = renderHook(() => useBinauralBeats());

      act(() => {
        result.current.start();
      });
      expect(result.current.isPlaying).toBe(true);

      // Call start again - should not throw or change state
      act(() => {
        result.current.start();
      });
      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe('frequency control', () => {
    it('changes frequency with setFrequency', () => {
      const { result } = renderHook(() => useBinauralBeats());

      act(() => {
        result.current.setFrequency('alpha');
      });

      expect(result.current.frequency).toBe('alpha');
    });

    it('returns correct description for theta', () => {
      const { result } = renderHook(() => useBinauralBeats({ frequency: 'theta' }));
      expect(result.current.getDescription()).toBe('Deep meditation (6 Hz)');
    });

    it('returns correct description for alpha', () => {
      const { result } = renderHook(() => useBinauralBeats({ frequency: 'alpha' }));
      expect(result.current.getDescription()).toBe('Relaxation (10 Hz)');
    });

    it('returns correct description for delta', () => {
      const { result } = renderHook(() => useBinauralBeats({ frequency: 'delta' }));
      expect(result.current.getDescription()).toBe('Deep sleep & healing (2 Hz)');
    });

    it('returns correct description for beta', () => {
      const { result } = renderHook(() => useBinauralBeats({ frequency: 'beta' }));
      expect(result.current.getDescription()).toBe('Alert focus (20 Hz)');
    });
  });

  describe('volume control', () => {
    it('changes volume with setVolume', () => {
      const { result } = renderHook(() => useBinauralBeats());

      act(() => {
        result.current.setVolume(0.8);
      });

      expect(result.current.volume).toBe(0.8);
    });

    it('clamps volume to max of 1', () => {
      const { result } = renderHook(() => useBinauralBeats());

      act(() => {
        result.current.setVolume(1.5);
      });

      expect(result.current.volume).toBe(1);
    });

    it('clamps volume to min of 0', () => {
      const { result } = renderHook(() => useBinauralBeats());

      act(() => {
        result.current.setVolume(-0.5);
      });

      expect(result.current.volume).toBe(0);
    });
  });

  describe('fadeOut', () => {
    it('stops playing after fadeOut duration', () => {
      const { result } = renderHook(() => useBinauralBeats());

      act(() => {
        result.current.start();
      });
      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.fadeOut(2);
      });

      // Still playing during fade
      expect(result.current.isPlaying).toBe(true);

      // After fade duration, should be stopped
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.isPlaying).toBe(false);
    });
  });
});
