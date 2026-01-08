/**
 * Conversation Query Options
 *
 * Provides reusable query configurations using TanStack Query's queryOptions pattern.
 * These can be used with:
 * - useSuspenseQuery() for SSR-critical data
 * - useQuery() for client-only data
 * - queryClient.ensureQueryData() in loaders for prefetching
 * - queryClient.prefetchQuery() for streaming non-critical data
 *
 * Note: Currently these are placeholder implementations. The app uses SSE
 * streaming for real-time messages which doesn't fit the Query model.
 * These patterns are set up for future use with conversation list caching.
 */

import { queryOptions } from '@tanstack/react-query';

import { conversationKeys } from './conversationKeys';

/**
 * Query options for fetching a user's conversation list.
 *
 * Usage in loader:
 * await queryClient.ensureQueryData(conversationListOptions(userId))
 *
 * Usage in component:
 * const { data } = useSuspenseQuery(conversationListOptions(userId))
 */
export const conversationListOptions = (userId: string) =>
  queryOptions({
    queryKey: conversationKeys.list(userId),
    queryFn: () => {
      // TODO: Implement actual fetch when Query is used for conversation lists
      // This would call a server function to get conversations
      // For now, return empty array as placeholder
      return [] as {
        id: string;
        title: string;
        updatedAt: string;
      }[];
    },
    // Keep data fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
  });

/**
 * Query options for fetching messages in a conversation.
 *
 * Note: Currently the app uses SSE streaming for messages,
 * so this Query-based approach isn't used. This is here as a
 * pattern reference for future use.
 */
export const conversationMessagesOptions = (conversationId: string) =>
  queryOptions({
    queryKey: conversationKeys.messages(conversationId),
    queryFn: () => {
      // TODO: Implement if/when messages are fetched via Query
      // For now, return empty array as placeholder
      return [] as {
        id: string;
        role: 'user' | 'assistant' | 'system';
        content: string;
        createdAt: string;
      }[];
    },
    // Keep data fresh for 1 minute
    staleTime: 60 * 1000,
  });

/**
 * Query options for fetching a single conversation's details.
 */
export const conversationDetailOptions = (conversationId: string) =>
  queryOptions({
    queryKey: conversationKeys.detail(conversationId),
    queryFn: () => {
      // TODO: Implement actual fetch
      return null as {
        id: string;
        title: string;
        createdAt: string;
        updatedAt: string;
      } | null;
    },
    staleTime: 5 * 60 * 1000,
  });
