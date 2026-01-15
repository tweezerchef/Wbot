/**
 * Auth Middleware for Server Functions
 *
 * Provides reusable authentication middleware for TanStack Start server functions.
 * Extracts and validates the user from Supabase auth cookies, passing the user
 * to downstream handlers via context.
 *
 * Usage:
 * ```typescript
 * import { authMiddleware } from '@/lib/middleware/auth';
 *
 * const myServerFn = createServerFn({ method: 'GET' })
 *   .middleware([authMiddleware])
 *   .handler(async ({ context }) => {
 *     // context.user is typed and available
 *     const userId = context.user.id;
 *     // ...
 *   });
 * ```
 */

import { createMiddleware } from '@tanstack/react-start';

import { createServerSupabaseClient } from '@/lib/supabase/server';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

/** User info passed through middleware context */
export interface AuthUser {
  id: string;
  email: string | undefined;
}

/** Context shape added by auth middleware */
export interface AuthContext {
  user: AuthUser;
}

// ----------------------------------------------------------------------------
// Auth Middleware
// ----------------------------------------------------------------------------

/**
 * Middleware that validates authentication and adds user to context.
 *
 * Server-side only - validates the user via Supabase cookies.
 * Throws an error if the user is not authenticated, which will
 * cause the server function to fail with an appropriate error.
 *
 * @example
 * const protectedFn = createServerFn({ method: 'GET' })
 *   .middleware([authMiddleware])
 *   .handler(async ({ context }) => {
 *     // User is guaranteed to exist here
 *     return { userId: context.user.id };
 *   });
 */
export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized: Authentication required');
  }

  // Pass validated user to downstream handlers
  return next({
    context: {
      user: {
        id: user.id,
        email: user.email,
      },
    },
  });
});

// ----------------------------------------------------------------------------
// Optional Auth Middleware
// ----------------------------------------------------------------------------

/**
 * Middleware that checks authentication but doesn't require it.
 *
 * Use this for routes that should work for both authenticated and
 * unauthenticated users, but need to know the auth state.
 *
 * @example
 * const publicFn = createServerFn({ method: 'GET' })
 *   .middleware([optionalAuthMiddleware])
 *   .handler(async ({ context }) => {
 *     if (context.user) {
 *       // User is authenticated
 *       return { personalized: true, userId: context.user.id };
 *     }
 *     // User is not authenticated
 *     return { personalized: false };
 *   });
 */
export const optionalAuthMiddleware = createMiddleware().server(async ({ next }) => {
  const supabase = createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Pass user (or undefined) to downstream handlers
  return next({
    context: {
      user:
        error || !user
          ? undefined
          : {
              id: user.id,
              email: user.email,
            },
    },
  });
});
