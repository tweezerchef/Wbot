/**
 * Tests for conversations.ts
 *
 * Tests the conversation management CRUD operations.
 * Mocks Supabase client to test function logic without database.
 */

/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase module before importing the functions
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import {
  createConversation,
  getMostRecentConversation,
  loadMessages,
  touchConversation,
} from '../conversations';
import { supabase } from '../supabase';

// Type helper for mocking Supabase query builder
interface MockQueryBuilder {
  insert: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
}

// Create a chainable mock query builder
function createMockQueryBuilder(): MockQueryBuilder {
  const builder: MockQueryBuilder = {
    insert: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    update: vi.fn(),
  };

  // Make methods chainable
  builder.insert.mockReturnValue(builder);
  builder.select.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.order.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);

  return builder;
}

describe('conversations', () => {
  let mockBuilder: MockQueryBuilder;

  beforeEach(() => {
    vi.clearAllMocks();
    mockBuilder = createMockQueryBuilder();
    vi.mocked(supabase.from).mockReturnValue(
      mockBuilder as unknown as ReturnType<typeof supabase.from>
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('createConversation', () => {
    it('creates a conversation with correct user_id', async () => {
      const mockId = 'test-conv-123';
      mockBuilder.single.mockResolvedValue({ data: { id: mockId }, error: null });

      const result = await createConversation('user-123');

      expect(supabase.from).toHaveBeenCalledWith('conversations');
      expect(mockBuilder.insert).toHaveBeenCalledWith({ user_id: 'user-123' });
      expect(mockBuilder.select).toHaveBeenCalledWith('id');
      expect(mockBuilder.single).toHaveBeenCalled();
      expect(result).toBe(mockId);
    });

    it('returns valid UUID', async () => {
      const mockId = '550e8400-e29b-41d4-a716-446655440000';
      mockBuilder.single.mockResolvedValue({ data: { id: mockId }, error: null });

      const result = await createConversation('user-123');

      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('throws error when Supabase fails', async () => {
      const mockError = new Error('Database error');
      mockBuilder.single.mockResolvedValue({ data: null, error: mockError });

      await expect(createConversation('user-123')).rejects.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getMostRecentConversation', () => {
    it('returns most recent conversation by updated_at', async () => {
      const mockId = 'recent-conv-123';
      mockBuilder.maybeSingle.mockResolvedValue({ data: { id: mockId }, error: null });

      const result = await getMostRecentConversation('user-123');

      expect(supabase.from).toHaveBeenCalledWith('conversations');
      expect(mockBuilder.select).toHaveBeenCalledWith('id');
      expect(mockBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockBuilder.order).toHaveBeenCalledWith('updated_at', { ascending: false });
      expect(mockBuilder.limit).toHaveBeenCalledWith(1);
      expect(result).toBe(mockId);
    });

    it('returns null when no conversations exist', async () => {
      mockBuilder.maybeSingle.mockResolvedValue({ data: null, error: null });

      const result = await getMostRecentConversation('user-123');

      expect(result).toBeNull();
    });

    it('returns null on error (graceful handling)', async () => {
      const mockError = new Error('Database error');
      mockBuilder.maybeSingle.mockResolvedValue({ data: null, error: mockError });

      const result = await getMostRecentConversation('user-123');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('loadMessages', () => {
    it('loads messages in chronological order', async () => {
      const mockMessages = [
        { id: 'msg-1', role: 'user', content: 'Hello', created_at: '2025-01-01T10:00:00Z' },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hi there!',
          created_at: '2025-01-01T10:01:00Z',
        },
      ];
      mockBuilder.order.mockResolvedValue({ data: mockMessages, error: null });

      const result = await loadMessages('conv-123');

      expect(supabase.from).toHaveBeenCalledWith('messages');
      expect(mockBuilder.select).toHaveBeenCalledWith('id, role, content, created_at');
      expect(mockBuilder.eq).toHaveBeenCalledWith('conversation_id', 'conv-123');
      expect(mockBuilder.order).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(result).toHaveLength(2);
    });

    it('transforms database rows to Message objects', async () => {
      const mockMessages = [
        { id: 'msg-1', role: 'user', content: 'Hello', created_at: '2025-01-01T10:00:00Z' },
      ];
      mockBuilder.order.mockResolvedValue({ data: mockMessages, error: null });

      const result = await loadMessages('conv-123');

      expect(result[0]).toEqual({
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        createdAt: expect.any(Date),
      });
    });

    it('handles empty conversation', async () => {
      mockBuilder.order.mockResolvedValue({ data: [], error: null });

      const result = await loadMessages('conv-123');

      expect(result).toEqual([]);
    });

    it('throws error on database failure', async () => {
      const mockError = new Error('Database error');
      mockBuilder.order.mockResolvedValue({ data: null, error: mockError });

      await expect(loadMessages('conv-123')).rejects.toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    it('handles null created_at by using current date', async () => {
      const mockMessages = [{ id: 'msg-1', role: 'user', content: 'Hello', created_at: null }];
      mockBuilder.order.mockResolvedValue({ data: mockMessages, error: null });

      const result = await loadMessages('conv-123');

      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('maps role types correctly', async () => {
      const mockMessages = [
        { id: 'msg-1', role: 'user', content: 'Hello', created_at: '2025-01-01T10:00:00Z' },
        { id: 'msg-2', role: 'assistant', content: 'Hi', created_at: '2025-01-01T10:01:00Z' },
        { id: 'msg-3', role: 'system', content: 'System', created_at: '2025-01-01T10:02:00Z' },
      ];
      mockBuilder.order.mockResolvedValue({ data: mockMessages, error: null });

      const result = await loadMessages('conv-123');

      expect(result[0].role).toBe('user');
      expect(result[1].role).toBe('assistant');
      expect(result[2].role).toBe('system');
    });
  });

  describe('touchConversation', () => {
    it('updates updated_at timestamp', async () => {
      mockBuilder.eq.mockResolvedValue({ error: null });

      await touchConversation('conv-123');

      expect(supabase.from).toHaveBeenCalledWith('conversations');
      expect(mockBuilder.update).toHaveBeenCalledWith({
        updated_at: expect.any(String),
      });
      expect(mockBuilder.eq).toHaveBeenCalledWith('id', 'conv-123');
    });

    it('handles error gracefully (does not throw)', async () => {
      const mockError = new Error('Database error');
      mockBuilder.eq.mockResolvedValue({ error: mockError });

      // Should not throw
      await expect(touchConversation('conv-123')).resolves.toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });

    it('uses ISO string format for timestamp', async () => {
      mockBuilder.eq.mockResolvedValue({ error: null });

      await touchConversation('conv-123');

      const updateCall = mockBuilder.update.mock.calls[0][0];
      // ISO string format check
      expect(updateCall.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
