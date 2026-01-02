-- ============================================================================
-- Migration: 005_fix_security_warnings.sql
-- Purpose: Fix database linter security warnings by setting explicit search_path
--          on all functions to prevent search_path injection attacks.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FIX: handle_new_user() - Add SET search_path = ''
-- ----------------------------------------------------------------------------
-- This function runs with SECURITY DEFINER privileges, so an attacker could
-- potentially exploit a mutable search_path to substitute malicious tables.
-- By setting search_path = '' and using fully qualified names, we ensure
-- the function always references the intended objects.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert a new profile with just the user ID
  -- Other fields (display_name, preferences) use their defaults
  -- Using fully qualified table name (public.profiles)
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);

  -- Return NEW to allow the original INSERT to proceed
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- FIX: update_updated_at() - Add SET search_path = ''
-- ----------------------------------------------------------------------------
-- While this function doesn't use SECURITY DEFINER, it's still best practice
-- to set an explicit search_path for consistency and defense in depth.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  -- Set the updated_at column to the current timestamp
  NEW.updated_at = NOW();

  -- Return the modified row
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- FIX: update_conversation_timestamp() - Add SET search_path = ''
-- ----------------------------------------------------------------------------
-- This function uses SECURITY DEFINER and updates the conversations table.
-- Using fully qualified name (public.conversations) with empty search_path.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update the parent conversation's updated_at to now
  -- Using fully qualified table name (public.conversations)
  UPDATE public.conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;

  -- Return NEW to allow the INSERT to proceed
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- FIX: search_memories() - Add SET search_path = 'public'
-- ----------------------------------------------------------------------------
-- This function uses SECURITY DEFINER and accesses the memories table.
-- Using fully qualified name (public.memories) with search_path = 'public'.
-- Note: The <=> operator is provided by pgvector extension which is installed
-- in the public schema, so we must include 'public' in the search_path.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_memories(
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
SET search_path = 'public'
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
  FROM public.memories m
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
COMMENT ON FUNCTION public.handle_new_user IS 'Creates a profile for new auth users. Fixed search_path for security.';
COMMENT ON FUNCTION public.update_updated_at IS 'Auto-updates updated_at timestamp on row modification. Fixed search_path for security.';
COMMENT ON FUNCTION public.update_conversation_timestamp IS 'Updates conversation timestamp when message is added. Fixed search_path for security.';
COMMENT ON FUNCTION public.search_memories IS 'Searches for semantically similar memories using cosine similarity. Fixed search_path for security.';

-- ----------------------------------------------------------------------------
-- NOTE: vector extension in public schema
-- ----------------------------------------------------------------------------
-- The vector extension is currently installed in the public schema.
-- Moving it to the extensions schema would require:
-- 1. Dropping the HNSW index
-- 2. Dropping and recreating the extension in extensions schema
-- 3. Updating all halfvec column references
-- 4. Recreating the index
--
-- This is a breaking change that requires careful data migration.
-- For now, we're leaving the extension in public and addressing the
-- more critical function search_path vulnerabilities.
-- ----------------------------------------------------------------------------
