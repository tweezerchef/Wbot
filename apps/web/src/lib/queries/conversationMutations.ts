/**
 * Conversation Mutation Hooks
 *
 * TanStack Query mutations for conversation-related database operations.
 * Each mutation automatically invalidates relevant query caches on success.
 */

import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { conversationKeys } from './conversationKeys';
import type { ConversationRow } from './conversations';

import { createClient } from '@/lib/supabase/client';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

/** Parameters for deleting a conversation */
export interface DeleteConversationParams {
  conversationId: string;
  userId: string;
}

/** Parameters for touching a conversation */
export interface TouchConversationParams {
  conversationId: string;
  userId: string;
}

/** Parameters for updating a conversation title */
export interface UpdateTitleParams {
  conversationId: string;
  userId: string;
  title: string;
}

/** Mutation result type for creating a conversation */
export type CreateConversationMutation = UseMutationResult<ConversationRow, Error, string>;

/** Mutation result type for deleting a conversation */
export type DeleteConversationMutation = UseMutationResult<void, Error, DeleteConversationParams>;

/** Mutation result type for touching (updating timestamp) a conversation */
export type TouchConversationMutation = UseMutationResult<void, Error, TouchConversationParams>;

/** Mutation result type for updating a conversation title */
export type UpdateConversationTitleMutation = UseMutationResult<void, Error, UpdateTitleParams>;

// ----------------------------------------------------------------------------
// useCreateConversation
// ----------------------------------------------------------------------------

/**
 * Creates a new conversation for the user.
 *
 * On success, invalidates the conversation list to reflect the new conversation.
 *
 * @example
 * const createConversation = useCreateConversation();
 *
 * const handleNewChat = async () => {
 *   const result = await createConversation.mutateAsync(userId);
 *   setConversationId(result.id);
 * };
 */
export function useCreateConversation(): CreateConversationMutation {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string): Promise<ConversationRow> => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('conversations')
        .insert({ user_id: userId })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create conversation: ${error.message}`);
      }

      return data;
    },
    onSuccess: (_, userId) => {
      // Invalidate the conversation list to show the new conversation
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.list(userId),
      });
    },
  });
}

// ----------------------------------------------------------------------------
// useDeleteConversation
// ----------------------------------------------------------------------------

/**
 * Deletes a conversation and all its messages.
 *
 * On success, invalidates the conversation list and removes the
 * conversation detail from cache.
 *
 * @example
 * const deleteConversation = useDeleteConversation();
 *
 * const handleDelete = async () => {
 *   await deleteConversation.mutateAsync({
 *     conversationId,
 *     userId,
 *   });
 * };
 */
export function useDeleteConversation(): DeleteConversationMutation {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId }: DeleteConversationParams): Promise<void> => {
      const supabase = createClient();

      // Messages are deleted automatically via cascade
      const { error } = await supabase.from('conversations').delete().eq('id', conversationId);

      if (error) {
        throw new Error(`Failed to delete conversation: ${error.message}`);
      }
    },
    onSuccess: (_, { conversationId, userId }) => {
      // Invalidate the conversation list
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.list(userId),
      });

      // Remove the specific conversation from cache
      queryClient.removeQueries({
        queryKey: conversationKeys.detail(conversationId),
      });

      // Remove messages from cache
      queryClient.removeQueries({
        queryKey: conversationKeys.messages(conversationId),
      });
    },
  });
}

// ----------------------------------------------------------------------------
// useTouchConversation
// ----------------------------------------------------------------------------

/**
 * Updates the conversation's updated_at timestamp.
 *
 * This is useful for keeping the conversation list sorted by recent activity.
 * Called after sending a message to move the conversation to the top.
 *
 * @example
 * const touchConversation = useTouchConversation();
 *
 * // After sending a message
 * await touchConversation.mutateAsync({ conversationId, userId });
 */
export function useTouchConversation(): TouchConversationMutation {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId }: TouchConversationParams): Promise<void> => {
      const supabase = createClient();

      const { error } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) {
        throw new Error(`Failed to update conversation: ${error.message}`);
      }
    },
    onSuccess: (_, { conversationId, userId }) => {
      // Invalidate the conversation list to reflect new order
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.list(userId),
      });

      // Invalidate the conversation detail
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(conversationId),
      });
    },
  });
}

// ----------------------------------------------------------------------------
// useUpdateConversationTitle
// ----------------------------------------------------------------------------

/**
 * Updates a conversation's title.
 *
 * @example
 * const updateTitle = useUpdateConversationTitle();
 *
 * await updateTitle.mutateAsync({
 *   conversationId,
 *   userId,
 *   title: 'Morning meditation session',
 * });
 */
export function useUpdateConversationTitle(): UpdateConversationTitleMutation {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, title }: UpdateTitleParams): Promise<void> => {
      const supabase = createClient();

      const { error } = await supabase
        .from('conversations')
        .update({ title })
        .eq('id', conversationId);

      if (error) {
        throw new Error(`Failed to update conversation title: ${error.message}`);
      }
    },
    onSuccess: (_, { conversationId, userId }) => {
      // Invalidate the conversation list to show new title
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.list(userId),
      });

      // Invalidate the conversation detail
      void queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(conversationId),
      });
    },
  });
}
