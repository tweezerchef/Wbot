/**
 * Router Context Type
 *
 * This interface defines what's available in the router context.
 * The queryClient is passed to all route loaders and components.
 */

import type { QueryClient } from '@tanstack/react-query';

export interface RouterContext {
  queryClient: QueryClient;
}
