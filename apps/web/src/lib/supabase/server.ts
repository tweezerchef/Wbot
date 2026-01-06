/* ============================================================================
   Server Supabase Client
   ============================================================================
   Creates a Supabase client for use in server-side code (route loaders,
   server functions, API endpoints).

   Uses @supabase/ssr's createServerClient with TanStack Start's cookie helpers
   for proper server-side session handling.

   Usage:
   import { createServerSupabaseClient } from '@/lib/supabase/server';
   const supabase = createServerSupabaseClient();
   const { data: { user } } = await supabase.auth.getUser();
   ============================================================================ */

import { createServerClient } from '@supabase/ssr';
import { getCookies, setCookie } from '@tanstack/react-start/server';
import type { Database } from '@wbot/shared';

/* ----------------------------------------------------------------------------
   Environment Variables
   ----------------------------------------------------------------------------
   Server-side code uses process.env instead of import.meta.env.
   Vite exposes VITE_ prefixed vars to process.env on the server.
   ---------------------------------------------------------------------------- */

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

/* ----------------------------------------------------------------------------
   Create Server Client
   ----------------------------------------------------------------------------
   Creates a new Supabase client for each request.
   Must be called within a request context (route loader, server function).

   Cookie handling:
   - getAll: Reads auth cookies from the incoming request
   - setAll: Sets refreshed auth cookies on the response
   ---------------------------------------------------------------------------- */
export function createServerSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
        'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.'
    );
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      // Read all cookies from the request
      getAll() {
        const cookies = getCookies();
        return Object.entries(cookies).map(([name, value]) => ({
          name,
          value,
        }));
      },
      // Set cookies on the response (for token refresh)
      setAll(cookiesToSet) {
        cookiesToSet.forEach((cookie) => {
          setCookie(cookie.name, cookie.value, cookie.options);
        });
      },
    },
  });
}
