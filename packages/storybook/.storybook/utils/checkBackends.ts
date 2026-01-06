/**
 * Backend connectivity check utilities for Storybook.
 *
 * Provides functions to verify that required backend services
 * are available before running stories that depend on them.
 */

import { supabase } from '@/lib/supabase';

export interface BackendStatus {
  /** Whether Supabase is reachable */
  supabase: boolean;
  /** Whether the AI backend is reachable */
  aiBackend: boolean;
  /** Error message if Supabase check failed */
  supabaseError?: string;
  /** Error message if AI backend check failed */
  aiBackendError?: string;
}

/**
 * Checks if Supabase is reachable by making a simple query.
 */
async function checkSupabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    // Try to get the current session - this doesn't require any specific tables
    const { error } = await supabase.auth.getSession();

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown Supabase error',
    };
  }
}

/**
 * Checks if the AI backend is reachable by hitting a health endpoint.
 */
async function checkAIBackendConnection(): Promise<{ ok: boolean; error?: string }> {
  const aiBackendUrl = import.meta.env.VITE_LANGGRAPH_API_URL as string | undefined;

  if (!aiBackendUrl) {
    return { ok: false, error: 'VITE_LANGGRAPH_API_URL not configured' };
  }

  try {
    // Try to hit the health endpoint with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 3000);

    const response = await fetch(`${aiBackendUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { ok: false, error: `HTTP ${String(response.status)}: ${response.statusText}` };
    }

    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { ok: false, error: 'Connection timed out' };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown AI backend error',
    };
  }
}

/**
 * Checks connectivity to all required backends.
 *
 * @returns Status of each backend service
 *
 * @example
 * ```tsx
 * const status = await checkBackendStatus();
 * if (!status.supabase) {
 *   console.warn('Supabase unavailable:', status.supabaseError);
 * }
 * ```
 */
export async function checkBackendStatus(): Promise<BackendStatus> {
  const [supabaseResult, aiBackendResult] = await Promise.all([
    checkSupabaseConnection(),
    checkAIBackendConnection(),
  ]);

  return {
    supabase: supabaseResult.ok,
    aiBackend: aiBackendResult.ok,
    supabaseError: supabaseResult.error,
    aiBackendError: aiBackendResult.error,
  };
}

/**
 * Logs backend status to console for debugging.
 */

export function logBackendStatus(status: BackendStatus): void {
  /* eslint-disable no-console -- intentional debug logging for Storybook */
  console.group('[Storybook] Backend Status');

  if (status.supabase) {
    console.log('%c✓ Supabase', 'color: green');
  } else {
    console.log('%c✗ Supabase', 'color: red', status.supabaseError);
  }

  if (status.aiBackend) {
    console.log('%c✓ AI Backend', 'color: green');
  } else {
    console.log('%c✗ AI Backend', 'color: red', status.aiBackendError);
  }

  console.groupEnd();
  /* eslint-enable no-console */
}
