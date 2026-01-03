-- ============================================================================
-- Migration 005: Breathing Sessions Table
-- ============================================================================
-- Tracks user breathing exercise sessions for progress monitoring and
-- personalization (e.g., determining experience level for Wim Hof safety).
--
-- Features:
-- - Session metadata (technique, start/end times, completion status)
-- - Flexible session data (JSONB) for technique-specific details
-- - Optional mood tracking (before/after)
-- - RLS policies for user data isolation
-- ============================================================================

-- Create breathing sessions table
CREATE TABLE breathing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- Technique information
  technique_id TEXT NOT NULL,
  technique_name TEXT NOT NULL,
  technique_type TEXT NOT NULL, -- 'continuous' or 'wim_hof'

  -- Session metadata
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT FALSE,

  -- Session data (JSONB for flexibility)
  -- For continuous: { cyclesCompleted, totalCycles, techniqueId }
  -- For Wim Hof: { rounds: [{round, retentionSeconds}], averageRetention, bestRetention }
  session_data JSONB,

  -- Optional mood tracking
  mood_before TEXT,
  mood_after TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Query sessions by user
CREATE INDEX idx_breathing_sessions_user_id
  ON breathing_sessions(user_id);

-- Query sessions by technique (for experience level checks)
CREATE INDEX idx_breathing_sessions_technique_id
  ON breathing_sessions(technique_id);

-- Query recent sessions (for progress tracking)
CREATE INDEX idx_breathing_sessions_started_at
  ON breathing_sessions(started_at DESC);

-- Composite index for counting completed sessions by user and technique
CREATE INDEX idx_breathing_sessions_user_technique_completed
  ON breathing_sessions(user_id, technique_id, completed);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE breathing_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
  ON breathing_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can create own sessions"
  ON breathing_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON breathing_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own sessions (optional - for privacy)
CREATE POLICY "Users can delete own sessions"
  ON breathing_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_breathing_sessions_updated_at
  BEFORE UPDATE ON breathing_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Note: update_updated_at_column() function should already exist from previous migrations
-- If not, it needs to be created:
--
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = NOW();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
