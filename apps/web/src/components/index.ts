/**
 * Shared components barrel export.
 *
 * These are UI components shared across features.
 * Feature-specific components should be imported from @/features/<feature>.
 */

// UI components (icons, primitives)
export * from './ui';

// Effect components (confetti, success animation)
export * from './effects';

// Feedback components (error boundary, not found)
export * from './feedback';

// Illustration components (organic shapes, decorative elements)
export * from './illustrations';

// Overlay components (activity overlay)
export * from './overlays';

// Skeleton loading components (for FOUC prevention)
export * from './skeletons';
