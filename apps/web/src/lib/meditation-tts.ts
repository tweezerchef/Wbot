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
 * Stream meditation audio with progressive playback using MediaSource API.
 *
 * This enables real-time audio playback - audio starts playing within 2-3 seconds
 * of starting generation, without waiting for full audio to download.
 *
 * Uses the MediaSource Extensions (MSE) API to append audio chunks to a
 * SourceBuffer as they arrive from the server, enabling progressive playback.
 *
 * @param authToken - Supabase JWT access token
 * @param request - Generation request with scriptId and personalization
 * @param audioElement - HTML audio element to play through
 * @param onProgress - Optional callback for streaming progress (bytesReceived, isPlaying)
 * @returns Promise that resolves when streaming is complete, with collected audio chunks
 */
export async function streamMeditationWithProgressivePlayback(
  authToken: string,
  request: GenerateMeditationRequest,
  audioElement: HTMLAudioElement,
  onProgress?: (bytesReceived: number, isPlaying: boolean) => void
): Promise<Uint8Array> {
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

  const body = response.body;
  if (!body) {
    throw new Error('Streaming not supported');
  }

  // Check if MediaSource is supported (runtime check for browser compatibility)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!window.MediaSource || !MediaSource.isTypeSupported('audio/mpeg')) {
    // Fallback to non-progressive playback
    console.warn('MediaSource not supported, falling back to buffered playback');
    const blobUrl = await streamPersonalizedMeditation(authToken, request, (bytes) =>
      onProgress?.(bytes, false)
    );
    audioElement.src = blobUrl;
    const chunks = await response.arrayBuffer();
    return new Uint8Array(chunks);
  }

  // Set up MediaSource for progressive playback
  const mediaSource = new MediaSource();
  audioElement.src = URL.createObjectURL(mediaSource);

  // Wait for MediaSource to open
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('MediaSource open timeout'));
    }, 10000);
    mediaSource.addEventListener(
      'sourceopen',
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true }
    );
    mediaSource.addEventListener(
      'error',
      () => {
        clearTimeout(timeout);
        reject(new Error('MediaSource error'));
      },
      { once: true }
    );
  });

  // Create source buffer for MP3 audio
  const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
  const reader = body.getReader();
  let bytesReceived = 0;
  let hasStartedPlaying = false;
  const collectedChunks: Uint8Array[] = [];

  // Helper to wait for SourceBuffer to finish updating
  const waitForUpdateEnd = (): Promise<void> => {
    if (!sourceBuffer.updating) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      sourceBuffer.addEventListener(
        'updateend',
        () => {
          resolve();
        },
        { once: true }
      );
    });
  };

  try {
    // Read and append chunks progressively
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      // Collect chunk for later use (caching, etc.)
      collectedChunks.push(value);
      bytesReceived += value.length;

      // Wait for buffer to be ready before appending
      await waitForUpdateEnd();

      // Append chunk to source buffer
      sourceBuffer.appendBuffer(value);
      await waitForUpdateEnd();

      // Start playback after we have enough data (~16KB)
      if (!hasStartedPlaying && bytesReceived > 16384) {
        try {
          await audioElement.play();
          hasStartedPlaying = true;
        } catch (playError) {
          // Autoplay may be blocked - user interaction required
          console.warn('Autoplay blocked, waiting for user interaction:', playError);
        }
      }

      onProgress?.(bytesReceived, hasStartedPlaying);
    }

    // Signal end of stream
    await waitForUpdateEnd();
    if (mediaSource.readyState === 'open') {
      mediaSource.endOfStream();
    }
  } catch (error) {
    // Clean up on error
    if (mediaSource.readyState === 'open') {
      mediaSource.endOfStream('decode');
    }
    throw error;
  }

  // Combine all chunks into single array
  const totalLength = collectedChunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of collectedChunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  return combined;
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
