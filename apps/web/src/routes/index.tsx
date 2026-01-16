/* ============================================================================
   Index Route (Landing Page)
   ============================================================================
   Route definition for the landing/login page.
   The actual component is in features/auth.

   CSS Loading:
   - Route-specific CSS is loaded via head() for optimal performance
   - This avoids the global CSS bundle render-blocking issue
   ============================================================================ */

import { createFileRoute } from '@tanstack/react-router';

import { LandingPage } from '@/features/auth';
import landingCSS from '@/styles/routes/landing.css?url';

/* ----------------------------------------------------------------------------
   Route Definition
   ---------------------------------------------------------------------------- */
export const Route = createFileRoute('/')({
  // Load route-specific CSS via <link> in <head>
  head: () => ({
    links: [{ rel: 'stylesheet', href: landingCSS }],
  }),

  component: LandingPage,
});
