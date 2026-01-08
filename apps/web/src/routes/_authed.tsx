/**
 * Protected Route Layout (_authed)
 *
 * This is a pathless layout that wraps all routes under /_authed/.
 * It handles authentication checking before any protected route loads.
 *
 * How it works:
 * 1. beforeLoad runs on the server (SSR) before the route renders
 * 2. Checks if the user is authenticated via Supabase
 * 3. If not authenticated, redirects to the landing page
 * 4. If authenticated, passes the user object to child routes via context
 *
 * Child routes can access the user via:
 * - loader: ({ context }) => context.user
 * - component: Route.useRouteContext()
 */

import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { createServerSupabaseClient } from '../lib/supabase/server';

// ----------------------------------------------------------------------------
// User Type
// ----------------------------------------------------------------------------
// Minimal user info passed to child routes
export interface AuthedUser {
  id: string;
  email: string | undefined;
}

// ----------------------------------------------------------------------------
// Server Function - Get Authenticated User
// ----------------------------------------------------------------------------
// Runs on the server where we have access to auth cookies.
// Returns the user if authenticated, null otherwise.
const getAuthUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthedUser | null> => {
    try {
      const supabase = createServerSupabaseClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
      };
    } catch (err) {
      console.error('Error getting authenticated user:', err);
      return null;
    }
  }
);

// ----------------------------------------------------------------------------
// Protected Route Layout
// ----------------------------------------------------------------------------
export const Route = createFileRoute('/_authed')({
  /**
   * beforeLoad runs before the route renders.
   * This is the correct place for auth checks (not loader).
   *
   * Why beforeLoad instead of loader:
   * - beforeLoad can throw redirect() to prevent the page from loading
   * - loader should return data, not handle auth redirects
   * - beforeLoad context is passed to child routes
   */
  beforeLoad: async () => {
    const user = await getAuthUser();

    if (!user) {
      // Redirect to landing page if not authenticated
      // Note: TanStack Router requires throwing redirect objects, not Error instances
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw redirect({ to: '/' });
    }

    // Pass user to child routes via context
    return { user };
  },

  /**
   * The layout component just renders the child route.
   * No additional UI needed - this is purely for auth protection.
   */
  component: AuthedLayout,
});

// ----------------------------------------------------------------------------
// Layout Component
// ----------------------------------------------------------------------------
function AuthedLayout() {
  // Just render child routes - no additional wrapper needed
  return <Outlet />;
}
