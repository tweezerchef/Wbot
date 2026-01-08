/**
 * Conversation Query Key Factory
 *
 * Provides a type-safe, hierarchical structure for TanStack Query cache keys.
 * This pattern enables precise cache invalidation and consistent key usage.
 *
 * Usage Examples:
 * - conversationKeys.all                     => ['conversations']
 * - conversationKeys.lists()                 => ['conversations', 'list']
 * - conversationKeys.list('user123')         => ['conversations', 'list', 'user123']
 * - conversationKeys.detail('conv456')       => ['conversations', 'detail', 'conv456']
 * - conversationKeys.messages('conv456')     => ['conversations', 'detail', 'conv456', 'messages']
 *
 * Invalidation Examples:
 * - Invalidate all conversations:    queryClient.invalidateQueries({ queryKey: conversationKeys.all })
 * - Invalidate all lists:            queryClient.invalidateQueries({ queryKey: conversationKeys.lists() })
 * - Invalidate specific user's list: queryClient.invalidateQueries({ queryKey: conversationKeys.list(userId) })
 */

export const conversationKeys = {
  // Root key for all conversation-related queries
  all: ['conversations'] as const,

  // Keys for list queries
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (userId: string) => [...conversationKeys.lists(), userId] as const,

  // Keys for detail queries
  details: () => [...conversationKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,

  // Keys for messages within a conversation
  messages: (conversationId: string) =>
    [...conversationKeys.detail(conversationId), 'messages'] as const,
};

// Type helpers for extracting query key types
type ConversationKeyFunctions = Exclude<keyof typeof conversationKeys, 'all'>;

export type ConversationQueryKey =
  | typeof conversationKeys.all
  | ReturnType<(typeof conversationKeys)[ConversationKeyFunctions]>;
