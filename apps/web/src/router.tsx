// ============================================================================
// TanStack Router Configuration
// ============================================================================
// This file configures the TanStack Router instance used throughout the app.
// It imports the auto-generated route tree from the file-based routes.
//
// Key features:
// - QueryClient created per-request for SSR safety (prevents data leaks)
// - routerWithQueryClient for automatic Query hydration/streaming
// - Global error boundary for unhandled errors
// - Type-safe routing with TypeScript
// ============================================================================

import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';

import { DefaultCatchBoundary, NotFound } from './components/feedback';
import { routeTree } from './routeTree.gen';

// ----------------------------------------------------------------------------
// Router Factory
// ----------------------------------------------------------------------------
// TanStack Start requires a getRouter function that returns the router instance.
// The QueryClient is created inside this function for SSR safety - each request
// gets its own QueryClient to prevent data from leaking between users.
export function getRouter() {
  // Create a fresh QueryClient for each request
  // This is critical for SSR to prevent data leaking between users
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Data stays fresh for 1 minute before refetching
        // This prevents immediate refetch after SSR hydration
        staleTime: 60 * 1000,
        // Keep unused data in cache for 5 minutes before garbage collection
        gcTime: 5 * 60 * 1000,
        // Don't refetch when window regains focus (prevents jarring UX in chat)
        refetchOnWindowFocus: false,
        // Retry twice on failure with exponential backoff
        retry: 2,
        // Explicit exponential backoff: 1s, 2s, 4s... capped at 30s
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      },
    },
  });

  // Create the router with the route tree and context
  const router = createRouter({
    routeTree,
    // Pass QueryClient to all loaders via context
    context: { queryClient },
    // Preload on hover for faster navigation
    defaultPreload: 'intent',
    // Global error boundary for unhandled errors
    defaultErrorComponent: DefaultCatchBoundary,
    // Custom 404 component for unmatched routes
    defaultNotFoundComponent: NotFound,
  });

  // Wrap router with Query integration for SSR streaming/hydration
  return routerWithQueryClient(router, queryClient);
}

// ----------------------------------------------------------------------------
// Type Registration
// ----------------------------------------------------------------------------
// Export AppRouter type for use in other files (e.g., test utilities)
export type AppRouter = ReturnType<typeof getRouter>;

// Type registration for TypeScript support
// This enables type-safe routing throughout the app (useNavigate, useSearch, etc.)
declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}
