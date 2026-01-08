/**
 * Meditation TTS Zod Schemas
 *
 * Validation schemas for API responses from the meditation TTS backend.
 */

import { z } from 'zod';

// ----------------------------------------------------------------------------
// Generation Response Schemas
// ----------------------------------------------------------------------------

/** Schema for successful TTS generation response */
export const generateMeditationResponseSchema = z.object({
  /** Generated audio URL (Supabase Storage) */
  audioUrl: z.string(),
  /** Script ID that was generated */
  scriptId: z.string(),
  /** Actual duration of generated audio */
  durationSeconds: z.number(),
  /** Whether this was served from cache */
  cached: z.boolean(),
  /** Voice ID used for generation */
  voiceId: z.string(),
});

export type GenerateMeditationResponse = z.infer<typeof generateMeditationResponseSchema>;

// ----------------------------------------------------------------------------
// Error Response Schemas
// ----------------------------------------------------------------------------

/** Schema for error responses from the meditation API */
export const meditationErrorResponseSchema = z.object({
  error: z.string(),
  details: z.string().optional(),
});

export type MeditationErrorResponse = z.infer<typeof meditationErrorResponseSchema>;

// ----------------------------------------------------------------------------
// Cache Check Response Schemas
// ----------------------------------------------------------------------------

/** Schema for cache check response */
export const cacheCheckResponseSchema = z.object({
  audioUrl: z.string().nullable(),
});

export type CacheCheckResponse = z.infer<typeof cacheCheckResponseSchema>;

// ----------------------------------------------------------------------------
// Validation Helpers
// ----------------------------------------------------------------------------

/**
 * Safely parse generation response
 * @returns Parsed response or null if invalid
 */
export function parseGenerationResponse(data: unknown): GenerateMeditationResponse | null {
  const result = generateMeditationResponseSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Safely parse error response
 * @returns Error message string
 */
export function parseErrorResponse(data: unknown, fallback: string): string {
  const result = meditationErrorResponseSchema.safeParse(data);
  return result.success ? result.data.error : fallback;
}

/**
 * Safely parse cache check response
 * @returns Audio URL or null
 */
export function parseCacheCheckResponse(data: unknown): string | null {
  const result = cacheCheckResponseSchema.safeParse(data);
  return result.success ? result.data.audioUrl : null;
}
