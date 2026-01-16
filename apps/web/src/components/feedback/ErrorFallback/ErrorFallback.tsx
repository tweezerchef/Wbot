/**
 * ErrorFallback Component
 *
 * Simple error fallback for lazy-loaded components wrapped in ErrorBoundary.
 * Displays a user-friendly error message with a retry option.
 */

import type { ComponentType } from 'react';
import type { FallbackProps } from 'react-error-boundary';

import styles from './ErrorFallback.module.css';

/**
 * Error fallback for component-level errors.
 * Explicitly typed as ComponentType<FallbackProps> for ErrorBoundary compatibility.
 */
export const ErrorFallback: ComponentType<FallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div className={styles.container} role="alert">
      <div className={styles.icon} aria-hidden="true">
        ⚠️
      </div>
      <p className={styles.message}>Something went wrong loading this content.</p>
      {process.env.NODE_ENV === 'development' && (
        <pre className={styles.details}>{error.message}</pre>
      )}
      <button type="button" className={styles.retryButton} onClick={resetErrorBoundary}>
        Try Again
      </button>
    </div>
  );
};
