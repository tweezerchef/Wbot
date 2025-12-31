/* ============================================================================
   Signup Route
   ============================================================================
   Route definition for the signup/onboarding flow.
   The actual component is in components/pages/SignupPage.
   ============================================================================ */

import { createFileRoute } from '@tanstack/react-router';

import { SignupPage } from '../components/pages';

/* ----------------------------------------------------------------------------
   Route Definition
   ---------------------------------------------------------------------------- */
export const Route = createFileRoute('/signup')({
  component: SignupPage,
});
