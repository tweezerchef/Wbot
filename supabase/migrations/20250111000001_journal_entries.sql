-- ============================================================================
-- Migration: Journal Entries
-- ============================================================================
-- Stores user journal entries created during journaling activities.
--
-- Users receive AI-generated reflective prompts based on their conversation
-- context, write their responses, and can optionally share entries with the
-- AI for further discussion.
-- ============================================================================

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- Prompt and entry content
  prompt_category TEXT NOT NULL CHECK (prompt_category IN (
    'reflection', 'gratitude', 'processing', 'growth', 'self_compassion'
  )),
  prompt_text TEXT NOT NULL,
  entry_text TEXT NOT NULL,

  -- Mood tracking (1-5 scale, optional)
  mood_before SMALLINT CHECK (mood_before >= 1 AND mood_before <= 5),
  mood_after SMALLINT CHECK (mood_after >= 1 AND mood_after <= 5),

  -- AI sharing
  shared_with_ai BOOLEAN NOT NULL DEFAULT FALSE,

  -- Metadata
  word_count INTEGER NOT NULL DEFAULT 0,
  writing_duration_seconds INTEGER,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_journal_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_journal_entries_updated_at();

-- Indexes for common queries
CREATE INDEX idx_journal_entries_user_id
  ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_user_created
  ON journal_entries(user_id, created_at DESC);
CREATE INDEX idx_journal_entries_user_favorites
  ON journal_entries(user_id, is_favorite)
  WHERE is_favorite = true;
CREATE INDEX idx_journal_entries_category
  ON journal_entries(user_id, prompt_category);

-- Row Level Security
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Users can only view their own journal entries
CREATE POLICY "Users can view own journal entries"
  ON journal_entries
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own journal entries
CREATE POLICY "Users can insert own journal entries"
  ON journal_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own journal entries
CREATE POLICY "Users can update own journal entries"
  ON journal_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own journal entries
CREATE POLICY "Users can delete own journal entries"
  ON journal_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON journal_entries TO authenticated;
