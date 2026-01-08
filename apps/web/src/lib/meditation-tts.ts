/* ============================================================================
   Meditation TTS API Service
   ============================================================================
   Client-side service for generating personalized meditations via ElevenLabs TTS.

   This service calls the backend API to:
   1. Fetch the meditation script from the database
   2. Apply personalization (replace placeholders)
   3. Generate audio via ElevenLabs API
   4. Upload to Supabase Storage and return URL

   The backend handles caching - identical scripts return cached audio URLs.

   All API responses are validated with Zod for type safety.
   ============================================================================ */

import {
  type GenerateMeditationResponse,
  parseCacheCheckResponse,
  parseErrorResponse,
  parseGenerationResponse,
} from './schemas/meditation-tts';

// Re-export types for consumers
export type { GenerateMeditationResponse } from './schemas/meditation-tts';

/* ----------------------------------------------------------------------------
   Configuration
   ---------------------------------------------------------------------------- */

// Backend API URL for meditation generation
// In development: Local backend server
// In production: Your deployed backend URL
const MEDITATION_API_URL =
  (import.meta.env.VITE_MEDITATION_API_URL as string | undefined) ??
  (import.meta.env.VITE_LANGGRAPH_API_URL as string | undefined) ??
  'http://localhost:2024';

/* ----------------------------------------------------------------------------
   Types
   ---------------------------------------------------------------------------- */

/** Request to generate a personalized meditation */
export interface GenerateMeditationRequest {
  /** The script ID to generate */
  scriptId: string;
  /** User personalization options */
  personalization?: {
    userName?: string;
    userGoal?: string;
  };
}

/* ----------------------------------------------------------------------------
   API Client
   ---------------------------------------------------------------------------- */

/**
 * Generate a personalized meditation using TTS.
 *
 * This calls the backend API which:
 * 1. Fetches the script from meditation_scripts table
 * 2. Applies personalization placeholders
 * 3. Generates audio via ElevenLabs
 * 4. Uploads to Supabase Storage
 * 5. Returns the audio URL
 *
 * @param authToken - Supabase JWT access token
 * @param request - Generation request with scriptId and personalization
 * @returns Generated meditation with audio URL
 */
export async function generatePersonalizedMeditation(
  authToken: string,
  request: GenerateMeditationRequest
): Promise<GenerateMeditationResponse> {
  const response = await fetch(`${MEDITATION_API_URL}/api/meditation/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      script_id: request.scriptId,
      user_name: request.personalization?.userName,
      user_goal: request.personalization?.userGoal,
    }),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to generate meditation';
    try {
      const errorData: unknown = await response.json();
      errorMessage = parseErrorResponse(errorData, errorMessage);
    } catch {
      // Response wasn't JSON
      errorMessage = `Server error: ${String(response.status)}`;
    }
    throw new Error(errorMessage);
  }

  // Parse response with Zod validation
  const data: unknown = await response.json();
  const result = parseGenerationResponse(data);

  if (!result) {
    throw new Error('Invalid response format from meditation API');
  }

  return result;
}

/**
 * Stream a personalized meditation audio as it's generated.
 *
 * This calls the streaming endpoint which:
 * 1. Fetches the script and applies personalization
 * 2. Streams audio directly from ElevenLabs as chunks
 * 3. Returns a blob URL that can be used immediately
 * 4. Backend saves to storage in background for future caching
 *
 * Use this for immediate playback - audio starts playing as soon as
 * the first chunks arrive, without waiting for full generation.
 *
 * @param authToken - Supabase JWT access token
 * @param request - Generation request with scriptId and personalization
 * @param onProgress - Optional callback for streaming progress
 * @returns Blob URL for the audio that can be played immediately
 */
export async function streamPersonalizedMeditation(
  authToken: string,
  request: GenerateMeditationRequest,
  onProgress?: (bytesReceived: number) => void
): Promise<string> {
  const response = await fetch(`${MEDITATION_API_URL}/api/meditation/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      script_id: request.scriptId,
      user_name: request.personalization?.userName,
      user_goal: request.personalization?.userGoal,
    }),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to stream meditation';
    try {
      const errorData: unknown = await response.json();
      errorMessage = parseErrorResponse(errorData, errorMessage);
    } catch {
      errorMessage = `Server error: ${String(response.status)}`;
    }
    throw new Error(errorMessage);
  }

  // Read the stream and collect chunks
  const body = response.body;
  if (!body) {
    throw new Error('Streaming not supported');
  }
  const reader = body.getReader();

  const chunks: Uint8Array[] = [];
  let bytesReceived = 0;

  // Read all chunks from the stream
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    chunks.push(value);
    bytesReceived += value.length;
    onProgress?.(bytesReceived);
  }

  // Create a blob from the chunks - concatenate into single buffer
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }
  const blob = new Blob([combined], { type: 'audio/mpeg' });

  // Create and return a blob URL
  return URL.createObjectURL(blob);
}

/**
 * Check if a meditation script has cached audio available.
 *
 * This is a quick check that doesn't trigger generation.
 * Useful for showing instant playback option if available.
 *
 * @param authToken - Supabase JWT access token
 * @param scriptId - Script ID to check
 * @param personalization - Personalization options (affects cache key)
 * @returns Audio URL if cached, null otherwise
 */
export async function checkMeditationCache(
  authToken: string,
  scriptId: string,
  personalization?: { userName?: string; userGoal?: string }
): Promise<string | null> {
  try {
    const response = await fetch(`${MEDITATION_API_URL}/api/meditation/cache-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        script_id: scriptId,
        user_name: personalization?.userName,
        user_goal: personalization?.userGoal,
      }),
    });

    if (!response.ok) {
      return null;
    }

    // Parse response with Zod validation
    const data: unknown = await response.json();
    return parseCacheCheckResponse(data);
  } catch {
    // Cache check failed - return null
    return null;
  }
}
