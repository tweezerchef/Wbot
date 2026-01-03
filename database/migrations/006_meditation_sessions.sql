-- ============================================================================
-- Migration 006: Meditation Sessions Table
-- ============================================================================
-- Tracks user guided meditation sessions for progress monitoring and
-- personalization (e.g., suggesting tracks based on history).
--
-- Features:
-- - Session metadata (track info, duration listened, completion status)
-- - Flexible session data (JSONB) for future extensibility
-- - Optional mood tracking (before/after)
-- - RLS policies for user data isolation
-- ============================================================================

-- Create meditation sessions table
CREATE TABLE meditation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- Track information
  track_id TEXT NOT NULL,
  track_name TEXT NOT NULL,
  track_type TEXT NOT NULL, -- 'body_scan', 'loving_kindness', 'breathing_focus', etc.

  -- Session metadata
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT FALSE,

  -- Duration tracking
  duration_seconds INTEGER NOT NULL, -- Total track duration
  listened_seconds INTEGER NOT NULL, -- Actual time listened
  stopped_at_percent DECIMAL(5,2), -- Percentage if stopped early

  -- Session data (JSONB for flexibility and future extensions)
  -- Example: { ambient_sound: 'ocean', volume: 0.8 }
  session_data JSONB,

  -- Optional mood tracking (1-5 scale)
  mood_before SMALLINT CHECK (mood_before BETWEEN 1 AND 5),
  mood_after SMALLINT CHECK (mood_after BETWEEN 1 AND 5),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- Query sessions by user
CREATE INDEX idx_meditation_sessions_user_id
  ON meditation_sessions(user_id);

-- Query sessions by track (for recommendation history)
CREATE INDEX idx_meditation_sessions_track_id
  ON meditation_sessions(track_id);

-- Query sessions by track type (for category preferences)
CREATE INDEX idx_meditation_sessions_track_type
  ON meditation_sessions(track_type);

-- Query recent sessions (for progress tracking)
CREATE INDEX idx_meditation_sessions_started_at
  ON meditation_sessions(started_at DESC);

-- Composite index for counting completed sessions by user and track
CREATE INDEX idx_meditation_sessions_user_track_completed
  ON meditation_sessions(user_id, track_id, completed);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own meditation sessions"
  ON meditation_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sessions
CREATE POLICY "Users can create own meditation sessions"
  ON meditation_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sessions
CREATE POLICY "Users can update own meditation sessions"
  ON meditation_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own sessions (for privacy)
CREATE POLICY "Users can delete own meditation sessions"
  ON meditation_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE TRIGGER update_meditation_sessions_updated_at
  BEFORE UPDATE ON meditation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get user's meditation statistics
CREATE OR REPLACE FUNCTION get_meditation_stats(p_user_id UUID)
RETURNS TABLE (
  total_sessions BIGINT,
  completed_sessions BIGINT,
  total_minutes INTEGER,
  favorite_track_type TEXT,
  current_streak INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_sessions,
    COUNT(*) FILTER (WHERE completed)::BIGINT as completed_sessions,
    COALESCE(SUM(listened_seconds) / 60, 0)::INTEGER as total_minutes,
    (
      SELECT track_type
      FROM meditation_sessions
      WHERE user_id = p_user_id AND completed = true
      GROUP BY track_type
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) as favorite_track_type,
    -- Streak calculation (consecutive days)
    (
      SELECT COUNT(DISTINCT DATE(started_at))::INTEGER
      FROM (
        SELECT started_at,
               DATE(started_at) - (ROW_NUMBER() OVER (ORDER BY DATE(started_at)))::INTEGER as grp
        FROM meditation_sessions
        WHERE user_id = p_user_id AND completed = true
        AND started_at >= CURRENT_DATE - INTERVAL '30 days'
      ) sub
      WHERE grp = (
        SELECT DATE(MAX(started_at)) - (ROW_NUMBER() OVER (ORDER BY DATE(MAX(started_at))))::INTEGER
        FROM meditation_sessions
        WHERE user_id = p_user_id AND completed = true
      )
    ) as current_streak
  FROM meditation_sessions
  WHERE user_id = p_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_meditation_stats(UUID) TO authenticated;
