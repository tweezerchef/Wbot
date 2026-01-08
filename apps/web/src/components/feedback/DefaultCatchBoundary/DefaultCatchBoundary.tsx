/**
 * DefaultCatchBoundary Component
 *
 * Global error boundary component for TanStack Router.
 * Displays user-friendly error messages with recovery options.
 *
 * Features:
 * - Shows error details via TanStack's ErrorComponent
 * - "Try Again" button to invalidate router and retry
 * - "Go Back" or "Home" navigation depending on context
 */

import { ErrorComponent, Link, useRouter, useRouterState } from '@tanstack/react-router';
import type { ErrorComponentProps } from '@tanstack/react-router';

import styles from './DefaultCatchBoundary.module.css';

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();

  // Get current location to determine if we're at root
  // Using useRouterState instead of useMatch to avoid errors when no match exists
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  const isRoot = currentPath === '/';

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Something went wrong</h1>

        {/* TanStack's built-in error display */}
        <div className={styles.errorWrapper}>
          <ErrorComponent error={error} />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => void router.invalidate()}
          >
            Try Again
          </button>

          {isRoot ? (
            <Link to="/" className={styles.secondaryButton}>
              Go Home
            </Link>
          ) : (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => {
                window.history.back();
              }}
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
