-- ============================================================================
-- Migration 008: Meditation Series Tables
-- ============================================================================
-- Supports progressive meditation courses with badge rewards.
-- ============================================================================

-- Series definitions
CREATE TABLE meditation_series (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  track_ids TEXT[] NOT NULL,
  badge_name TEXT,
  badge_emoji TEXT,
  total_duration_seconds INTEGER,
  difficulty TEXT DEFAULT 'beginner',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress tracking
CREATE TABLE user_series_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  series_id TEXT NOT NULL REFERENCES meditation_series(id) ON DELETE CASCADE,
  completed_track_ids TEXT[] DEFAULT '{}',
  current_track_index INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  badge_earned BOOLEAN DEFAULT false,
  UNIQUE(user_id, series_id)
);

-- User badges earned
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL,
  badge_emoji TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'series', 'streak', 'milestone'
  source_id TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_name)
);

-- Indexes
CREATE INDEX idx_user_series_progress_user ON user_series_progress(user_id);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);

-- RLS
ALTER TABLE meditation_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_series_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Series are readable by all" ON meditation_series FOR SELECT USING (true);
CREATE POLICY "Users can view own progress" ON user_series_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_series_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can earn badges" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed series
INSERT INTO meditation_series (id, title, description, track_ids, badge_name, badge_emoji, total_duration_seconds, difficulty) VALUES
('7_day_calm', '7 Day Calm', 'A week of daily stress relief meditations to build your calm practice.', 
 ARRAY['breathing_focus', 'body_scan_short', 'daily_mindfulness', 'anxiety_relief', 'body_scan_medium', 'loving_kindness', 'complete_relaxation'],
 'Week of Calm', '🧘', 2820, 'beginner'),

('sleep_better', 'Sleep Better', 'A 5-day program to improve your sleep through guided relaxation.',
 ARRAY['body_scan_short', 'breathing_focus', 'body_scan_medium', 'complete_relaxation', 'sleep_meditation'],
 'Sleep Master', '😴', 2700, 'beginner'),

('self_compassion', 'Self-Compassion Journey', 'Develop a loving relationship with yourself through 7 sessions.',
 ARRAY['breathing_focus', 'loving_kindness', 'anxiety_relief', 'loving_kindness', 'body_scan_medium', 'loving_kindness_extended', 'loving_kindness_extended'],
 'Heart of Gold', '💛', 3480, 'intermediate');

GRANT SELECT ON meditation_series TO authenticated;
GRANT ALL ON user_series_progress TO authenticated;
GRANT ALL ON user_badges TO authenticated;
