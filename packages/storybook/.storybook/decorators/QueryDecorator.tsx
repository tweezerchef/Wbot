/**
 * Query decorator for Storybook.
 *
 * Provides TanStack Query context configured for real data fetching.
 * Unlike the mock data approach, this allows components to fetch
 * actual data from Supabase.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useState } from 'react';

/**
 * Creates a QueryClient configured for Storybook.
 *
 * Settings optimized for development:
 * - retry: 1 (retry once on failure)
 * - staleTime: 5 minutes (avoid excessive refetches)
 * - refetchOnWindowFocus: false (avoid noise during development)
 */
function createStorybookQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Retry once on failure
        retry: 1,

        // Consider data fresh for 5 minutes
        staleTime: 5 * 60 * 1000,

        // Don't refetch when window regains focus (reduces noise in Storybook)
        refetchOnWindowFocus: false,

        // Don't refetch on mount if data is fresh
        refetchOnMount: false,

        // Garbage collect unused data after 30 minutes
        gcTime: 30 * 60 * 1000,
      },
      mutations: {
        // Show errors in console during development
        onError: (error) => {
          console.error('[Storybook Query] Mutation error:', error);
        },
      },
    },
  });
}

/**
 * Storybook decorator that provides TanStack Query context.
 *
 * Each story gets a fresh QueryClient to ensure isolation.
 * Data is fetched from real APIs (no mock data pre-population).
 *
 * Usage in preview.tsx:
 * ```tsx
 * import { QueryDecorator } from './decorators/QueryDecorator';
 *
 * const preview: Preview = {
 *   decorators: [QueryDecorator],
 * };
 * ```
 */
export function QueryDecorator(Story: React.ComponentType): ReactElement {
  // Create a new QueryClient for each story mount
  // This ensures stories don't share cached data
  const [queryClient] = useState(() => createStorybookQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  );
}
