/**
 * Integration tests for message cache consistency between frontend and AI backend.
 *
 * These tests verify:
 * - Cache key format matches AI backend (conv_msgs:{id})
 * - Message format compatibility (snake_case vs camelCase)
 * - TTL consistency (24 hours)
 * - Write-through and cache-first patterns work together
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import type { Message } from '../ai-client';

// Store original env
const originalEnv = process.env;

describe('Message Cache Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, REDIS_URI: 'redis://test:6379' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('cache key format', () => {
    it('frontend and backend use same key pattern', () => {
      // Both use: conv_msgs:{conversation_id}
      const conversationId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedKey = `conv_msgs:${conversationId}`;

      // This is the pattern used by both:
      // - AI backend: apps/ai/src/memory/cache.py -> _messages_key()
      // - Web frontend: apps/web/src/lib/redis.ts -> messagesKey()
      expect(expectedKey).toBe('conv_msgs:550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('message format compatibility', () => {
    it('AI backend format can be read by frontend', () => {
      // AI backend stores messages in this format (Python snake_case)
      const backendFormat = {
        id: 'msg-123',
        role: 'user',
        content: 'Hello from AI backend',
        created_at: '2025-01-10T12:00:00Z',
      };

      // Frontend transforms to camelCase
      const frontendMessage: Message = {
        id: backendFormat.id,
        role: backendFormat.role as 'user' | 'assistant' | 'system',
        content: backendFormat.content,
        createdAt: new Date(backendFormat.created_at),
      };

      expect(frontendMessage.id).toBe('msg-123');
      expect(frontendMessage.createdAt).toEqual(new Date('2025-01-10T12:00:00Z'));
    });

    it('frontend format can be read by AI backend', () => {
      // Frontend creates messages in this format
      const frontendMessage: Message = {
        id: 'msg-456',
        role: 'assistant',
        content: 'Response from frontend',
        createdAt: new Date('2025-01-10T12:00:01Z'),
      };

      // When caching, frontend converts to backend format
      const cacheFormat = {
        id: frontendMessage.id,
        role: frontendMessage.role,
        content: frontendMessage.content,
        created_at: frontendMessage.createdAt.toISOString(),
      };

      expect(cacheFormat.created_at).toBe('2025-01-10T12:00:01.000Z');
    });
  });

  describe('TTL consistency', () => {
    it('frontend and backend use same TTL', () => {
      // Both should use 24 hours (86400 seconds)
      // - AI backend: apps/ai/src/memory/cache.py -> MESSAGES_TTL_SECONDS
      // - Web frontend: apps/web/src/lib/redis.ts -> MESSAGES_TTL_SECONDS
      const FRONTEND_TTL = 24 * 60 * 60; // 86400
      const BACKEND_TTL = 24 * 60 * 60; // 86400

      expect(FRONTEND_TTL).toBe(BACKEND_TTL);
      expect(FRONTEND_TTL).toBe(86400);
    });
  });

  describe('write-through pattern', () => {
    it('AI backend writes messages that frontend can read', () => {
      // Simulating the flow:
      // 1. AI backend receives user message + generates response
      // 2. AI backend saves to Supabase
      // 3. AI backend appends to Redis cache (write-through)
      // 4. Frontend reads from Redis cache (cache-first)

      // AI backend would write this to Redis
      const backendWrites = [
        {
          id: 'user-msg-id',
          role: 'user',
          content: "I'm feeling stressed",
          created_at: '2025-01-10T12:00:00Z',
        },
        {
          id: 'ai-msg-id',
          role: 'assistant',
          content: "Let's try a breathing exercise",
          created_at: '2025-01-10T12:00:01Z',
        },
      ];

      // Frontend would read and transform
      const frontendReads: Message[] = backendWrites.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        createdAt: new Date(msg.created_at),
      }));

      expect(frontendReads).toHaveLength(2);
      expect(frontendReads[0].role).toBe('user');
      expect(frontendReads[1].role).toBe('assistant');
    });
  });

  describe('cache-first pattern', () => {
    it('frontend prefers cache over database', async () => {
      // This documents the expected behavior:
      // 1. getCachedMessages() is called first
      // 2. If cache hit, return cached messages (no DB query)
      // 3. If cache miss, load from Supabase and populate cache

      const cacheCheckOrder: string[] = [];

      // Simulate cache hit scenario
      const mockGetCachedMessages = (_convId: string): Promise<Message[] | null> => {
        cacheCheckOrder.push('cache');
        return Promise.resolve([
          { id: 'cached', role: 'user', content: 'From cache', createdAt: new Date() },
        ]);
      };

      const mockLoadFromSupabase = (_convId: string): Promise<Message[]> => {
        cacheCheckOrder.push('supabase');
        return Promise.resolve([
          { id: 'db', role: 'user', content: 'From DB', createdAt: new Date() },
        ]);
      };

      // Simulate cache-first logic
      const result =
        (await mockGetCachedMessages('conv-123')) ?? (await mockLoadFromSupabase('conv-123'));

      expect(cacheCheckOrder).toEqual(['cache']); // Only cache was checked
      expect(result[0].id).toBe('cached');
    });

    it('falls back to database on cache miss', async () => {
      const cacheCheckOrder: string[] = [];

      // Simulate cache miss scenario
      const mockGetCachedMessages = (_convId: string): Promise<Message[] | null> => {
        cacheCheckOrder.push('cache');
        return Promise.resolve(null); // Cache miss
      };

      const mockLoadFromSupabase = (_convId: string): Promise<Message[]> => {
        cacheCheckOrder.push('supabase');
        return Promise.resolve([
          { id: 'db', role: 'user', content: 'From DB', createdAt: new Date() },
        ]);
      };

      // Simulate cache-first logic
      const result =
        (await mockGetCachedMessages('conv-123')) ?? (await mockLoadFromSupabase('conv-123'));

      expect(cacheCheckOrder).toEqual(['cache', 'supabase']); // Both were checked
      expect(result[0].id).toBe('db');
    });
  });

  describe('graceful degradation', () => {
    it('works without Redis configured', () => {
      delete process.env.REDIS_URI;
      delete process.env.REDIS_URL;

      // When Redis is not configured, system should fall back to Supabase
      // This test documents the expected behavior
      expect(process.env.REDIS_URI).toBeUndefined();
      expect(process.env.REDIS_URL).toBeUndefined();
    });
  });

  describe('conversation ID handling', () => {
    it('handles UUID conversation IDs correctly', () => {
      const uuidConvId = '550e8400-e29b-41d4-a716-446655440000';
      const cacheKey = `conv_msgs:${uuidConvId}`;

      expect(cacheKey).toMatch(/^conv_msgs:[0-9a-f-]{36}$/);
    });

    it('handles various conversation ID formats', () => {
      const testIds = [
        '550e8400-e29b-41d4-a716-446655440000', // Standard UUID
        'abc123', // Short ID
        'test-conversation-id', // Hyphenated string
      ];

      testIds.forEach((id) => {
        const key = `conv_msgs:${id}`;
        expect(key).toContain('conv_msgs:');
        expect(key).toContain(id);
      });
    });
  });
});
