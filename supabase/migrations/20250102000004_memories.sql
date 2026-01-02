-- ============================================================================
-- Migration: 004_memories.sql
-- Purpose: Create the memories table for semantic search of past conversations.
--          Uses pgvector for embedding storage and similarity search.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ENABLE PGVECTOR EXTENSION
-- ----------------------------------------------------------------------------
-- pgvector provides vector similarity search in PostgreSQL.
-- This is required for storing and querying embeddings.
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS vector;

-- ----------------------------------------------------------------------------
-- MEMORIES TABLE
-- ----------------------------------------------------------------------------
-- Each memory represents a conversation pair (user message + AI response).
-- Embeddings are generated from the combined text for semantic search.
--
-- Design decisions:
-- - Using halfvec(768) for Gemini embeddings (half precision saves ~50% storage)
-- - Storing raw text alongside embeddings for display
-- - Metadata JSONB for flexible storage of emotional context, topics, etc.
-- - User isolation via user_id foreign key
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS memories (
  -- Unique identifier for this memory
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key linking to the user who owns this memory
  -- ON DELETE CASCADE ensures memories are deleted when user is deleted
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Optional link to the source conversation
  -- SET NULL if conversation is deleted (preserves memory)
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- The user's message that prompted the response
  user_message TEXT NOT NULL,

  -- The AI's response to the user
  ai_response TEXT NOT NULL,

  -- Combined text used for embedding (user + AI)
  -- Format: "User: {message}\n\nAssistant: {response}"
  combined_text TEXT NOT NULL,

  -- Vector embedding of the combined text
  -- Using halfvec(768) for Gemini gemini-embedding-001 model
  -- Half precision saves storage with minimal quality loss
  embedding halfvec(768),

  -- Flexible metadata storage for additional context
  -- Examples:
  -- {
  --   "topics": ["stress", "work"],
  --   "emotional_tone": "anxious",
  --   "source": "wellness_chat"
  -- }
  metadata JSONB DEFAULT '{}'::jsonb,

  -- When this memory was created
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------

-- Index for filtering memories by user (most common filter)
CREATE INDEX IF NOT EXISTS idx_memories_user_id
  ON memories(user_id);

-- Index for filtering by conversation (optional filter)
CREATE INDEX IF NOT EXISTS idx_memories_conversation_id
  ON memories(conversation_id);

-- HNSW index for fast approximate nearest neighbor search
-- Using cosine distance (halfvec_cosine_ops) which works well for normalized embeddings
-- m=16: number of bi-directional links per node (higher = more accurate, slower build)
-- ef_construction=64: size of dynamic candidate list (higher = more accurate, slower build)
CREATE INDEX IF NOT EXISTS idx_memories_embedding
  ON memories USING hnsw (embedding halfvec_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Index for time-based filtering and sorting (recent memories)
CREATE INDEX IF NOT EXISTS idx_memories_created_at
  ON memories(user_id, created_at DESC);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
-- Users can only access their own memories.
-- Service role (used by AI backend) bypasses RLS for backend operations.
-- ----------------------------------------------------------------------------
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Users can read their own memories
CREATE POLICY "Users can view own memories"
  ON memories FOR SELECT
  USING (auth.uid() = user_id);

-- Users can delete their own memories (e.g., privacy controls)
CREATE POLICY "Users can delete own memories"
  ON memories FOR DELETE
  USING (auth.uid() = user_id);

-- Note: INSERT is not exposed via RLS because memories are created
-- by the AI backend using the service role key, not by users directly.

-- ----------------------------------------------------------------------------
-- SIMILARITY SEARCH FUNCTION
-- ----------------------------------------------------------------------------
-- Function to search for similar memories using cosine similarity.
-- Returns memories ordered by similarity, with recency as a tiebreaker.
--
-- Parameters:
--   p_user_id: The user whose memories to search
--   p_embedding: The query embedding vector (768 dimensions)
--   p_limit: Maximum number of results to return (default 5)
--   p_similarity_threshold: Minimum similarity score 0-1 (default 0.5)
--
-- Returns:
--   Table of matching memories with similarity scores
--
-- Security: SECURITY DEFINER allows the function to bypass RLS
-- when called by the service role, while still filtering by user_id.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_memories(
  p_user_id UUID,
  p_embedding halfvec(768),
  p_limit INT DEFAULT 5,
  p_similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  user_message TEXT,
  ai_response TEXT,
  similarity FLOAT,
  created_at TIMESTAMPTZ,
  metadata JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    m.id,
    m.user_message,
    m.ai_response,
    -- Cosine similarity: 1 - cosine_distance
    -- Range: 0 (opposite) to 1 (identical)
    1 - (m.embedding <=> p_embedding) AS similarity,
    m.created_at,
    m.metadata
  FROM memories m
  WHERE m.user_id = p_user_id
    AND m.embedding IS NOT NULL
    AND 1 - (m.embedding <=> p_embedding) > p_similarity_threshold
  ORDER BY
    -- Primary sort: by similarity (most similar first)
    m.embedding <=> p_embedding,
    -- Secondary sort: by recency (newer first for ties)
    m.created_at DESC
  LIMIT p_limit;
$$;

-- ----------------------------------------------------------------------------
-- COMMENTS
-- ----------------------------------------------------------------------------
COMMENT ON TABLE memories IS 'Stores conversation pairs (user + AI) with vector embeddings for semantic search';
COMMENT ON COLUMN memories.embedding IS 'Gemini gemini-embedding-001 embedding (768 dimensions, halfvec)';
COMMENT ON FUNCTION search_memories IS 'Searches for semantically similar memories using cosine similarity';
