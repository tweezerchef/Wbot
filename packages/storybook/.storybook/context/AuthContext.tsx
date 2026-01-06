/**
 * Authentication context for Storybook.
 *
 * Provides authenticated Supabase session to all stories,
 * enabling components to access user data and make authenticated API calls.
 */
import { createContext, useContext } from 'react';

import type { Session, User } from '@/lib/supabase';

export interface AuthContextValue {
  /** The current Supabase session */
  session: Session | null;
  /** The authenticated user */
  user: User | null;
  /** JWT access token for API calls */
  accessToken: string | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether authentication is in progress */
  isLoading: boolean;
  /** Error message if authentication failed */
  error: string | null;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Hook to access the Storybook auth context.
 *
 * @returns Auth context value with session, user, and access token
 * @throws Error if used outside of AuthDecorator
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { session, accessToken, isAuthenticated } = useStorybookAuth();
 *
 *   if (!isAuthenticated) {
 *     return <div>Not authenticated</div>;
 *   }
 *
 *   // Use accessToken for API calls
 *   return <div>Welcome, {session?.user.email}</div>;
 * }
 * ```
 */
export function useStorybookAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useStorybookAuth must be used within an AuthDecorator. ' +
        'Make sure AuthDecorator is added to Storybook decorators in preview.tsx'
    );
  }

  return context;
}
