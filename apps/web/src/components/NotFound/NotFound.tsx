/* ============================================================================
   Not Found (404) Component
   ============================================================================
   Displayed when users navigate to a route that doesn't exist.
   Provides a clear message and a link back to the home page.
   ============================================================================ */

import { Link } from '@tanstack/react-router';

import styles from './NotFound.module.css';

/**
 * 404 Not Found page component.
 * Shown when a user navigates to a non-existent route.
 */
export function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Error code */}
        <span className={styles.errorCode}>404</span>

        {/* Main heading */}
        <h1 className={styles.title}>Page Not Found</h1>

        {/* Description */}
        <p className={styles.description}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Navigation link back to home */}
        <Link to="/" className={styles.homeLink}>
          Go back home
        </Link>
      </div>
    </div>
  );
}
