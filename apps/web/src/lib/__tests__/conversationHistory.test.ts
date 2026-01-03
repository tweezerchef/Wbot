/**
 * Tests for conversationHistory.ts
 *
 * Tests conversation history fetching, search, and display helpers.
 */

/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-empty-function */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase module before importing the functions
vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

import {
  getConversationsWithPreview,
  searchConversationsKeyword,
  searchConversations,
  getDisplayTitle,
  getMessagePreview,
  getRelativeTime,
  type ConversationPreview,
  type KeywordSearchResult,
} from '../conversationHistory';
import { supabase } from '../supabase';

// Sample valid preview data
const createMockPreview = (overrides: Partial<ConversationPreview> = {}): ConversationPreview => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: null,
  last_message_content: 'Hello, how can I help?',
  last_message_role: 'assistant',
  last_message_at: '2025-01-01T10:00:00Z',
  created_at: '2025-01-01T09:00:00Z',
  updated_at: '2025-01-01T10:00:00Z',
  message_count: 5,
  ...overrides,
});

// Sample keyword search result
const createMockSearchResult = (
  overrides: Partial<KeywordSearchResult> = {}
): KeywordSearchResult => ({
  conversation_id: '550e8400-e29b-41d4-a716-446655440000',
  conversation_title: 'Test Conversation',
  message_id: '550e8400-e29b-41d4-a716-446655440001',
  message_content: 'This is a test message with some content',
  message_role: 'user',
  created_at: '2025-01-01T10:00:00Z',
  rank: 0.8,
  ...overrides,
});

describe('conversationHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('getConversationsWithPreview', () => {
    it('returns empty array when no session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await getConversationsWithPreview();

      expect(result).toEqual([]);
    });

    it('calls RPC with correct parameters', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null });

      await getConversationsWithPreview(10, 5);

      expect(supabase.rpc).toHaveBeenCalledWith('get_conversations_with_preview', {
        p_user_id: 'user-123',
        p_limit: 10,
        p_offset: 5,
      });
    });

    it('returns validated preview data', async () => {
      const mockData = [createMockPreview()];
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockData, error: null });

      const result = await getConversationsWithPreview();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockData[0].id);
    });

    it('returns empty array on RPC error', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: new Error('RPC error'),
      });

      const result = await getConversationsWithPreview();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it('returns empty array on invalid data (Zod validation)', async () => {
      const invalidData = [{ invalid: 'data' }]; // Missing required fields
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: invalidData, error: null });

      const result = await getConversationsWithPreview();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it('uses default limit of 6', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null });

      await getConversationsWithPreview();

      expect(supabase.rpc).toHaveBeenCalledWith(
        'get_conversations_with_preview',
        expect.objectContaining({ p_limit: 6, p_offset: 0 })
      );
    });
  });

  describe('searchConversationsKeyword', () => {
    it('returns empty array when no session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const result = await searchConversationsKeyword('test');

      expect(result).toEqual([]);
    });

    it('returns empty array for empty query', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);

      const result = await searchConversationsKeyword('   ');

      expect(result).toEqual([]);
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('calls RPC with correct parameters', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null });

      await searchConversationsKeyword('test query', 20);

      expect(supabase.rpc).toHaveBeenCalledWith('search_conversations_keyword', {
        p_user_id: 'user-123',
        p_query: 'test query',
        p_limit: 20,
      });
    });

    it('returns validated search results', async () => {
      const mockResults = [createMockSearchResult()];
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockResults, error: null });

      const result = await searchConversationsKeyword('test');

      expect(result).toHaveLength(1);
      expect(result[0].message_content).toBe(mockResults[0].message_content);
    });

    it('returns empty array on error', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: new Error('Search error'),
      });

      const result = await searchConversationsKeyword('test');

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('searchConversations', () => {
    it('returns empty array for empty query', async () => {
      const result = await searchConversations('   ');

      expect(result).toEqual([]);
    });

    it('transforms keyword results to unified format', async () => {
      const mockResults = [createMockSearchResult()];
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockResults, error: null });

      const result = await searchConversations('test');

      expect(result[0]).toMatchObject({
        type: 'keyword',
        conversationId: mockResults[0].conversation_id,
        conversationTitle: mockResults[0].conversation_title,
        matchedContent: mockResults[0].message_content,
        score: mockResults[0].rank,
      });
      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('deduplicates by conversation (keeps highest score)', async () => {
      const mockResults = [
        createMockSearchResult({ rank: 0.5 }),
        createMockSearchResult({ rank: 0.9 }), // Same conversation, higher rank
      ];
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockResults, error: null });

      const result = await searchConversations('test');

      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(0.9); // Higher score kept
    });

    it('truncates preview to 100 chars with ellipsis', async () => {
      const longContent = 'A'.repeat(150);
      const mockResults = [createMockSearchResult({ message_content: longContent })];
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockResults, error: null });

      const result = await searchConversations('test');

      expect(result[0].preview.length).toBeLessThanOrEqual(103); // 100 + '...'
      expect(result[0].preview.endsWith('...')).toBe(true);
    });

    it('respects limit parameter', async () => {
      const mockResults = [
        createMockSearchResult({
          conversation_id: '550e8400-e29b-41d4-a716-446655440001',
          rank: 0.9,
        }),
        createMockSearchResult({
          conversation_id: '550e8400-e29b-41d4-a716-446655440002',
          rank: 0.8,
        }),
        createMockSearchResult({
          conversation_id: '550e8400-e29b-41d4-a716-446655440003',
          rank: 0.7,
        }),
      ];
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      } as unknown as Awaited<ReturnType<typeof supabase.auth.getSession>>);
      vi.mocked(supabase.rpc).mockResolvedValue({ data: mockResults, error: null });

      const result = await searchConversations('test', 2);

      expect(result).toHaveLength(2);
    });
  });

  describe('getDisplayTitle', () => {
    it('returns stored title if available', () => {
      const preview = createMockPreview({ title: 'My Conversation' });

      expect(getDisplayTitle(preview)).toBe('My Conversation');
    });

    it('returns truncated message if no title', () => {
      const preview = createMockPreview({
        title: null,
        last_message_content: 'This is the message content',
      });

      expect(getDisplayTitle(preview)).toBe('This is the message content');
    });

    it('truncates long message to 40 chars with ellipsis', () => {
      const preview = createMockPreview({
        title: null,
        last_message_content: 'A'.repeat(50),
      });

      const result = getDisplayTitle(preview);

      expect(result.length).toBe(40);
      expect(result.endsWith('...')).toBe(true);
    });

    it('returns default for new conversation', () => {
      const preview = createMockPreview({
        title: null,
        last_message_content: null,
      });

      expect(getDisplayTitle(preview)).toBe('New Conversation');
    });
  });

  describe('getMessagePreview', () => {
    it('returns "No messages yet" when empty', () => {
      const preview = createMockPreview({ last_message_content: null });

      expect(getMessagePreview(preview)).toBe('No messages yet');
    });

    it('prefixes user messages with "You: "', () => {
      const preview = createMockPreview({
        last_message_role: 'user',
        last_message_content: 'Hello',
      });

      expect(getMessagePreview(preview)).toBe('You: Hello');
    });

    it('does not prefix assistant messages', () => {
      const preview = createMockPreview({
        last_message_role: 'assistant',
        last_message_content: 'Hello',
      });

      expect(getMessagePreview(preview)).toBe('Hello');
    });

    it('truncates long messages to 60 chars', () => {
      const preview = createMockPreview({
        last_message_role: 'assistant',
        last_message_content: 'A'.repeat(100),
      });

      const result = getMessagePreview(preview);

      expect(result.length).toBe(60);
      expect(result.endsWith('...')).toBe(true);
    });
  });

  describe('getRelativeTime', () => {
    it('returns empty string for null input', () => {
      expect(getRelativeTime(null)).toBe('');
    });

    it('returns "Just now" for very recent time', () => {
      const now = new Date();
      const result = getRelativeTime(now.toISOString());

      expect(result).toBe('Just now');
    });

    it('returns minutes ago for recent times', () => {
      const date = new Date();
      date.setMinutes(date.getMinutes() - 15);

      const result = getRelativeTime(date.toISOString());

      expect(result).toMatch(/^\d+m ago$/);
    });

    it('returns hours ago for same-day times', () => {
      const date = new Date();
      date.setHours(date.getHours() - 3);

      const result = getRelativeTime(date.toISOString());

      expect(result).toMatch(/^\d+h ago$/);
    });

    it('returns "Yesterday" for previous day', () => {
      const date = new Date();
      date.setDate(date.getDate() - 1);

      const result = getRelativeTime(date.toISOString());

      expect(result).toBe('Yesterday');
    });

    it('returns days ago for recent week', () => {
      const date = new Date();
      date.setDate(date.getDate() - 4);

      const result = getRelativeTime(date.toISOString());

      expect(result).toMatch(/^\d+d ago$/);
    });

    it('returns locale date string for older dates', () => {
      const date = new Date();
      date.setDate(date.getDate() - 30);

      const result = getRelativeTime(date.toISOString());

      // Should be a locale date string, not "Xd ago"
      expect(result).not.toMatch(/ago$/);
    });
  });
});
