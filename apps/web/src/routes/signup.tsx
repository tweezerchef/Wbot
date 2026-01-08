/* ============================================================================
   Signup Route
   ============================================================================
   Route definition for the signup/onboarding flow.
   The actual component is in features/auth.
   ============================================================================ */

import { createFileRoute } from '@tanstack/react-router';

import { SignupPage } from '@/features/auth';

/* ----------------------------------------------------------------------------
   Route Definition
   ---------------------------------------------------------------------------- */
export const Route = createFileRoute('/signup')({
  component: SignupPage,
});
