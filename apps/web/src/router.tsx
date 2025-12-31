// ============================================================================
// TanStack Router Configuration
// ============================================================================
// This file configures the TanStack Router instance used throughout the app.
// It imports the auto-generated route tree from the file-based routes.
// ============================================================================

import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

// Create the router factory function
// TanStack Start requires a getRouter function that returns the router instance
// The routeTree is auto-generated from the files in the routes/ directory
export function getRouter() {
  return createRouter({
    routeTree,
    // Default preload strategy - preload on hover for faster navigation
    defaultPreload: 'intent',
  });
}

// Create a router instance for type inference
const router = getRouter();

// Type registration for TypeScript support
// This enables type-safe routing throughout the app
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
