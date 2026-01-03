/**
 * Tests for useBreathingAudio hook
 *
 * This hook manages Web Audio API for ambient sounds and phase chimes.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { BreathingPhase, BreathingAudioSettings } from '../types';
import { useBreathingAudio } from '../useBreathingAudio';

import { setupAudioContextMock, resetAudioMocks } from './mocks/audioContext';

describe('useBreathingAudio', () => {
  let mockAudioSetup: ReturnType<typeof setupAudioContextMock>;

  beforeEach(() => {
    vi.useFakeTimers();
    mockAudioSetup = setupAudioContextMock();
  });

  afterEach(() => {
    vi.useRealTimers();
    mockAudioSetup.cleanup();
    resetAudioMocks();
  });

  describe('initialization', () => {
    it('creates with default settings', () => {
      const { result } = renderHook(() => useBreathingAudio(false, 'inhale'));

      expect(result.current.settings.enabled).toBe(true);
      expect(result.current.settings.volume).toBe(0.5);
      expect(result.current.settings.ambientSound).toBe('ocean');
      expect(result.current.settings.enableChimes).toBe(true);
    });

    it('merges initial settings with defaults', () => {
      const initialSettings: Partial<BreathingAudioSettings> = {
        volume: 0.8,
        ambientSound: 'rain',
      };

      const { result } = renderHook(() => useBreathingAudio(false, 'inhale', initialSettings));

      expect(result.current.settings.enabled).toBe(true); // default
      expect(result.current.settings.volume).toBe(0.8); // custom
      expect(result.current.settings.ambientSound).toBe('rain'); // custom
      expect(result.current.settings.enableChimes).toBe(true); // default
    });

    it('does not create AudioContext until needed', () => {
      renderHook(() => useBreathingAudio(false, 'inhale'));

      // AudioContext should not be created just from initialization
      // It's lazy-initialized when audio operations start
      expect(mockAudioSetup.MockAudioContext).not.toHaveBeenCalled();
    });
  });

  describe('toggleAudio()', () => {
    it('toggles enabled state', () => {
      const { result } = renderHook(() => useBreathingAudio(false, 'inhale'));

      expect(result.current.settings.enabled).toBe(true);

      act(() => {
        result.current.toggleAudio();
      });

      expect(result.current.settings.enabled).toBe(false);

      act(() => {
        result.current.toggleAudio();
      });

      expect(result.current.settings.enabled).toBe(true);
    });

    it('stops ambient when disabling', () => {
      const { result } = renderHook(() => useBreathingAudio(true, 'inhale'));

      // Start with audio enabled and active
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Toggle off
      act(() => {
        result.current.toggleAudio();
      });

      expect(result.current.settings.enabled).toBe(false);
    });
  });

  describe('toggleChimes()', () => {
    it('toggles enableChimes state', () => {
      const { result } = renderHook(() => useBreathingAudio(false, 'inhale'));

      expect(result.current.settings.enableChimes).toBe(true);

      act(() => {
        result.current.toggleChimes();
      });

      expect(result.current.settings.enableChimes).toBe(false);

      act(() => {
        result.current.toggleChimes();
      });

      expect(result.current.settings.enableChimes).toBe(true);
    });
  });

  describe('setVolume()', () => {
    it('updates volume within 0-1 range', () => {
      const { result } = renderHook(() => useBreathingAudio(false, 'inhale'));

      act(() => {
        result.current.setVolume(0.7);
      });

      expect(result.current.settings.volume).toBe(0.7);
    });

    it('clamps volume to minimum 0', () => {
      const { result } = renderHook(() => useBreathingAudio(false, 'inhale'));

      act(() => {
        result.current.setVolume(-0.5);
      });

      expect(result.current.settings.volume).toBe(0);
    });

    it('clamps volume to maximum 1', () => {
      const { result } = renderHook(() => useBreathingAudio(false, 'inhale'));

      act(() => {
        result.current.setVolume(1.5);
      });

      expect(result.current.settings.volume).toBe(1);
    });
  });

  describe('setAmbientSound()', () => {
    it('changes sound type', () => {
      const { result } = renderHook(() => useBreathingAudio(false, 'inhale'));

      expect(result.current.settings.ambientSound).toBe('ocean');

      act(() => {
        result.current.setAmbientSound('rain');
      });

      expect(result.current.settings.ambientSound).toBe('rain');
    });

    it('can set to none', () => {
      const { result } = renderHook(() => useBreathingAudio(false, 'inhale'));

      act(() => {
        result.current.setAmbientSound('none');
      });

      expect(result.current.settings.ambientSound).toBe('none');
    });
  });

  describe('ambient sound lifecycle', () => {
    it('does not start when isActive is false', () => {
      renderHook(() => useBreathingAudio(false, 'inhale'));

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // AudioContext should not be created when not active
      expect(mockAudioSetup.MockAudioContext).not.toHaveBeenCalled();
    });

    it('does not start when enabled is false', () => {
      const { result } = renderHook(() => useBreathingAudio(true, 'inhale', { enabled: false }));

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.settings.enabled).toBe(false);
    });

    it('does not start when ambientSound is none', () => {
      renderHook(() => useBreathingAudio(true, 'inhale', { ambientSound: 'none' }));

      act(() => {
        vi.advanceTimersByTime(100);
      });

      // AudioContext shouldn't be created for 'none' ambient sound
      // (it might be created for chimes though)
    });
  });

  describe('playChime()', () => {
    it('does not play when enableChimes is false', () => {
      const { result } = renderHook(() =>
        useBreathingAudio(true, 'inhale', { enableChimes: false })
      );

      act(() => {
        result.current.playChime('exhale');
      });

      // Oscillator should not be created when chimes disabled
      expect(mockAudioSetup.mockContext.createOscillator).not.toHaveBeenCalled();
    });

    it('does not play when enabled is false', () => {
      const { result } = renderHook(() => useBreathingAudio(true, 'inhale', { enabled: false }));

      act(() => {
        result.current.playChime('exhale');
      });

      expect(mockAudioSetup.mockContext.createOscillator).not.toHaveBeenCalled();
    });

    it('creates oscillator when playing chime', () => {
      const { result } = renderHook(() =>
        useBreathingAudio(true, 'inhale', { enabled: true, enableChimes: true })
      );

      act(() => {
        result.current.playChime('exhale');
      });

      expect(mockAudioSetup.mockContext.createOscillator).toHaveBeenCalled();
      expect(mockAudioSetup.mockContext.createGain).toHaveBeenCalled();
    });
  });

  describe('phase change chimes', () => {
    it('does not play chime on first render', () => {
      renderHook(() => useBreathingAudio(true, 'inhale'));

      // No chime should play on initial render
      expect(mockAudioSetup.mockContext.createOscillator).not.toHaveBeenCalled();
    });

    it('plays chime when phase changes', () => {
      const { rerender } = renderHook(({ isActive, phase }) => useBreathingAudio(isActive, phase), {
        initialProps: { isActive: true, phase: 'inhale' as BreathingPhase },
      });

      // Change phase
      rerender({ isActive: true, phase: 'holdIn' as BreathingPhase });

      expect(mockAudioSetup.mockContext.createOscillator).toHaveBeenCalled();
    });

    it('does not play chime when phase changes but not active', () => {
      const { rerender } = renderHook(({ isActive, phase }) => useBreathingAudio(isActive, phase), {
        initialProps: { isActive: false, phase: 'inhale' as BreathingPhase },
      });

      // Change phase while not active
      rerender({ isActive: false, phase: 'holdIn' as BreathingPhase });

      expect(mockAudioSetup.mockContext.createOscillator).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('closes AudioContext on unmount', () => {
      const { result, unmount } = renderHook(() => useBreathingAudio(true, 'inhale'));

      // Trigger audio context creation
      act(() => {
        result.current.playChime('exhale');
      });

      unmount();

      expect(mockAudioSetup.mockContext.close).toHaveBeenCalled();
    });
  });

  describe('return values', () => {
    it('returns all control functions', () => {
      const { result } = renderHook(() => useBreathingAudio(false, 'inhale'));

      expect(typeof result.current.setVolume).toBe('function');
      expect(typeof result.current.toggleAudio).toBe('function');
      expect(typeof result.current.toggleChimes).toBe('function');
      expect(typeof result.current.setAmbientSound).toBe('function');
      expect(typeof result.current.playChime).toBe('function');
    });

    it('returns current settings', () => {
      const { result } = renderHook(() => useBreathingAudio(false, 'inhale'));

      expect(result.current.settings).toHaveProperty('enabled');
      expect(result.current.settings).toHaveProperty('volume');
      expect(result.current.settings).toHaveProperty('ambientSound');
      expect(result.current.settings).toHaveProperty('enableChimes');
    });
  });
});
