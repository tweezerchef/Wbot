/**
 * Conversation history helpers for the sidebar.
 *
 * Provides functions for fetching conversation lists with previews
 * and searching through conversation history.
 */

import { z } from 'zod';

import { supabase } from './supabase';

/* ----------------------------------------------------------------------------
   Types & Schemas
   ---------------------------------------------------------------------------- */

/** Schema for conversation preview data from RPC */
const conversationPreviewSchema = z.object({
  id: z.uuid(),
  title: z.string().nullable(),
  last_message_content: z.string().nullable(),
  last_message_role: z.string().nullable(),
  last_message_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  message_count: z.number(),
});

export type ConversationPreview = z.infer<typeof conversationPreviewSchema>;

/** Schema for keyword search results from RPC */
const keywordSearchResultSchema = z.object({
  conversation_id: z.uuid(),
  conversation_title: z.string().nullable(),
  message_id: z.uuid(),
  message_content: z.string(),
  message_role: z.string(),
  created_at: z.string(),
  rank: z.number(),
});

export type KeywordSearchResult = z.infer<typeof keywordSearchResultSchema>;

/** Combined search result for unified display */
export interface SearchResult {
  type: 'keyword' | 'semantic';
  conversationId: string;
  conversationTitle: string | null;
  preview: string;
  matchedContent: string;
  createdAt: Date;
  score: number;
}

/* ----------------------------------------------------------------------------
   Fetch Functions
   ---------------------------------------------------------------------------- */

/**
 * Fetches recent conversations with their last message preview.
 *
 * Used to populate the conversation history list in the sidebar.
 * Returns conversations ordered by most recent activity.
 *
 * @param limit - Maximum number of conversations to return (default 6)
 * @param offset - Number of conversations to skip for pagination
 * @returns Array of conversation previews
 */
export async function getConversationsWithPreview(
  limit = 6,
  offset = 0
): Promise<ConversationPreview[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return [];
  }

  const { data, error } = await supabase.rpc('get_conversations_with_preview', {
    p_user_id: session.user.id,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error('Failed to fetch conversations:', error);
    return [];
  }

  // Validate and parse the response
  const result = z.array(conversationPreviewSchema).safeParse(data);

  if (!result.success) {
    console.error('Invalid conversation data:', result.error);
    return [];
  }

  return result.data;
}

/**
 * Searches conversations using keyword (full-text) search.
 *
 * @param query - The search query text
 * @param limit - Maximum results to return
 * @returns Array of matching messages with conversation context
 */
export async function searchConversationsKeyword(
  query: string,
  limit = 10
): Promise<KeywordSearchResult[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !query.trim()) {
    return [];
  }

  const { data, error } = await supabase.rpc('search_conversations_keyword', {
    p_user_id: session.user.id,
    p_query: query,
    p_limit: limit,
  });

  if (error) {
    console.error('Keyword search failed:', error);
    return [];
  }

  const result = z.array(keywordSearchResultSchema).safeParse(data);

  if (!result.success) {
    console.error('Invalid search results:', result.error);
    return [];
  }

  return result.data;
}

/**
 * Combined search that returns unified results from keyword search.
 *
 * Note: Semantic search from frontend is not yet implemented as it requires
 * an AI backend endpoint to generate embeddings. For MVP, using keyword search only.
 *
 * @param query - The search query text
 * @param limit - Maximum total results
 * @returns Unified search results sorted by relevance
 */
export async function searchConversations(query: string, limit = 10): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }

  // For now, only keyword search is available from frontend
  const keywordResults = await searchConversationsKeyword(query, limit);

  const results: SearchResult[] = [];

  // Transform keyword results
  for (const kr of keywordResults) {
    results.push({
      type: 'keyword',
      conversationId: kr.conversation_id,
      conversationTitle: kr.conversation_title,
      preview: kr.message_content.slice(0, 100) + (kr.message_content.length > 100 ? '...' : ''),
      matchedContent: kr.message_content,
      createdAt: new Date(kr.created_at),
      score: kr.rank,
    });
  }

  // Deduplicate by conversation (keep highest scoring match per conversation)
  const seen = new Set<string>();
  return results
    .sort((a, b) => b.score - a.score)
    .filter((r) => {
      if (seen.has(r.conversationId)) {
        return false;
      }
      seen.add(r.conversationId);
      return true;
    })
    .slice(0, limit);
}

/* ----------------------------------------------------------------------------
   Display Helpers
   ---------------------------------------------------------------------------- */

/**
 * Generates a display title for a conversation.
 *
 * Uses the stored title if available, otherwise generates
 * a preview from the last message or a default.
 *
 * @param preview - The conversation preview object
 * @returns A display-ready title string
 */
export function getDisplayTitle(preview: ConversationPreview): string {
  if (preview.title) {
    return preview.title;
  }

  if (preview.last_message_content) {
    const content = preview.last_message_content;
    return content.length > 40 ? content.slice(0, 37) + '...' : content;
  }

  return 'New Conversation';
}

/**
 * Formats the last message preview for display.
 *
 * @param preview - The conversation preview object
 * @returns Formatted preview string with role prefix
 */
export function getMessagePreview(preview: ConversationPreview): string {
  if (!preview.last_message_content) {
    return 'No messages yet';
  }

  const role = preview.last_message_role === 'user' ? 'You: ' : '';
  const content = preview.last_message_content;
  const truncated = content.length > 60 ? content.slice(0, 57) + '...' : content;

  return role + truncated;
}

/**
 * Formats a relative time string for conversation timestamps.
 *
 * @param dateString - ISO date string
 * @returns Human-readable relative time (e.g., "2 hours ago", "Yesterday")
 */
export function getRelativeTime(dateString: string | null): string {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${String(diffMins)}m ago`;
  }
  if (diffHours < 24) {
    return `${String(diffHours)}h ago`;
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${String(diffDays)}d ago`;
  }

  return date.toLocaleDateString();
}
