/**
 * Dynamic Activity CSS Loader
 *
 * Loads activity CSS bundle on-demand when a wellness activity is triggered.
 * This avoids loading ~100KB+ of activity styles on initial page load,
 * improving LCP and reducing render-blocking CSS.
 *
 * Usage:
 *   const handleActivityStart = async () => {
 *     await loadActivityCSS();
 *     setCurrentActivity('breathing');
 *   };
 */

/** Tracks whether activity CSS has already been loaded */
let activitiesLoaded = false;

/** Tracks loading promise to prevent duplicate requests */
let loadingPromise: Promise<void> | null = null;

/**
 * Dynamically loads the activity CSS bundle.
 *
 * - Returns immediately if already loaded
 * - Deduplicates concurrent calls
 * - Creates a <link> element and waits for it to load
 *
 * @returns Promise that resolves when CSS is loaded and applied
 */
export async function loadActivityCSS(): Promise<void> {
  // Already loaded - return immediately
  if (activitiesLoaded) {
    return;
  }

  // Loading in progress - return existing promise to deduplicate
  if (loadingPromise) {
    return loadingPromise;
  }

  // Start loading
  loadingPromise = (async () => {
    try {
      // Dynamic import gets the URL to the CSS bundle
      // Vite processes the ?url suffix to return just the asset URL
      const { default: cssUrl } = await import('@/styles/routes/activities.css?url');

      // Create and append the stylesheet link
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssUrl;
      link.id = 'activity-styles';

      // Wait for CSS to load before resolving
      await new Promise<void>((resolve, reject) => {
        link.onload = () => {
          activitiesLoaded = true;
          resolve();
        };
        link.onerror = () => {
          reject(new Error('Failed to load activity CSS'));
        };

        document.head.appendChild(link);
      });
    } catch (error) {
      // Reset loading promise on error so it can be retried
      loadingPromise = null;
      throw error;
    }
  })();

  return loadingPromise;
}

/**
 * Checks if activity CSS is already loaded.
 * Useful for conditional rendering or debugging.
 */
export function isActivityCSSLoaded(): boolean {
  return activitiesLoaded;
}

/**
 * Preloads activity CSS in the background without blocking.
 * Call this when you anticipate an activity might start soon.
 *
 * Example: Preload when user opens sidebar or hovers over activity cards.
 */
export function preloadActivityCSS(): void {
  if (activitiesLoaded || loadingPromise) {
    return;
  }

  // Start loading but don't await
  loadActivityCSS().catch((error: unknown) => {
    console.warn('Failed to preload activity CSS:', error);
  });
}
