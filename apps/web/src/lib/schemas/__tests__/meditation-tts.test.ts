/**
 * Meditation TTS Schema Tests
 *
 * Tests for Zod validation schemas used in the meditation TTS service.
 */

import { describe, expect, it } from 'vitest';

import {
  cacheCheckResponseSchema,
  generateMeditationResponseSchema,
  meditationErrorResponseSchema,
  parseCacheCheckResponse,
  parseErrorResponse,
  parseGenerationResponse,
} from '../meditation-tts';

describe('Meditation TTS Schemas', () => {
  describe('generateMeditationResponseSchema', () => {
    it('validates complete generation response', () => {
      const response = {
        audioUrl: 'https://storage.example.com/audio.mp3',
        scriptId: 'script_123',
        durationSeconds: 300,
        cached: false,
        voiceId: 'nova',
      };

      const result = generateMeditationResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('validates cached response', () => {
      const response = {
        audioUrl: 'https://storage.example.com/cached.mp3',
        scriptId: 'script_456',
        durationSeconds: 600,
        cached: true,
        voiceId: 'alloy',
      };

      const result = generateMeditationResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cached).toBe(true);
      }
    });

    it('rejects missing required fields', () => {
      const response = {
        audioUrl: 'https://storage.example.com/audio.mp3',
        // Missing other fields
      };

      const result = generateMeditationResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });

    it('rejects invalid types', () => {
      const response = {
        audioUrl: 'https://storage.example.com/audio.mp3',
        scriptId: 'script_123',
        durationSeconds: 'not a number', // Should be number
        cached: false,
        voiceId: 'nova',
      };

      const result = generateMeditationResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });

  describe('meditationErrorResponseSchema', () => {
    it('validates error with message only', () => {
      const error = {
        error: 'Script not found',
      };

      const result = meditationErrorResponseSchema.safeParse(error);
      expect(result.success).toBe(true);
    });

    it('validates error with details', () => {
      const error = {
        error: 'Generation failed',
        details: 'Rate limit exceeded',
      };

      const result = meditationErrorResponseSchema.safeParse(error);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.details).toBe('Rate limit exceeded');
      }
    });

    it('rejects missing error field', () => {
      const error = {
        details: 'Some details',
      };

      const result = meditationErrorResponseSchema.safeParse(error);
      expect(result.success).toBe(false);
    });
  });

  describe('cacheCheckResponseSchema', () => {
    it('validates cached URL response', () => {
      const response = {
        audioUrl: 'https://storage.example.com/cached.mp3',
      };

      const result = cacheCheckResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.audioUrl).toBe('https://storage.example.com/cached.mp3');
      }
    });

    it('validates null response (not cached)', () => {
      const response = {
        audioUrl: null,
      };

      const result = cacheCheckResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.audioUrl).toBeNull();
      }
    });

    it('rejects missing audioUrl field', () => {
      const response = {};

      const result = cacheCheckResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });
});

describe('Validation Helpers', () => {
  describe('parseGenerationResponse', () => {
    it('parses valid response', () => {
      const data = {
        audioUrl: 'https://storage.example.com/audio.mp3',
        scriptId: 'script_123',
        durationSeconds: 300,
        cached: false,
        voiceId: 'nova',
      };

      const result = parseGenerationResponse(data);
      expect(result).not.toBeNull();
      expect(result?.audioUrl).toBe('https://storage.example.com/audio.mp3');
      expect(result?.durationSeconds).toBe(300);
    });

    it('returns null for invalid response', () => {
      const result = parseGenerationResponse({ invalid: 'data' });
      expect(result).toBeNull();
    });

    it('returns null for null input', () => {
      const result = parseGenerationResponse(null);
      expect(result).toBeNull();
    });

    it('returns null for undefined input', () => {
      const result = parseGenerationResponse(undefined);
      expect(result).toBeNull();
    });
  });

  describe('parseErrorResponse', () => {
    it('extracts error message', () => {
      const data = { error: 'Something went wrong' };
      const result = parseErrorResponse(data, 'Fallback');
      expect(result).toBe('Something went wrong');
    });

    it('returns fallback for invalid data', () => {
      const result = parseErrorResponse({ invalid: 'data' }, 'Fallback message');
      expect(result).toBe('Fallback message');
    });

    it('returns fallback for null', () => {
      const result = parseErrorResponse(null, 'Default error');
      expect(result).toBe('Default error');
    });

    it('extracts error with details', () => {
      const data = { error: 'Failed', details: 'Rate limit' };
      const result = parseErrorResponse(data, 'Fallback');
      expect(result).toBe('Failed');
    });
  });

  describe('parseCacheCheckResponse', () => {
    it('extracts cached URL', () => {
      const data = { audioUrl: 'https://example.com/audio.mp3' };
      const result = parseCacheCheckResponse(data);
      expect(result).toBe('https://example.com/audio.mp3');
    });

    it('returns null for null audioUrl', () => {
      const data = { audioUrl: null };
      const result = parseCacheCheckResponse(data);
      expect(result).toBeNull();
    });

    it('returns null for invalid data', () => {
      const result = parseCacheCheckResponse({ invalid: 'data' });
      expect(result).toBeNull();
    });

    it('returns null for missing audioUrl', () => {
      const result = parseCacheCheckResponse({});
      expect(result).toBeNull();
    });
  });
});
