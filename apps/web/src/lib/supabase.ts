/* ============================================================================
   Supabase Client - Backward Compatibility Export
   ============================================================================
   Re-exports the browser Supabase client for backward compatibility.

   The actual implementation is now in:
   - ./supabase/client.ts - Browser client (for components, hooks)
   - ./supabase/server.ts - Server client (for route loaders, server functions)

   Usage:
   import { supabase } from '@/lib/supabase';
   const { data, error } = await supabase.from('profiles').select('*');
   ============================================================================ */

export { supabase, createClient, type Session, type User } from './supabase/client';
