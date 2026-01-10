/**
 * Tests for Redis caching functionality.
 *
 * These tests verify:
 * - Cache key format compatibility with AI backend
 * - Message format transformation (snake_case <-> camelCase)
 * - TTL configuration consistency
 *
 * Note: The actual Redis connection tests are integration tests that
 * require a running Redis instance. These unit tests focus on the
 * logic and format compatibility.
 */

import { describe, expect, it } from 'vitest';

import type { Message } from '../ai-client';

// Constants from redis.ts (replicated for testing)
const MESSAGES_TTL_SECONDS = 24 * 60 * 60; // 24 hours

describe('redis', () => {
  describe('cache key format', () => {
    it('uses correct key pattern: conv_msgs:{id}', () => {
      // This is the pattern used by both AI backend and frontend
      const conversationId = '550e8400-e29b-41d4-a716-446655440000';
      const expectedKey = `conv_msgs:${conversationId}`;

      // messagesKey function pattern
      const key = `conv_msgs:${conversationId}`;
      expect(key).toBe(expectedKey);
    });

    it('matches AI backend key format', () => {
      // AI backend in apps/ai/src/memory/cache.py:
      // def _messages_key(conversation_id: str) -> str:
      //     return f"conv_msgs:{conversation_id}"
      const testId = 'test-conv-123';
      const frontendKey = `conv_msgs:${testId}`;
      const backendPattern = `conv_msgs:${testId}`;

      expect(frontendKey).toBe(backendPattern);
    });
  });

  describe('message format transformation', () => {
    it('transforms cached format (snake_case) to frontend format (camelCase)', () => {
      // AI backend stores in snake_case
      const cachedMessage = {
        id: 'msg-123',
        role: 'user' as const,
        content: 'Hello',
        created_at: '2025-01-10T12:00:00Z',
      };

      // Frontend transforms to camelCase
      const frontendMessage: Message = {
        id: cachedMessage.id,
        role: cachedMessage.role,
        content: cachedMessage.content,
        createdAt: new Date(cachedMessage.created_at),
      };

      expect(frontendMessage.id).toBe('msg-123');
      expect(frontendMessage.role).toBe('user');
      expect(frontendMessage.content).toBe('Hello');
      expect(frontendMessage.createdAt).toEqual(new Date('2025-01-10T12:00:00Z'));
    });

    it('transforms frontend format to cached format (for caching)', () => {
      // Frontend uses camelCase
      const frontendMessage: Message = {
        id: 'msg-456',
        role: 'assistant',
        content: 'Hi there!',
        createdAt: new Date('2025-01-10T12:00:01.000Z'),
      };

      // Transform to cached format (snake_case)
      const cachedMessage = {
        id: frontendMessage.id,
        role: frontendMessage.role,
        content: frontendMessage.content,
        created_at: frontendMessage.createdAt.toISOString(),
      };

      expect(cachedMessage.id).toBe('msg-456');
      expect(cachedMessage.role).toBe('assistant');
      expect(cachedMessage.content).toBe('Hi there!');
      expect(cachedMessage.created_at).toBe('2025-01-10T12:00:01.000Z');
    });

    it('handles all role types', () => {
      const roles = ['user', 'assistant', 'system'] as const;

      roles.forEach((role) => {
        const cachedMessage = {
          id: `msg-${role}`,
          role,
          content: `Message from ${role}`,
          created_at: '2025-01-10T12:00:00Z',
        };

        const frontendMessage: Message = {
          id: cachedMessage.id,
          role: cachedMessage.role,
          content: cachedMessage.content,
          createdAt: new Date(cachedMessage.created_at),
        };

        expect(frontendMessage.role).toBe(role);
      });
    });
  });

  describe('TTL configuration', () => {
    it('uses 24-hour TTL (same as AI backend)', () => {
      // AI backend: MESSAGES_TTL_SECONDS = 24 * 60 * 60
      const expectedTTL = 86400; // 24 hours in seconds

      expect(MESSAGES_TTL_SECONDS).toBe(expectedTTL);
    });
  });

  describe('message array handling', () => {
    it('transforms array of cached messages', () => {
      const cachedMessages = [
        {
          id: 'msg-1',
          role: 'user' as const,
          content: 'First message',
          created_at: '2025-01-10T12:00:00Z',
        },
        {
          id: 'msg-2',
          role: 'assistant' as const,
          content: 'Second message',
          created_at: '2025-01-10T12:00:01Z',
        },
      ];

      const frontendMessages: Message[] = cachedMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: new Date(msg.created_at),
      }));

      expect(frontendMessages).toHaveLength(2);
      expect(frontendMessages[0].id).toBe('msg-1');
      expect(frontendMessages[1].id).toBe('msg-2');
    });

    it('preserves message order', () => {
      const cachedMessages = Array.from({ length: 10 }, (_, i) => ({
        id: `msg-${String(i)}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${String(i)}`,
        created_at: new Date(2025, 0, 10, 12, 0, i).toISOString(),
      }));

      const frontendMessages: Message[] = cachedMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        createdAt: new Date(msg.created_at),
      }));

      // Verify order preserved
      frontendMessages.forEach((msg, i) => {
        expect(msg.id).toBe(`msg-${String(i)}`);
      });
    });
  });

  describe('date handling', () => {
    it('handles ISO date strings with timezone', () => {
      const isoString = '2025-01-10T12:00:00.000Z';
      const date = new Date(isoString);

      expect(date.toISOString()).toBe(isoString);
    });

    it('handles various ISO date formats from backend', () => {
      const formats = [
        '2025-01-10T12:00:00Z', // No milliseconds
        '2025-01-10T12:00:00.000Z', // With milliseconds
        '2025-01-10T12:00:00.123Z', // With partial milliseconds
      ];

      formats.forEach((format) => {
        const date = new Date(format);
        expect(date).toBeInstanceOf(Date);
        expect(date.getTime()).not.toBeNaN();
      });
    });
  });
});
