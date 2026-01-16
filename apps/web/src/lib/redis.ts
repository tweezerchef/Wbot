/**
 * Redis client for server-side message caching.
 *
 * This module provides a shared Redis connection for caching conversation
 * messages. It's designed for use in TanStack Start server functions only.
 *
 * Cache key pattern: conv_msgs:{conversation_id}
 * TTL: 24 hours (matches AI backend)
 *
 * The AI backend writes to this cache (write-through pattern) and the
 * web frontend reads from it (cache-first pattern).
 */

import { createClient, type RedisClientType } from 'redis';

import type { Message } from './ai-client';

// Redis client singleton (lazy initialization)
let redisClient: RedisClientType | null = null;
let connectionPromise: Promise<RedisClientType | null> | null = null;

// TTL must match the AI backend (24 hours)
const MESSAGES_TTL_SECONDS = 24 * 60 * 60;

/**
 * Gets or creates the Redis client connection.
 *
 * Uses lazy initialization with connection pooling.
 * Returns null if Redis is not configured or unavailable.
 */
async function getRedisClient(): Promise<RedisClientType | null> {
  const rawRedisUrl = process.env.REDIS_URI ?? process.env.REDIS_URL;
  const redisUrl = normalizeRedisUrl(rawRedisUrl);

  if (!redisUrl) {
    // Redis not configured - gracefully skip caching
    return null;
  }

  // Return existing connected client
  if (redisClient?.isOpen) {
    return redisClient;
  }

  // Wait for pending connection
  if (connectionPromise) {
    return connectionPromise;
  }

  // Create new connection
  connectionPromise = (async () => {
    try {
      const client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 2000, // 2 second timeout
          reconnectStrategy: (retries) => {
            // Stop reconnecting after 3 attempts
            if (retries > 3) {
              return false;
            }
            // Exponential backoff: 100ms, 200ms, 400ms
            return Math.min(retries * 100, 1000);
          },
        },
      });

      // Handle connection errors silently (caching is optional)
      client.on('error', (err: Error) => {
        console.error('[redis] Connection error:', err.message);
      });

      await client.connect();
      redisClient = client as RedisClientType;
      return redisClient;
    } catch (error) {
      console.error('[redis] Failed to connect:', error);
      connectionPromise = null;
      return null;
    }
  })();

  return connectionPromise;
}

function normalizeRedisUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

/**
 * Cache key for conversation messages.
 */
function messagesKey(conversationId: string): string {
  return `conv_msgs:${conversationId}`;
}

/**
 * Message shape stored in Redis cache.
 *
 * Slightly different from frontend Message type:
 * - created_at is a string (ISO format) not Date
 */
interface CachedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

/**
 * Retrieves cached messages for a conversation.
 *
 * @param conversationId - The conversation UUID
 * @returns Array of messages or null if not in cache
 */
export async function getCachedMessages(conversationId: string): Promise<Message[] | null> {
  try {
    const client = await getRedisClient();
    if (!client) {
      return null;
    }

    const data = await client.get(messagesKey(conversationId));
    if (!data || typeof data !== 'string') {
      return null;
    }

    const cached = JSON.parse(data) as CachedMessage[];

    // Convert cached format to frontend Message format
    return cached.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: new Date(msg.created_at),
    }));
  } catch (error) {
    console.error('[redis] Error getting cached messages:', error);
    return null;
  }
}

/**
 * Caches messages for a conversation.
 *
 * Called after loading messages from Supabase to populate the cache.
 *
 * @param conversationId - The conversation UUID
 * @param messages - Array of messages to cache
 */
export async function cacheMessages(conversationId: string, messages: Message[]): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) {
      return;
    }

    // Convert to cache format (Date -> ISO string)
    const cached: CachedMessage[] = messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      created_at: msg.createdAt.toISOString(),
    }));

    await client.setEx(messagesKey(conversationId), MESSAGES_TTL_SECONDS, JSON.stringify(cached));
  } catch (error) {
    console.error('[redis] Error caching messages:', error);
    // Silent failure - caching is optional
  }
}

/**
 * Invalidates cached messages for a conversation.
 *
 * Call this when messages are deleted or the conversation is removed.
 *
 * @param conversationId - The conversation UUID
 */
export async function invalidateCache(conversationId: string): Promise<void> {
  try {
    const client = await getRedisClient();
    if (!client) {
      return;
    }

    await client.del(messagesKey(conversationId));
  } catch (error) {
    console.error('[redis] Error invalidating cache:', error);
  }
}
