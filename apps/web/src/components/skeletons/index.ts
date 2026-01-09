/**
 * Skeleton Components - Loading placeholders for FOUC prevention
 *
 * These skeleton components use inline styles to avoid the CSS module
 * FOUC (Flash of Unstyled Content) issue. They're designed to mirror
 * the actual page layouts and provide a smooth loading experience.
 *
 * Usage:
 * - Import directly for route-level pendingComponent
 * - SignupSkeleton for /signup route
 * - ChatSkeleton for /chat route
 * - SidebarSkeleton for sidebar loading
 * - ActivityCardSkeleton for activity cards
 * - DefaultSkeleton as a generic fallback
 */

export { ActivityCardSkeleton } from './ActivityCardSkeleton';
export { ChatSkeleton } from './ChatSkeleton';
export { DefaultSkeleton } from './DefaultSkeleton';
export { SidebarSkeleton } from './SidebarSkeleton';
export { SignupSkeleton } from './SignupSkeleton';
