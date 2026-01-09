/* ============================================================================
   Signup Route
   ============================================================================
   Route definition for the signup/onboarding flow.
   The actual component is in features/auth.

   FOUC Prevention:
   - pendingMs: 0 shows skeleton immediately on initial load
   - SignupSkeleton uses inline styles to avoid CSS module FOUC
   ============================================================================ */

import { createFileRoute } from '@tanstack/react-router';

import { SignupSkeleton } from '@/components/skeletons';
import { SignupPage } from '@/features/auth';

/* ----------------------------------------------------------------------------
   Route Definition
   ---------------------------------------------------------------------------- */
export const Route = createFileRoute('/signup')({
  // Show skeleton immediately to prevent FOUC on initial load/refresh
  pendingMs: 0,
  pendingComponent: SignupSkeleton,
  component: SignupPage,
});
