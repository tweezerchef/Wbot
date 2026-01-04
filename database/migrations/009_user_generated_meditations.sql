-- ============================================================================
-- Migration 009: User Generated Meditations
-- ============================================================================
-- Stores AI-generated personalized meditations for replay.
--
-- These meditations are created by Claude, voiced by ElevenLabs, and stored
-- in Supabase Storage. Users can replay their favorite personalized sessions.
-- ============================================================================

CREATE TABLE user_generated_meditations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- Script content
  title TEXT NOT NULL,
  meditation_type TEXT NOT NULL,
  script_content TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,

  -- Context used for generation (for replay and debugging)
  generation_context JSONB NOT NULL DEFAULT '{}',
  -- Example: {
  --   "time_of_day": "evening",
  --   "primary_intent": "help with anxiety",
  --   "memories_used": 3,
  --   "emotional_signals": ["anxiety", "overwhelm"]
  -- }

  -- Audio configuration
  voice_id TEXT NOT NULL,
  voice_name TEXT NOT NULL,
  audio_url TEXT,
  audio_duration_seconds INTEGER,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  -- Values: 'pending', 'generating', 'ready', 'complete', 'error'
  error_message TEXT,

  -- User feedback and playback
  play_count INTEGER NOT NULL DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,

  -- Mood tracking (optional)
  mood_before INTEGER CHECK (mood_before >= 1 AND mood_before <= 5),
  mood_after INTEGER CHECK (mood_after >= 1 AND mood_after <= 5),
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_generated_meditations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_generated_meditations_updated_at
  BEFORE UPDATE ON user_generated_meditations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_generated_meditations_updated_at();

-- Indexes for common queries
CREATE INDEX idx_user_generated_meditations_user_id
  ON user_generated_meditations(user_id);
CREATE INDEX idx_user_generated_meditations_user_created
  ON user_generated_meditations(user_id, created_at DESC);
CREATE INDEX idx_user_generated_meditations_user_favorites
  ON user_generated_meditations(user_id, is_favorite)
  WHERE is_favorite = true;
CREATE INDEX idx_user_generated_meditations_status
  ON user_generated_meditations(status);

-- Row Level Security
ALTER TABLE user_generated_meditations ENABLE ROW LEVEL SECURITY;

-- Users can only view their own meditations
CREATE POLICY "Users can view own generated meditations"
  ON user_generated_meditations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own meditations
CREATE POLICY "Users can insert own generated meditations"
  ON user_generated_meditations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own meditations
CREATE POLICY "Users can update own generated meditations"
  ON user_generated_meditations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own meditations
CREATE POLICY "Users can delete own generated meditations"
  ON user_generated_meditations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON user_generated_meditations TO authenticated;
