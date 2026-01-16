/**
 * Conversation Query Options
 *
 * Provides reusable query configurations using TanStack Query's queryOptions pattern.
 * These can be used with:
 * - useSuspenseQuery() for SSR-critical data
 * - useQuery() for client-only data
 * - queryClient.ensureQueryData() in loaders for prefetching
 * - queryClient.prefetchQuery() for streaming non-critical data
 */

import { queryOptions } from '@tanstack/react-query';
import type { Tables } from '@wbot/shared';

import { conversationKeys } from './conversationKeys';

import { createClient } from '@/lib/supabase/client';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

/** Conversation row from database */
export type ConversationRow = Tables<'conversations'>;

/** Message row from database */
export type MessageRow = Tables<'messages'>;

/** Conversation with preview data from the RPC function */
export interface ConversationWithPreview {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  last_message_content: string;
  last_message_role: string;
  message_count: number;
}

// ----------------------------------------------------------------------------
// Query Options
// ----------------------------------------------------------------------------

/**
 * Query options for fetching a user's conversation list with message previews.
 *
 * Uses the `get_conversations_with_preview` RPC function for efficient
 * fetching of conversations with their last message.
 *
 * @param userId - The user's ID
 * @param options - Optional pagination options
 *
 * @example
 * // In a route loader
 * await queryClient.ensureQueryData(conversationListOptions(userId))
 *
 * @example
 * // In a component
 * const { data } = useQuery(conversationListOptions(userId))
 */
export function conversationListOptions(
  userId: string,
  options?: { limit?: number; offset?: number }
) {
  return queryOptions({
    queryKey: conversationKeys.list(userId),
    queryFn: async (): Promise<ConversationWithPreview[]> => {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('get_conversations_with_preview', {
        p_user_id: userId,
        p_limit: options?.limit ?? 50,
        p_offset: options?.offset ?? 0,
      });

      if (error) {
        throw new Error(`Failed to fetch conversations: ${error.message}`);
      }

      return data;
    },
    // Conversation list changes infrequently, keep fresh for 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Query options for fetching a single conversation's details.
 *
 * @param conversationId - The conversation's ID
 *
 * @example
 * const { data } = useQuery(conversationDetailOptions(conversationId))
 */
export function conversationDetailOptions(conversationId: string) {
  return queryOptions({
    queryKey: conversationKeys.detail(conversationId),
    queryFn: async (): Promise<ConversationRow | null> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        // PGRST116 = Row not found, which is expected for new/deleted conversations
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to fetch conversation: ${error.message}`);
      }

      return data;
    },
    // Conversation details change infrequently
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Query options for fetching messages in a conversation.
 *
 * Note: The app currently uses SSE streaming for real-time messages during
 * active conversations. This query option is useful for:
 * - Initial message load
 * - Loading messages when switching between conversations
 * - Prefetching message history
 *
 * @param conversationId - The conversation's ID
 * @param options - Optional pagination options
 *
 * @example
 * const { data } = useQuery(conversationMessagesOptions(conversationId))
 */
export function conversationMessagesOptions(conversationId: string, options?: { limit?: number }) {
  return queryOptions({
    queryKey: conversationKeys.messages(conversationId),
    queryFn: async (): Promise<MessageRow[]> => {
      const supabase = createClient();

      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch messages: ${error.message}`);
      }

      return data;
    },
    // Messages can change during active conversations, shorter stale time
    staleTime: 30 * 1000,
  });
}
