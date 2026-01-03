/**
 * Tests for useMeditationAudio hook
 *
 * This hook manages HTML5 Audio for meditation playback.
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useMeditationAudio } from '../useMeditationAudio';

/** Event handler type for audio events */
type AudioEventHandler = () => void;

/** Mock audio element type */
interface MockAudioElement {
  src: string;
  volume: number;
  currentTime: number;
  duration: number;
  paused: boolean;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  load: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  error: MediaError | null;
}

let mockAudio: MockAudioElement;
let eventListeners: Map<string, AudioEventHandler>;

// Mock HTML5 Audio element - creates fresh mocks for each instance
const createMockAudio = (): MockAudioElement => ({
  src: '',
  volume: 1,
  currentTime: 0,
  duration: 300, // 5 minutes
  paused: true,
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  error: null,
});

// Audio constructor mock - defined as a class-like function
function MockAudioConstructor(this: MockAudioElement) {
  mockAudio = createMockAudio();
  eventListeners = new Map();

  mockAudio.addEventListener = vi.fn((event: string, handler: AudioEventHandler) => {
    eventListeners.set(event, handler);
  });

  mockAudio.removeEventListener = vi.fn((event: string) => {
    eventListeners.delete(event);
  });

  // Copy properties to `this` for constructor behavior
  Object.assign(this, mockAudio);
  return mockAudio;
}

// Stub global Audio with our constructor
vi.stubGlobal('Audio', MockAudioConstructor);

// Helper to trigger audio events
const triggerEvent = (event: string) => {
  const handler = eventListeners.get(event);
  if (handler) {
    handler();
  }
};

describe('useMeditationAudio', () => {
  beforeEach(() => {
    eventListeners = new Map();
  });

  afterEach(() => {
    // Don't call vi.clearAllMocks() - it breaks the global stub
  });

  describe('initialization', () => {
    it('creates with idle state', () => {
      const { result } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      expect(result.current.state.playbackState).toBe('idle');
      expect(result.current.state.currentTime).toBe(0);
      expect(result.current.state.progress).toBe(0);
      expect(result.current.state.error).toBeNull();
    });

    it('uses default volume of 0.8', () => {
      const { result } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      expect(result.current.volume).toBe(0.8);
    });

    it('accepts custom initial volume', () => {
      const { result } = renderHook(() =>
        useMeditationAudio({
          audioUrl: 'https://example.com/test.mp3',
          initialVolume: 0.5,
        })
      );

      expect(result.current.volume).toBe(0.5);
    });

    it('creates Audio element with correct source', () => {
      renderHook(() => useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' }));

      expect(mockAudio.src).toBe('https://example.com/test.mp3');
    });
  });

  describe('play()', () => {
    it('calls audio.play()', async () => {
      const { result } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      await act(async () => {
        await result.current.play();
      });

      expect(mockAudio.play).toHaveBeenCalled();
    });

    it('sets loading state before playing', () => {
      const { result } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      act(() => {
        void result.current.play();
      });

      // Should be loading while waiting for play to resolve
      expect(result.current.state.playbackState).toBe('loading');
    });

    it('handles play errors gracefully', async () => {
      const onError = vi.fn();

      const { result } = renderHook(() =>
        useMeditationAudio({
          audioUrl: 'https://example.com/test.mp3',
          onError,
        })
      );

      // Override play after mockAudio is created by renderHook
      mockAudio.play = vi.fn().mockRejectedValue(new Error('Playback failed'));

      await act(async () => {
        await result.current.play();
      });

      expect(result.current.state.error).toBeInstanceOf(Error);
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('pause()', () => {
    it('calls audio.pause()', () => {
      const { result } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      act(() => {
        result.current.pause();
      });

      expect(mockAudio.pause).toHaveBeenCalled();
    });
  });

  describe('stop()', () => {
    it('pauses and resets currentTime', () => {
      const { result } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      // Set currentTime after mockAudio is created by renderHook
      mockAudio.currentTime = 60; // 1 minute in

      act(() => {
        result.current.stop();
      });

      expect(mockAudio.pause).toHaveBeenCalled();
      expect(mockAudio.currentTime).toBe(0);
    });

    it('resets state to idle', () => {
      const { result } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      act(() => {
        result.current.stop();
      });

      expect(result.current.state.playbackState).toBe('idle');
      expect(result.current.state.currentTime).toBe(0);
      expect(result.current.state.progress).toBe(0);
    });
  });

  describe('seek()', () => {
    it('sets currentTime based on position (0-1)', () => {
      const { result } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      // Set duration after mockAudio is created by renderHook
      mockAudio.duration = 300; // 5 minutes

      // Simulate metadata loaded so duration is available
      act(() => {
        triggerEvent('loadedmetadata');
      });

      act(() => {
        result.current.seek(0.5); // 50% = 2.5 minutes
      });

      expect(mockAudio.currentTime).toBe(150); // 300 * 0.5
    });

    it('clamps position to 0-1 range', () => {
      const { result } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      // Set duration after mockAudio is created by renderHook
      mockAudio.duration = 300;

      act(() => {
        triggerEvent('loadedmetadata');
      });

      act(() => {
        result.current.seek(1.5); // Should clamp to 1
      });

      expect(mockAudio.currentTime).toBe(300);

      act(() => {
        result.current.seek(-0.5); // Should clamp to 0
      });

      expect(mockAudio.currentTime).toBe(0);
    });
  });

  describe('setVolume()', () => {
    it('updates volume on audio element', () => {
      const { result } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      act(() => {
        result.current.setVolume(0.5);
      });

      expect(mockAudio.volume).toBe(0.5);
      expect(result.current.volume).toBe(0.5);
    });

    it('clamps volume to 0-1 range', () => {
      const { result } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      act(() => {
        result.current.setVolume(1.5);
      });

      expect(result.current.volume).toBe(1);

      act(() => {
        result.current.setVolume(-0.5);
      });

      expect(result.current.volume).toBe(0);
    });
  });

  describe('audio events', () => {
    it('updates state on loadedmetadata event', () => {
      const onLoaded = vi.fn();

      const { result } = renderHook(() =>
        useMeditationAudio({
          audioUrl: 'https://example.com/test.mp3',
          onLoaded,
        })
      );

      // Set duration after mockAudio is created by renderHook
      mockAudio.duration = 300;

      act(() => {
        triggerEvent('loadedmetadata');
      });

      expect(result.current.state.duration).toBe(300);
      expect(result.current.state.isLoading).toBe(false);
      expect(onLoaded).toHaveBeenCalledWith(300);
    });

    it('updates progress on timeupdate event', () => {
      const onTimeUpdate = vi.fn();

      const { result } = renderHook(() =>
        useMeditationAudio({
          audioUrl: 'https://example.com/test.mp3',
          onTimeUpdate,
        })
      );

      // Set properties after mockAudio is created by renderHook
      mockAudio.duration = 300;
      mockAudio.currentTime = 150; // 50%

      act(() => {
        triggerEvent('timeupdate');
      });

      expect(result.current.state.currentTime).toBe(150);
      expect(result.current.state.progress).toBe(50);
      expect(onTimeUpdate).toHaveBeenCalledWith(150, 300);
    });

    it('sets complete state on ended event', () => {
      const onEnded = vi.fn();

      const { result } = renderHook(() =>
        useMeditationAudio({
          audioUrl: 'https://example.com/test.mp3',
          onEnded,
        })
      );

      act(() => {
        triggerEvent('ended');
      });

      expect(result.current.state.playbackState).toBe('complete');
      expect(result.current.state.progress).toBe(100);
      expect(onEnded).toHaveBeenCalled();
    });

    it('sets playing state on play event', () => {
      const { result } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      act(() => {
        triggerEvent('play');
      });

      expect(result.current.state.playbackState).toBe('playing');
    });

    it('sets paused state on pause event', () => {
      const { result } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      // First play
      act(() => {
        triggerEvent('play');
      });

      // Then pause
      act(() => {
        triggerEvent('pause');
      });

      expect(result.current.state.playbackState).toBe('paused');
    });

    it('does not change to paused when complete', () => {
      const { result } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      // Set to complete first
      act(() => {
        triggerEvent('ended');
      });

      expect(result.current.state.playbackState).toBe('complete');

      // Pause event should not change it
      act(() => {
        triggerEvent('pause');
      });

      expect(result.current.state.playbackState).toBe('complete');
    });
  });

  describe('URL change', () => {
    it('reloads audio when URL changes', () => {
      const { rerender } = renderHook(({ url }) => useMeditationAudio({ audioUrl: url }), {
        initialProps: { url: 'https://example.com/track1.mp3' },
      });

      expect(mockAudio.src).toBe('https://example.com/track1.mp3');

      rerender({ url: 'https://example.com/track2.mp3' });

      expect(mockAudio.src).toBe('https://example.com/track2.mp3');
      expect(mockAudio.load).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('cleans up audio element on unmount', () => {
      const { unmount } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      unmount();

      expect(mockAudio.pause).toHaveBeenCalled();
      expect(mockAudio.src).toBe('');
    });

    it('removes event listeners on unmount', () => {
      const { unmount } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      unmount();

      expect(mockAudio.removeEventListener).toHaveBeenCalled();
    });
  });

  describe('return values', () => {
    it('returns all control functions', () => {
      const { result } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      expect(typeof result.current.play).toBe('function');
      expect(typeof result.current.pause).toBe('function');
      expect(typeof result.current.stop).toBe('function');
      expect(typeof result.current.seek).toBe('function');
      expect(typeof result.current.setVolume).toBe('function');
    });

    it('returns current state and volume', () => {
      const { result } = renderHook(() =>
        useMeditationAudio({ audioUrl: 'https://example.com/test.mp3' })
      );

      expect(result.current.state).toHaveProperty('playbackState');
      expect(result.current.state).toHaveProperty('currentTime');
      expect(result.current.state).toHaveProperty('duration');
      expect(result.current.state).toHaveProperty('progress');
      expect(result.current.state).toHaveProperty('isLoading');
      expect(result.current.state).toHaveProperty('error');
      expect(typeof result.current.volume).toBe('number');
    });
  });
});
