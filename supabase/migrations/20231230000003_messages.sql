-- ============================================================================
-- Migration: 003_messages.sql
-- Purpose: Create the messages table to store individual chat messages
--          within wellness conversations.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- MESSAGES TABLE
-- ----------------------------------------------------------------------------
-- Each message represents a single exchange in a conversation - either from
-- the user or from the AI assistant. Messages are stored in order and can
-- include metadata for additional context.
--
-- Design decisions:
-- - role column distinguishes between user and assistant messages
-- - content stores the actual message text
-- - metadata JSONB allows storing flexible data like:
--   - Token counts for billing
--   - Model version used for the response
--   - Sentiment analysis results
--   - Tool calls and their results
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  -- Unique identifier for this message
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key linking to the parent conversation
  -- ON DELETE CASCADE ensures messages are deleted with their conversation
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Who sent this message
  -- 'user' = the human user
  -- 'assistant' = the AI wellness bot
  -- 'system' = system messages (e.g., "conversation started")
  -- Using TEXT with CHECK constraint instead of ENUM for flexibility
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),

  -- The actual message content (the text of the message)
  -- Using TEXT (unlimited length) instead of VARCHAR for flexibility
  content TEXT NOT NULL,

  -- Flexible metadata storage for additional information
  -- Examples of what might be stored:
  -- {
  --   "model": "claude-3-opus",
  --   "tokens_used": 150,
  --   "latency_ms": 1234,
  --   "tools_called": ["breathing_exercise"],
  --   "sentiment": "positive"
  -- }
  metadata JSONB DEFAULT '{}'::jsonb,

  -- When this message was created (sent)
  -- This is the primary ordering field for displaying messages
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------

-- Index for quickly finding all messages in a conversation
-- This is the most common query: "get all messages for conversation X"
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id
  ON messages(conversation_id);

-- Composite index for fetching messages in chronological order
-- Speeds up: SELECT * FROM messages WHERE conversation_id = X ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
  ON messages(conversation_id, created_at);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
-- Messages inherit their access control from conversations.
-- A user can only access messages in conversations they own.
--
-- Note: We join with conversations table to check ownership because
-- messages don't have a direct user_id column.
-- ----------------------------------------------------------------------------
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can read messages from their own conversations
-- The subquery checks if the conversation belongs to the current user
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert messages into their own conversations
CREATE POLICY "Users can create messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user_id = auth.uid()
    )
  );

-- Users can delete messages from their own conversations
-- (e.g., to remove sensitive content)
CREATE POLICY "Users can delete messages in own conversations"
  ON messages FOR DELETE
  USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- TRIGGER: Update conversation's updated_at when message is added
-- ----------------------------------------------------------------------------
-- When a new message is added to a conversation, we want to update the
-- conversation's updated_at timestamp. This keeps the "last activity" time
-- current without requiring the application to make two separate updates.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the parent conversation's updated_at to now
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;

  -- Return NEW to allow the INSERT to proceed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fire this trigger after every new message is inserted
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();
