/**
 * Authentication decorator for Storybook.
 *
 * Automatically authenticates a test user when Storybook loads,
 * providing a valid Supabase session to all stories.
 *
 * Requires environment variables:
 * - VITE_STORYBOOK_TEST_EMAIL: Test user email
 * - VITE_STORYBOOK_TEST_PASSWORD: Test user password
 */
import type { ReactElement, ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { AuthContext, type AuthContextValue } from '../context/AuthContext';

import { supabase } from '@/lib/supabase';

// Test user credentials from environment variables
const TEST_EMAIL = import.meta.env.VITE_STORYBOOK_TEST_EMAIL as string | undefined;
const TEST_PASSWORD = import.meta.env.VITE_STORYBOOK_TEST_PASSWORD as string | undefined;

interface AuthDecoratorProps {
  children: ReactNode;
}

/**
 * Inner component that handles authentication logic.
 */
function AuthProvider({ children }: AuthDecoratorProps): ReactElement {
  // Start with isLoading: false to avoid triggering re-renders in tests
  // The auth check happens async but we render immediately
  const [authState, setAuthState] = useState<AuthContextValue>({
    session: null,
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Skip auth if already checked
    if (hasCheckedAuth) {
      return;
    }

    async function initAuth() {
      try {
        // First, check if we already have a session
        const {
          data: { session: existingSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (existingSession) {
          // We have an existing session, use it
          if (mounted) {
            setAuthState({
              session: existingSession,
              user: existingSession.user,
              accessToken: existingSession.access_token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            setHasCheckedAuth(true);
          }
          return;
        }

        // No existing session, try to sign in with test credentials
        if (!TEST_EMAIL || !TEST_PASSWORD) {
          if (mounted) {
            setAuthState((prev) => ({
              ...prev,
              error:
                'Missing test credentials. Add VITE_STORYBOOK_TEST_EMAIL and VITE_STORYBOOK_TEST_PASSWORD to your .env file.',
            }));
            setHasCheckedAuth(true);
          }
          return;
        }

        // Sign in with test credentials
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        });

        if (signInError) {
          throw signInError;
        }

        // Sign-in succeeded - session is always present after successful login
        setAuthState({
          session: data.session,
          user: data.user,
          accessToken: data.session.access_token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        setHasCheckedAuth(true);
      } catch (err) {
        console.error('[Storybook Auth] Authentication failed:', err);

        if (mounted) {
          setAuthState((prev) => ({
            ...prev,
            error: err instanceof Error ? err.message : 'Authentication failed',
          }));
          setHasCheckedAuth(true);
        }
      }
    }

    void initAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setAuthState({
          session,
          user: session?.user ?? null,
          accessToken: session?.access_token ?? null,
          isAuthenticated: !!session,
          isLoading: false,
          error: null,
        });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hasCheckedAuth]);

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
}

/**
 * Warning banner shown when authentication fails.
 * Stories still render to allow development without auth.
 */
function AuthWarningBanner({ message }: { message: string }): ReactElement {
  return (
    <div
      style={{
        background: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '8px',
        padding: '12px 16px',
        margin: '8px',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#92400e',
      }}
    >
      <strong>Authentication Warning:</strong> {message}
      <br />
      <span style={{ fontSize: '12px', color: '#a16207' }}>
        Stories will render but may not have access to authenticated data.
      </span>
    </div>
  );
}

/**
 * Storybook decorator that provides authentication context.
 *
 * Usage in preview.tsx:
 * ```tsx
 * import { AuthDecorator } from './decorators/AuthDecorator';
 *
 * const preview: Preview = {
 *   decorators: [AuthDecorator],
 * };
 * ```
 */
export function AuthDecorator(Story: React.ComponentType): ReactElement {
  return (
    <AuthProvider>
      <AuthDecoratorInner>
        <Story />
      </AuthDecoratorInner>
    </AuthProvider>
  );
}

/**
 * Inner component that handles rendering based on auth state.
 * Non-blocking - always renders children immediately.
 * Shows warning banner only when auth fails (after async check completes).
 *
 * IMPORTANT: Always render the same structure to prevent React from
 * remounting children when auth state changes.
 */
function AuthDecoratorInner({ children }: { children: ReactNode }): ReactElement {
  return (
    <AuthContext.Consumer>
      {(value) => {
        // Always render the same structure to prevent remounting children
        // when auth state changes (which would reset component state)
        const showWarning = value?.error && !value.isAuthenticated;

        return (
          <div style={{ display: 'contents' }}>
            {showWarning && <AuthWarningBanner message={value.error} />}
            {children}
          </div>
        );
      }}
    </AuthContext.Consumer>
  );
}
