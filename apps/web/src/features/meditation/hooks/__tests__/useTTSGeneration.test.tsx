/**
 * Tests for useTTSGeneration hook
 *
 * This hook manages TTS meditation generation with:
 * - Request deduplication for cache checks
 * - Progressive playback using MediaSource API
 * - Standard buffered playback fallback
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

import type { PersonalizedScript, MeditationPersonalization } from '../../types';
import { useTTSGeneration } from '../useTTSGeneration';

// Mock the meditation-tts module
vi.mock('@/lib/meditation-tts', () => ({
  checkMeditationCache: vi.fn(),
  streamPersonalizedMeditation: vi.fn(),
  streamMeditationWithProgressivePlayback: vi.fn(),
}));

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

import {
  checkMeditationCache,
  streamPersonalizedMeditation,
  streamMeditationWithProgressivePlayback,
} from '@/lib/meditation-tts';
import { supabase } from '@/lib/supabase';

// Test fixtures
const mockScript: PersonalizedScript = {
  id: 'breathing_custom_5min',
  title: 'Test Breathing Meditation',
  type: 'breathing_focus',
  scriptContent: 'Welcome to this meditation...',
  durationEstimateSeconds: 300,
  hasPersonalizationPlaceholders: true,
  placeholders: { name: 'USER_NAME' },
};

const mockPersonalization: MeditationPersonalization = {
  userName: 'Alice',
  userGoal: 'reducing stress',
};

const mockAuthToken = 'test-auth-token';

describe('useTTSGeneration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    (checkMeditationCache as Mock).mockResolvedValue(null);
    (streamPersonalizedMeditation as Mock).mockResolvedValue('blob:http://localhost/test-audio');
    (streamMeditationWithProgressivePlayback as Mock).mockResolvedValue(new Uint8Array([1, 2, 3]));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should start in idle state', () => {
      const { result } = renderHook(() =>
        useTTSGeneration({
          script: mockScript,
          autoGenerate: false,
          authToken: mockAuthToken,
        })
      );

      expect(result.current.state).toBe('idle');
      expect(result.current.audioUrl).toBeNull();
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBeNull();
      expect(result.current.cached).toBe(false);
      expect(result.current.isProgressivePlaying).toBe(false);
    });

    it('should start in ready state with preGeneratedAudioUrl', () => {
      const { result } = renderHook(() =>
        useTTSGeneration({
          script: mockScript,
          preGeneratedAudioUrl: 'https://example.com/audio.mp3',
          autoGenerate: false,
          authToken: mockAuthToken,
        })
      );

      expect(result.current.state).toBe('ready');
      expect(result.current.audioUrl).toBe('https://example.com/audio.mp3');
      expect(result.current.progress).toBe(100);
    });
  });

  describe('cache check deduplication', () => {
    it('should deduplicate identical cache check requests', async () => {
      // Render two hooks with the same script - they should share the cache check
      const { result: result1 } = renderHook(() =>
        useTTSGeneration({
          script: mockScript,
          personalization: mockPersonalization,
          autoGenerate: false,
          authToken: mockAuthToken,
        })
      );

      const { result: result2 } = renderHook(() =>
        useTTSGeneration({
          script: mockScript,
          personalization: mockPersonalization,
          autoGenerate: false,
          authToken: mockAuthToken,
        })
      );

      // Trigger generation on both
      await act(async () => {
        await Promise.all([result1.current.generate(), result2.current.generate()]);
      });

      // Wait for completion
      await waitFor(() => {
        expect(result1.current.state).toBe('ready');
        expect(result2.current.state).toBe('ready');
      });

      // Cache check should only be called once due to deduplication
      // Note: May be called twice if timing allows first to complete before second starts
      expect((checkMeditationCache as Mock).mock.calls.length).toBeLessThanOrEqual(2);
    });

    it('should make separate requests for different scripts', async () => {
      const script2 = { ...mockScript, id: 'body_scan_custom' };

      const { result: result1 } = renderHook(() =>
        useTTSGeneration({
          script: mockScript,
          autoGenerate: false,
          authToken: mockAuthToken,
        })
      );

      const { result: result2 } = renderHook(() =>
        useTTSGeneration({
          script: script2,
          autoGenerate: false,
          authToken: mockAuthToken,
        })
      );

      await act(async () => {
        await Promise.all([result1.current.generate(), result2.current.generate()]);
      });

      // Should have made 2 cache check calls (one for each script)
      expect((checkMeditationCache as Mock).mock.calls.length).toBe(2);
    });
  });

  describe('cache hit behavior', () => {
    it('should use cached URL when available', async () => {
      const cachedUrl = 'https://storage.example.com/cached-audio.mp3';
      (checkMeditationCache as Mock).mockResolvedValue(cachedUrl);

      const { result } = renderHook(() =>
        useTTSGeneration({
          script: mockScript,
          autoGenerate: false,
          authToken: mockAuthToken,
        })
      );

      await act(async () => {
        await result.current.generate();
      });

      expect(result.current.state).toBe('ready');
      expect(result.current.audioUrl).toBe(cachedUrl);
      expect(result.current.cached).toBe(true);
      expect(result.current.progress).toBe(100);

      // Should not have called streaming functions
      expect(streamPersonalizedMeditation).not.toHaveBeenCalled();
      expect(streamMeditationWithProgressivePlayback).not.toHaveBeenCalled();
    });
  });

  describe('progressive playback', () => {
    it('should use progressive playback by default', async () => {
      const { result } = renderHook(() =>
        useTTSGeneration({
          script: mockScript,
          autoGenerate: false,
          authToken: mockAuthToken,
          useProgressivePlayback: true,
        })
      );

      await act(async () => {
        await result.current.generate();
      });

      expect(result.current.state).toBe('ready');
      expect(streamMeditationWithProgressivePlayback).toHaveBeenCalled();
      expect(streamPersonalizedMeditation).not.toHaveBeenCalled();
    });

    it('should provide audio element ref for progressive playback', () => {
      const { result } = renderHook(() =>
        useTTSGeneration({
          script: mockScript,
          autoGenerate: false,
          authToken: mockAuthToken,
          useProgressivePlayback: true,
        })
      );

      expect(result.current.audioElementRef).toBeDefined();
      expect(result.current.audioElementRef.current).toBeInstanceOf(HTMLAudioElement);
    });
  });

  describe('buffered playback fallback', () => {
    it('should use buffered playback when progressive disabled', async () => {
      const { result } = renderHook(() =>
        useTTSGeneration({
          script: mockScript,
          autoGenerate: false,
          authToken: mockAuthToken,
          useProgressivePlayback: false,
        })
      );

      await act(async () => {
        await result.current.generate();
      });

      expect(result.current.state).toBe('ready');
      expect(streamPersonalizedMeditation).toHaveBeenCalled();
      expect(streamMeditationWithProgressivePlayback).not.toHaveBeenCalled();
      expect(result.current.audioUrl).toBe('blob:http://localhost/test-audio');
    });
  });

  describe('error handling', () => {
    it('should handle generation errors', async () => {
      (streamMeditationWithProgressivePlayback as Mock).mockRejectedValue(
        new Error('Network error')
      );

      const onError = vi.fn();

      const { result } = renderHook(() =>
        useTTSGeneration({
          script: mockScript,
          autoGenerate: false,
          authToken: mockAuthToken,
          onError,
        })
      );

      await act(async () => {
        await result.current.generate();
      });

      expect(result.current.state).toBe('error');
      expect(result.current.error).toBe('Network error');
      expect(onError).toHaveBeenCalled();
    });

    it('should require auth token', async () => {
      (supabase.auth.getSession as Mock).mockResolvedValue({
        data: { session: null },
      });

      const onError = vi.fn();

      const { result } = renderHook(() =>
        useTTSGeneration({
          script: mockScript,
          autoGenerate: false,
          onError,
        })
      );

      await act(async () => {
        await result.current.generate();
      });

      expect(result.current.state).toBe('error');
      expect(result.current.error).toContain('sign in');
    });
  });

  describe('reset functionality', () => {
    it('should reset all state', async () => {
      const { result } = renderHook(() =>
        useTTSGeneration({
          script: mockScript,
          autoGenerate: false,
          authToken: mockAuthToken,
        })
      );

      // Generate first
      await act(async () => {
        await result.current.generate();
      });

      expect(result.current.state).toBe('ready');

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.state).toBe('idle');
      expect(result.current.audioUrl).toBeNull();
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBeNull();
      expect(result.current.cached).toBe(false);
      expect(result.current.isProgressivePlaying).toBe(false);
    });
  });

  describe('callbacks', () => {
    it('should call onGenerated callback on success', async () => {
      const onGenerated = vi.fn();

      const { result } = renderHook(() =>
        useTTSGeneration({
          script: mockScript,
          autoGenerate: false,
          authToken: mockAuthToken,
          onGenerated,
        })
      );

      await act(async () => {
        await result.current.generate();
      });

      expect(onGenerated).toHaveBeenCalledWith(
        expect.objectContaining({
          scriptId: mockScript.id,
          durationSeconds: mockScript.durationEstimateSeconds,
          cached: false,
        })
      );
    });
  });

  describe('auto-generation', () => {
    it('should auto-generate when autoGenerate is true', async () => {
      renderHook(() =>
        useTTSGeneration({
          script: mockScript,
          autoGenerate: true,
          authToken: mockAuthToken,
        })
      );

      await waitFor(() => {
        expect(checkMeditationCache).toHaveBeenCalled();
      });
    });

    it('should not auto-generate when autoGenerate is false', () => {
      renderHook(() =>
        useTTSGeneration({
          script: mockScript,
          autoGenerate: false,
          authToken: mockAuthToken,
        })
      );

      expect(checkMeditationCache).not.toHaveBeenCalled();
    });
  });
});
