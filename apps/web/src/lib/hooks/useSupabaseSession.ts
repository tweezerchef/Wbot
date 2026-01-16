/* ----------------------------------------------------------------------------
   useSupabaseSession Hook
   ----------------------------------------------------------------------------
   Provides reactive access to the Supabase auth session.
   Eliminates the need for redundant getSession() calls throughout components.
   ---------------------------------------------------------------------------- */

import type { Session, User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

/* ----------------------------------------------------------------------------
   Types
   ---------------------------------------------------------------------------- */

export interface UseSupabaseSessionReturn {
  /** The current Supabase session (null if not authenticated) */
  session: Session | null;
  /** The current authenticated user (null if not authenticated) */
  user: User | null;
  /** The access token for API calls (null if not authenticated) */
  accessToken: string | null;
  /** Whether the session is still being loaded */
  isLoading: boolean;
  /** Manually refresh the session */
  refresh: () => Promise<void>;
}

/* ----------------------------------------------------------------------------
   Hook Implementation
   ---------------------------------------------------------------------------- */

/**
 * Hook to access the current Supabase auth session reactively.
 *
 * This hook:
 * - Fetches the initial session on mount
 * - Subscribes to auth state changes (login, logout, token refresh)
 * - Provides easy access to session, user, and accessToken
 * - Cleans up subscription on unmount
 *
 * @example
 * const { session, user, accessToken, isLoading } = useSupabaseSession();
 *
 * // Use accessToken for API calls
 * if (accessToken) {
 *   const client = createAIClient(accessToken);
 * }
 *
 * // Check authentication
 * if (!session && !isLoading) {
 *   // User is not authenticated
 * }
 */
export function useSupabaseSession(): UseSupabaseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the current session
  const fetchSession = useCallback(async () => {
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);
    } catch (error) {
      console.error('Failed to get session:', error);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh the session manually
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    // Get initial session
    void fetchSession();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSession]);

  return {
    session,
    user: session?.user ?? null,
    accessToken: session?.access_token ?? null,
    isLoading,
    refresh,
  };
}
