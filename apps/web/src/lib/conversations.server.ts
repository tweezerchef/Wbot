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
import { cacheMessages, getCachedMessages, invalidateCache } from './redis';

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
 * Gets the timestamp of the most recent message in a conversation.
 *
 * Used for cache freshness validation - compares cached data against
 * the actual latest message in Supabase.
 *
 * @param conversationId - The conversation UUID
 * @param client - Supabase client
 * @returns The latest message timestamp, or null if no messages
 */
async function getLatestMessageTimestamp(
  conversationId: string,
  client: TypedSupabaseClient
): Promise<Date | null> {
  const { data, error } = await client
    .from('messages')
    .select('created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.created_at) {
    return null;
  }

  return new Date(data.created_at);
}

/**
 * Loads all messages for a conversation with Redis cache-first strategy.
 *
 * Server-only function - uses Redis client for caching.
 *
 * Strategy:
 * 1. Check Redis cache for messages
 * 2. If cache hit, validate freshness against Supabase
 * 3. If stale or cache miss, load from Supabase and repopulate cache
 *
 * @param conversationId - The conversation UUID
 * @param client - Supabase client (from createServerSupabaseClient)
 * @returns Array of messages in the conversation
 */
export async function loadMessagesWithCache(
  conversationId: string,
  client: TypedSupabaseClient
): Promise<Message[]> {
  // 1. Try Redis cache first
  const cached = await getCachedMessages(conversationId);

  if (cached && cached.length > 0) {
    // 2. Validate cache freshness - compare latest message timestamps
    const latestCachedTime = cached[cached.length - 1].createdAt.getTime();
    const latestDbTimestamp = await getLatestMessageTimestamp(conversationId, client);

    if (latestDbTimestamp) {
      const latestDbTime = latestDbTimestamp.getTime();

      // Allow 1 second tolerance for timestamp precision differences
      if (latestDbTime <= latestCachedTime + 1000) {
        // Cache is fresh - return cached data
        return cached;
      }

      // Cache is stale - invalidate it
      console.warn('[cache] Stale cache detected, invalidating:', conversationId);
      await invalidateCache(conversationId);
    } else {
      // No messages in DB but cache has data - cache is stale
      await invalidateCache(conversationId);
    }
  }

  // 3. Cache miss or stale - load from Supabase
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

  // 4. Populate cache for next request (fire-and-forget)
  cacheMessages(conversationId, messages).catch(() => {
    // Silent failure - caching is optional
  });

  return messages;
}
