/**
 * Conversation management helpers for Supabase.
 *
 * Provides functions for creating, loading, and managing conversations.
 * Used by ChatPage to persist conversation state across sessions.
 */

import type { Message } from './ai-client';
import { supabase } from './supabase';

/**
 * Creates a new conversation for the user.
 *
 * @param userId - The authenticated user's ID
 * @returns The new conversation's UUID
 */
export async function createConversation(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create conversation:', error);
    throw error;
  }

  return data.id;
}

/**
 * Gets the most recent conversation for a user.
 *
 * Used on page load to auto-restore the last conversation.
 *
 * @param userId - The authenticated user's ID
 * @returns The conversation ID, or null if no conversations exist
 */
export async function getMostRecentConversation(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch recent conversation:', error);
    return null;
  }

  return data?.id ?? null;
}

/**
 * Loads all messages for a conversation.
 *
 * Messages are returned in chronological order.
 *
 * @param conversationId - The conversation UUID
 * @returns Array of messages in the conversation
 */
export async function loadMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load messages:', error);
    throw error;
  }

  return data.map((msg) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    createdAt: msg.created_at ? new Date(msg.created_at) : new Date(),
  }));
}

/**
 * Updates a conversation's updated_at timestamp.
 *
 * Called when new messages are added to keep the conversation
 * at the top of the "most recent" list.
 *
 * @param conversationId - The conversation UUID
 */
export async function touchConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) {
    console.error('Failed to update conversation timestamp:', error);
  }
}
