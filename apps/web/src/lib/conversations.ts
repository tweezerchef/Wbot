/**
 * Conversation management helpers (client-safe).
 *
 * Provides functions for creating, loading, and managing conversations.
 * Used by ChatPage to persist conversation state across sessions.
 *
 * NOTE: This file is client-safe (no Node.js-only imports).
 * For server-side functions with Redis caching, see conversations.server.ts
 *
 * Functions accept an optional Supabase client parameter to support both:
 * - Browser usage (default client)
 * - Server usage (pass server client from route loader)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@wbot/shared';

import type { Message } from './ai-client';
import { supabase as defaultClient } from './supabase';

// Type alias for the typed Supabase client
type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Creates a new conversation for the user.
 *
 * @param userId - The authenticated user's ID
 * @param client - Optional Supabase client (defaults to browser client)
 * @returns The new conversation's UUID
 */
export async function createConversation(
  userId: string,
  client: TypedSupabaseClient = defaultClient
): Promise<string> {
  const { data, error } = await client
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
 * @param client - Optional Supabase client (defaults to browser client)
 * @returns The conversation ID, or null if no conversations exist
 */
export async function getMostRecentConversation(
  userId: string,
  client: TypedSupabaseClient = defaultClient
): Promise<string | null> {
  const { data, error } = await client
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
 * Loads all messages for a conversation from Supabase.
 *
 * This is the client-safe version that fetches directly from Supabase.
 * For server-side loading with Redis cache, see conversations.server.ts
 *
 * Messages are returned in chronological order.
 *
 * @param conversationId - The conversation UUID
 * @param client - Optional Supabase client (defaults to browser client)
 * @returns Array of messages in the conversation
 */
export async function loadMessages(
  conversationId: string,
  client: TypedSupabaseClient = defaultClient
): Promise<Message[]> {
  const { data, error } = await client
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
 * @param client - Optional Supabase client (defaults to browser client)
 */
export async function touchConversation(
  conversationId: string,
  client: TypedSupabaseClient = defaultClient
): Promise<void> {
  const { error } = await client
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  if (error) {
    console.error('Failed to update conversation timestamp:', error);
  }
}
