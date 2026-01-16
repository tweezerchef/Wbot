/**
 * Tests for server-side conversation functions with Redis caching.
 *
 * These tests verify:
 * - getMostRecentConversation server function
 * - loadMessagesWithCache with TTL-based cache-first strategy
 * - Immediate return on cache hit (no DB validation)
 * - Cache population after database reads
 * - Fallback to Supabase when cache misses
 */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-empty-function */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Message } from '../ai-client';
import { getMostRecentConversation, loadMessagesWithCache } from '../conversations.server';
import { cacheMessages, getCachedMessages } from '../redis';

// Mock redis module before importing conversations.server
vi.mock('../redis', () => ({
  getCachedMessages: vi.fn(),
  cacheMessages: vi.fn(),
}));

// Mock Supabase client type
interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>;
}

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
}

function createMockQueryBuilder(): MockQueryBuilder {
  const builder: MockQueryBuilder = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
  };

  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);

  return builder;
}

function createMockSupabaseClient(): MockSupabaseClient {
  return {
    from: vi.fn(),
  };
}

describe('conversations.server', () => {
  let mockClient: MockSupabaseClient;
  let mockBuilder: MockQueryBuilder;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = createMockSupabaseClient();
    mockBuilder = createMockQueryBuilder();
    mockClient.from.mockReturnValue(mockBuilder);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Default mock for cacheMessages - returns Promise for .catch() calls
    vi.mocked(cacheMessages).mockResolvedValue();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getMostRecentConversation', () => {
    it('returns conversation ID for user', async () => {
      const mockId = 'conv-123';
      mockBuilder.maybeSingle.mockResolvedValue({ data: { id: mockId }, error: null });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getMostRecentConversation('user-123', mockClient as any);

      expect(mockClient.from).toHaveBeenCalledWith('conversations');
      expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockBuilder.order).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(result).toBe(mockId);
    });

    it('returns null when no conversations exist', async () => {
      mockBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getMostRecentConversation('user-123', mockClient as any);

      expect(result).toBeNull();
    });

    it('returns null on error', async () => {
      mockBuilder.maybeSingle.mockResolvedValue({
        data: null,
        error: new Error('DB error'),
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await getMostRecentConversation('user-123', mockClient as any);

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('loadMessagesWithCache', () => {
    it('returns cached messages immediately without DB query', async () => {
      const cachedTimestamp = new Date('2025-01-10T12:00:00Z');
      const cachedMessages: Message[] = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Cached message',
          createdAt: cachedTimestamp,
        },
      ];
      vi.mocked(getCachedMessages).mockResolvedValue(cachedMessages);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await loadMessagesWithCache('conv-123', mockClient as any);

      expect(getCachedMessages).toHaveBeenCalledWith('conv-123');
      // No database query should be made on cache hit
      expect(mockClient.from).not.toHaveBeenCalled();
      expect(result).toEqual(cachedMessages);
    });

    it('falls back to Supabase on cache miss', async () => {
      vi.mocked(getCachedMessages).mockResolvedValue(null);
      vi.mocked(cacheMessages).mockResolvedValue(); // Must return Promise for .catch()

      const dbMessages = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'DB message',
          created_at: '2025-01-10T12:00:00Z',
        },
      ];
      mockBuilder.order.mockResolvedValue({ data: dbMessages, error: null });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await loadMessagesWithCache('conv-123', mockClient as any);

      expect(getCachedMessages).toHaveBeenCalledWith('conv-123');
      expect(mockClient.from).toHaveBeenCalledWith('messages');
      expect(mockBuilder.eq).toHaveBeenCalledWith('conversation_id', 'conv-123');
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe('DB message');
    });

    it('populates cache after loading from database', async () => {
      vi.mocked(getCachedMessages).mockResolvedValue(null);
      vi.mocked(cacheMessages).mockResolvedValue();

      const dbMessages = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'DB message',
          created_at: '2025-01-10T12:00:00Z',
        },
      ];
      mockBuilder.order.mockResolvedValue({ data: dbMessages, error: null });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await loadMessagesWithCache('conv-123', mockClient as any);

      // Wait for fire-and-forget cache population
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(cacheMessages).toHaveBeenCalledWith('conv-123', expect.any(Array));
    });

    it('transforms database rows to Message format', async () => {
      vi.mocked(getCachedMessages).mockResolvedValue(null);

      const dbMessages = [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Hello!',
          created_at: '2025-01-10T12:00:00Z',
        },
      ];
      mockBuilder.order.mockResolvedValue({ data: dbMessages, error: null });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await loadMessagesWithCache('conv-123', mockClient as any);

      expect(result[0]).toEqual({
        id: 'msg-1',
        role: 'assistant',
        content: 'Hello!',
        createdAt: expect.any(Date),
      });
      expect(result[0].createdAt).toEqual(new Date('2025-01-10T12:00:00Z'));
    });

    it('handles null created_at with current date', async () => {
      vi.mocked(getCachedMessages).mockResolvedValue(null);

      const dbMessages = [
        {
          id: 'msg-1',
          role: 'user',
          content: 'No timestamp',
          created_at: null,
        },
      ];
      mockBuilder.order.mockResolvedValue({ data: dbMessages, error: null });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await loadMessagesWithCache('conv-123', mockClient as any);

      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('throws on Supabase error', async () => {
      vi.mocked(getCachedMessages).mockResolvedValue(null);
      mockBuilder.order.mockResolvedValue({
        data: null,
        error: new Error('DB error'),
      });

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        loadMessagesWithCache('conv-123', mockClient as any)
      ).rejects.toThrow();
    });

    it('returns empty array for conversation with no messages', async () => {
      vi.mocked(getCachedMessages).mockResolvedValue(null);
      mockBuilder.order.mockResolvedValue({ data: [], error: null });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await loadMessagesWithCache('conv-123', mockClient as any);

      expect(result).toEqual([]);
    });
  });

  describe('cache-first strategy', () => {
    it('returns immediately on cache hit without any DB query', async () => {
      const cachedTimestamp = new Date('2025-01-10T12:00:00Z');
      const cachedMessages: Message[] = [
        { id: 'msg-1', role: 'user', content: 'Cached', createdAt: cachedTimestamp },
        { id: 'msg-2', role: 'assistant', content: 'Also cached', createdAt: cachedTimestamp },
      ];
      vi.mocked(getCachedMessages).mockResolvedValue(cachedMessages);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await loadMessagesWithCache('conv-123', mockClient as any);

      expect(result).toHaveLength(2);
      // TTL-based caching: no DB query on cache hit
      expect(mockClient.from).not.toHaveBeenCalled();
    });

    it('queries database when cache returns null', async () => {
      vi.mocked(getCachedMessages).mockResolvedValue(null);
      mockBuilder.order.mockResolvedValue({ data: [], error: null });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await loadMessagesWithCache('conv-123', mockClient as any);

      expect(mockClient.from).toHaveBeenCalledWith('messages');
    });

    it('queries database when cache returns empty array as null', async () => {
      // Note: getCachedMessages returns null on cache miss, not empty array
      vi.mocked(getCachedMessages).mockResolvedValue(null);
      mockBuilder.order.mockResolvedValue({ data: [], error: null });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await loadMessagesWithCache('conv-123', mockClient as any);

      expect(mockClient.from).toHaveBeenCalled();
    });
  });

  describe('message ordering', () => {
    it('orders messages by created_at ascending', async () => {
      vi.mocked(getCachedMessages).mockResolvedValue(null);
      mockBuilder.order.mockResolvedValue({ data: [], error: null });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await loadMessagesWithCache('conv-123', mockClient as any);

      expect(mockBuilder.order).toHaveBeenCalledWith('created_at', { ascending: true });
    });
  });
});
