/* ============================================================================
   Index Route (Landing Page)
   ============================================================================
   Route definition for the landing/login page.
   The actual component is in components/pages/LandingPage.
   ============================================================================ */

import { createFileRoute } from '@tanstack/react-router';

import { LandingPage } from '../components/pages';

/* ----------------------------------------------------------------------------
   Route Definition
   ---------------------------------------------------------------------------- */
export const Route = createFileRoute('/')({
  component: LandingPage,
});
