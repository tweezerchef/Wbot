/**
 * Responsive breakpoint constants.
 * Keep in sync with CSS media queries in the codebase.
 */
export const BREAKPOINTS = {
  /** Mobile devices max width (below this is considered mobile) */
  MOBILE_MAX: 768,
} as const;

/**
 * Check if the current viewport is mobile-sized.
 * Safe to call during SSR (returns false on server).
 *
 * @returns true if viewport width is below mobile breakpoint
 */
export function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < BREAKPOINTS.MOBILE_MAX;
}
