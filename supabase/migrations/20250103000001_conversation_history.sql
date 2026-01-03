-- ============================================================================
-- Migration: 20250103000001_conversation_history.sql
-- Purpose: Add conversation history features including:
--          1. Full-text search on messages table
--          2. RPC to get conversations with last message preview
--          3. RPC to search conversations by keyword
--          4. RPC to auto-generate conversation titles
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FULL-TEXT SEARCH ON MESSAGES
-- ----------------------------------------------------------------------------
-- Add a generated tsvector column for full-text search on message content.
-- Uses PostgreSQL's built-in full-text search with English dictionary.
-- GIN index enables fast text queries.
-- ----------------------------------------------------------------------------

ALTER TABLE messages ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX IF NOT EXISTS idx_messages_search_vector
  ON messages USING GIN (search_vector);

-- ----------------------------------------------------------------------------
-- FUNCTION: get_conversations_with_preview
-- ----------------------------------------------------------------------------
-- Fetches conversations with their last message for sidebar display.
-- Efficient single query that returns all needed data.
--
-- Parameters:
--   p_user_id: The user whose conversations to fetch
--   p_limit: Maximum number of conversations (default 6)
--   p_offset: Number to skip for pagination (default 0)
--
-- Returns:
--   Table with conversation details and last message preview
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_conversations_with_preview(
  p_user_id UUID,
  p_limit INT DEFAULT 6,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  last_message_content TEXT,
  last_message_role TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  message_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    c.id,
    c.title,
    -- Subquery for last message content
    (
      SELECT m.content
      FROM messages m
      WHERE m.conversation_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) AS last_message_content,
    -- Subquery for last message role
    (
      SELECT m.role
      FROM messages m
      WHERE m.conversation_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) AS last_message_role,
    -- Subquery for last message timestamp
    (
      SELECT m.created_at
      FROM messages m
      WHERE m.conversation_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 1
    ) AS last_message_at,
    c.created_at,
    c.updated_at,
    -- Count of messages in conversation
    (
      SELECT COUNT(*)
      FROM messages m
      WHERE m.conversation_id = c.id
    ) AS message_count
  FROM conversations c
  WHERE c.user_id = p_user_id
  ORDER BY c.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_conversations_with_preview(uuid, integer, integer) TO authenticated;

-- ----------------------------------------------------------------------------
-- FUNCTION: search_conversations_keyword
-- ----------------------------------------------------------------------------
-- Full-text search across all messages in user's conversations.
-- Uses PostgreSQL's plainto_tsquery for natural language queries.
--
-- Parameters:
--   p_user_id: The user whose conversations to search
--   p_query: The search query text
--   p_limit: Maximum results to return (default 10)
--
-- Returns:
--   Matching messages with conversation context and relevance rank
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_conversations_keyword(
  p_user_id UUID,
  p_query TEXT,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  conversation_id UUID,
  conversation_title TEXT,
  message_id UUID,
  message_content TEXT,
  message_role TEXT,
  created_at TIMESTAMPTZ,
  rank REAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    c.id AS conversation_id,
    c.title AS conversation_title,
    m.id AS message_id,
    m.content AS message_content,
    m.role AS message_role,
    m.created_at,
    ts_rank(m.search_vector, plainto_tsquery('english', p_query)) AS rank
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE c.user_id = p_user_id
    AND m.search_vector @@ plainto_tsquery('english', p_query)
  ORDER BY rank DESC, m.created_at DESC
  LIMIT p_limit;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_conversations_keyword(uuid, text, integer) TO authenticated;

-- ----------------------------------------------------------------------------
-- FUNCTION: generate_conversation_title
-- ----------------------------------------------------------------------------
-- Auto-generates a title for a conversation from its first user message.
-- Truncates to 50 characters with ellipsis if needed.
-- Only sets title if one doesn't already exist.
--
-- Parameters:
--   p_conversation_id: The conversation to generate title for
--
-- Returns:
--   The generated title, or existing title if one was already set
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION generate_conversation_title(
  p_conversation_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_first_message TEXT;
  v_title TEXT;
  v_existing_title TEXT;
BEGIN
  -- Check if title already exists
  SELECT title INTO v_existing_title
  FROM conversations
  WHERE id = p_conversation_id;

  -- If title exists, return it
  IF v_existing_title IS NOT NULL THEN
    RETURN v_existing_title;
  END IF;

  -- Get first user message
  SELECT content INTO v_first_message
  FROM messages
  WHERE conversation_id = p_conversation_id
    AND role = 'user'
  ORDER BY created_at ASC
  LIMIT 1;

  -- No messages yet
  IF v_first_message IS NULL THEN
    RETURN NULL;
  END IF;

  -- Truncate to 50 chars, add ellipsis if needed
  IF length(v_first_message) > 50 THEN
    v_title := substring(v_first_message FROM 1 FOR 47) || '...';
  ELSE
    v_title := v_first_message;
  END IF;

  -- Update the conversation with the new title
  UPDATE conversations
  SET title = v_title
  WHERE id = p_conversation_id;

  RETURN v_title;
END;
$$;

-- ----------------------------------------------------------------------------
-- COMMENTS
-- ----------------------------------------------------------------------------
COMMENT ON COLUMN messages.search_vector IS 'Full-text search vector generated from message content';
COMMENT ON FUNCTION get_conversations_with_preview IS 'Gets conversations with last message preview for sidebar display';
COMMENT ON FUNCTION search_conversations_keyword IS 'Full-text keyword search across user messages';
COMMENT ON FUNCTION generate_conversation_title IS 'Auto-generates conversation title from first user message';
