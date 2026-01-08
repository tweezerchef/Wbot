/* ============================================================================
   Index Route (Landing Page)
   ============================================================================
   Route definition for the landing/login page.
   The actual component is in features/auth.
   ============================================================================ */

import { createFileRoute } from '@tanstack/react-router';

import { LandingPage } from '@/features/auth';

/* ----------------------------------------------------------------------------
   Route Definition
   ---------------------------------------------------------------------------- */
export const Route = createFileRoute('/')({
  component: LandingPage,
});
