/* ============================================================================
   Supabase Client Configuration
   ============================================================================
   This module creates and exports a Supabase client for use throughout the app.

   Supabase provides:
   - Authentication (signup, login, session management)
   - Database access (PostgreSQL with RLS)
   - Realtime subscriptions
   - Storage for files

   Usage:
   import { supabase } from '@/lib/supabase';
   const { data, error } = await supabase.from('profiles').select('*');
   ============================================================================ */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@tbot/shared';

/* ----------------------------------------------------------------------------
   Environment Variables
   ----------------------------------------------------------------------------
   These values come from your Supabase project settings.
   In production, these are set in your deployment environment.
   In development, they're loaded from .env files.

   VITE_ prefix is required for Vite to expose variables to the client.
   ---------------------------------------------------------------------------- */

// The URL of your Supabase project (e.g., https://xyz.supabase.co)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

// The anonymous (public) key - safe to expose in the browser
// This key only allows operations permitted by your RLS policies
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/* ----------------------------------------------------------------------------
   Validation
   ----------------------------------------------------------------------------
   Fail early if environment variables are missing.
   This prevents confusing runtime errors.
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
   Create Supabase Client
   ----------------------------------------------------------------------------
   The client is created once and reused throughout the application.
   This ensures we maintain a single connection and auth state.

   Options explained:
   - auth.persistSession: Saves session to localStorage for persistence
   - auth.autoRefreshToken: Automatically refreshes JWT before expiry
   - auth.detectSessionInUrl: Handles OAuth callback URLs
   ---------------------------------------------------------------------------- */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist the session across page reloads
    persistSession: true,

    // Automatically refresh the JWT token before it expires
    autoRefreshToken: true,

    // Detect OAuth callback URLs (e.g., after Google login redirect)
    detectSessionInUrl: true,
  },
});

/* ----------------------------------------------------------------------------
   Type Exports
   ----------------------------------------------------------------------------
   Re-export useful types from Supabase for use in components.
   ---------------------------------------------------------------------------- */
export type { Session, User } from '@supabase/supabase-js';
