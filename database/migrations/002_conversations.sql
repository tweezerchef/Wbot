-- ============================================================================
-- Migration: 002_conversations.sql
-- Purpose: Create the conversations table to store wellness chat sessions.
--          Each conversation belongs to a user and contains multiple messages.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CONVERSATIONS TABLE
-- ----------------------------------------------------------------------------
-- A conversation represents a single wellness chat session between a user
-- and the AI assistant. Users can have multiple conversations, and each
-- conversation can have many messages (see 003_messages.sql).
--
-- Design decisions:
-- - Using UUID for id instead of auto-increment for better distributed systems
--   compatibility and to prevent ID enumeration attacks
-- - Storing title so users can identify past conversations in a list
-- - Using TIMESTAMPTZ (timestamp with timezone) to properly handle users
--   in different timezones
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  -- Unique identifier for this conversation
  -- gen_random_uuid() is PostgreSQL's built-in UUID generator
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key linking to the user who owns this conversation
  -- ON DELETE CASCADE ensures conversations are deleted when user is deleted
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Optional title for the conversation
  -- Can be auto-generated from the first message or set by the user
  -- Example: "Anxiety discussion - Dec 30" or "Morning check-in"
  title TEXT,

  -- When the conversation was first created
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- When the conversation was last active (last message sent)
  -- Updated automatically by trigger when new messages are added
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
-- Indexes speed up queries at the cost of slightly slower writes.
-- We create indexes on columns that are frequently used in WHERE clauses.
-- ----------------------------------------------------------------------------

-- Index for quickly finding all conversations for a specific user
-- This is essential for the "conversation list" view in the UI
CREATE INDEX IF NOT EXISTS idx_conversations_user_id
  ON conversations(user_id);

-- Index for sorting conversations by most recent activity
-- Useful for showing "most recent first" in the conversation list
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at
  ON conversations(updated_at DESC);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
-- Same pattern as profiles: users can only access their own conversations.
-- This prevents users from seeing or modifying other users' wellness sessions.
-- ----------------------------------------------------------------------------
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can read their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create new conversations for themselves
CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations (e.g., change title)
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own conversations
-- This will cascade-delete all messages in the conversation
CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ----------------------------------------------------------------------------
-- Reuses the update_updated_at() function created in 001_profiles.sql
-- This updates the updated_at column whenever the conversation is modified
-- ----------------------------------------------------------------------------
CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
