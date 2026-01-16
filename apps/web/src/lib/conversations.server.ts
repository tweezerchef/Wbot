/**
 * Server-only conversation functions with Redis caching.
 *
 * This file should ONLY be imported in server-side code (route loaders,
 * server functions). It uses the Node.js Redis client which doesn't work
 * in browsers.
 *
 * For client-side conversation functions, use ./conversations.ts instead.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@wbot/shared';

import type { Message } from './ai-client';
import { cacheMessages, getCachedMessages } from './redis';

// Type alias for the typed Supabase client
type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Gets the most recent conversation for a user.
 *
 * Server-only function for use in route loaders.
 *
 * @param userId - The authenticated user's ID
 * @param client - Supabase client (from createServerSupabaseClient)
 * @returns The conversation ID, or null if no conversations exist
 */
export async function getMostRecentConversation(
  userId: string,
  client: TypedSupabaseClient
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
 * Loads all messages for a conversation with Redis cache-first strategy.
 *
 * Server-only function - uses Redis client for caching.
 *
 * Strategy:
 * 1. Check Redis cache for messages
 * 2. If cache hit, return immediately (trust TTL-based expiration)
 * 3. If cache miss, load from Supabase and populate cache
 *
 * Cache invalidation is handled via write-through when messages are added.
 * This eliminates the DB query on every cache hit (~100-200ms savings).
 *
 * @param conversationId - The conversation UUID
 * @param client - Supabase client (from createServerSupabaseClient)
 * @returns Array of messages in the conversation
 */
export async function loadMessagesWithCache(
  conversationId: string,
  client: TypedSupabaseClient
): Promise<Message[]> {
  // 1. Try Redis cache first - trust TTL for freshness
  const cached = await getCachedMessages(conversationId);

  if (cached && cached.length > 0) {
    // Cache hit - return immediately without DB validation
    return cached;
  }

  // 2. Cache miss - load from Supabase
  const { data, error } = await client
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load messages:', error);
    throw error;
  }

  const messages = data.map((msg) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    createdAt: msg.created_at ? new Date(msg.created_at) : new Date(),
  }));

  // 3. Populate cache for next request (fire-and-forget)
  cacheMessages(conversationId, messages).catch(() => {
    // Silent failure - caching is optional
  });

  return messages;
}
