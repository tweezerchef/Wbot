/* ============================================================================
   Browser Supabase Client
   ============================================================================
   Creates a Supabase client for use in browser/client-side code.
   Uses @supabase/ssr's createBrowserClient for proper cookie handling.

   Usage:
   import { supabase } from '@/lib/supabase';
   const { data, error } = await supabase.from('profiles').select('*');
   ============================================================================ */

/// <reference types="vite/types/importMeta.d.ts" />
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@wbot/shared';

/* ----------------------------------------------------------------------------
   Environment Variables
   ---------------------------------------------------------------------------- */

// The URL of your Supabase project (e.g., https://xyz.supabase.co)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

// The anonymous (public) key - safe to expose in the browser
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/* ----------------------------------------------------------------------------
   Validation
   ---------------------------------------------------------------------------- */
if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL environment variable. ' +
      'Add it to your .env file or deployment environment.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY environment variable. ' +
      'Add it to your .env file or deployment environment.'
  );
}

/* ----------------------------------------------------------------------------
   Create Browser Client
   ----------------------------------------------------------------------------
   Creates a Supabase client configured for browser usage.
   Handles cookies automatically for session persistence.
   ---------------------------------------------------------------------------- */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Singleton instance for client-side usage
export const supabase = createClient();

/* ----------------------------------------------------------------------------
   Type Exports
   ---------------------------------------------------------------------------- */
export type { Session, User } from '@supabase/supabase-js';
