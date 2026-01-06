-- ============================================================================
-- Migration 010: User Profiling & Conversation Analysis System
-- ============================================================================
-- Adds comprehensive user profiling with AI-based conversation analysis,
-- mood tracking, activity effectiveness, and personalization.
--
-- Changes:
-- 1. Standardize mood scale in breathing_sessions (TEXT → SMALLINT 1-5)
-- 2. Create user_wellness_profiles (1:1 with profiles)
-- 3. Create conversation_analyses (LLM-generated insights per conversation)
-- 4. Create emotional_snapshots (time-series emotional data)
-- 5. Create activity_effectiveness (aggregated activity metrics)
-- 6. Add helper functions for profile context retrieval
--
-- Mood Scale: Standardized 1-5 across all tables
--   1 = Very low, 2 = Low, 3 = Neutral, 4 = Good, 5 = Great
-- ============================================================================

-- ============================================================================
-- PART 1: STANDARDIZE MOOD SCALE IN BREATHING_SESSIONS
-- ============================================================================
-- Convert mood_before/mood_after from TEXT to SMALLINT (1-5)
-- to match meditation_sessions and frontend MoodCheck component.
-- NOTE: Only runs if breathing_sessions table exists (may not be deployed yet)
-- ============================================================================

DO $$
BEGIN
  -- Only run if breathing_sessions table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'breathing_sessions') THEN
    -- Step 1: Add new SMALLINT columns if they don't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns
                   WHERE table_name = 'breathing_sessions' AND column_name = 'mood_before_new') THEN
      ALTER TABLE breathing_sessions
        ADD COLUMN mood_before_new SMALLINT CHECK (mood_before_new BETWEEN 1 AND 5),
        ADD COLUMN mood_after_new SMALLINT CHECK (mood_after_new BETWEEN 1 AND 5);

      -- Step 2: Migrate existing TEXT values to integers (if old columns exist)
      IF EXISTS (SELECT FROM information_schema.columns
                 WHERE table_name = 'breathing_sessions' AND column_name = 'mood_before'
                 AND data_type = 'text') THEN
        UPDATE breathing_sessions SET
          mood_before_new = CASE
            WHEN mood_before ~ '^[1-5]$' THEN mood_before::SMALLINT
            WHEN mood_before IN ('very_low', 'terrible', 'awful') THEN 1
            WHEN mood_before IN ('low', 'bad', 'poor') THEN 2
            WHEN mood_before IN ('neutral', 'okay', 'ok', 'fine') THEN 3
            WHEN mood_before IN ('good', 'well', 'positive') THEN 4
            WHEN mood_before IN ('great', 'excellent', 'amazing', 'wonderful') THEN 5
            ELSE NULL
          END,
          mood_after_new = CASE
            WHEN mood_after ~ '^[1-5]$' THEN mood_after::SMALLINT
            WHEN mood_after IN ('very_low', 'terrible', 'awful') THEN 1
            WHEN mood_after IN ('low', 'bad', 'poor') THEN 2
            WHEN mood_after IN ('neutral', 'okay', 'ok', 'fine') THEN 3
            WHEN mood_after IN ('good', 'well', 'positive') THEN 4
            WHEN mood_after IN ('great', 'excellent', 'amazing', 'wonderful') THEN 5
            ELSE NULL
          END
        WHERE mood_before IS NOT NULL OR mood_after IS NOT NULL;

        -- Step 3: Drop old TEXT columns and rename new ones
        ALTER TABLE breathing_sessions DROP COLUMN mood_before;
        ALTER TABLE breathing_sessions DROP COLUMN mood_after;
        ALTER TABLE breathing_sessions RENAME COLUMN mood_before_new TO mood_before;
        ALTER TABLE breathing_sessions RENAME COLUMN mood_after_new TO mood_after;
      END IF;
    END IF;

    RAISE NOTICE 'breathing_sessions mood columns standardized to SMALLINT (1-5)';
  ELSE
    RAISE NOTICE 'breathing_sessions table does not exist, skipping mood standardization';
  END IF;
END $$;

-- ============================================================================
-- PART 2: USER WELLNESS PROFILES TABLE (1:1 with profiles)
-- ============================================================================
-- Dynamic profile that evolves based on user interactions.
-- PK is also FK to profiles (enforces 1:1 relationship).
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_wellness_profiles (
  -- PK = FK enforces 1:1 relationship with profiles
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

  -- Current emotional baseline (updated each session)
  emotional_baseline TEXT CHECK (emotional_baseline IN (
    'very_positive', 'positive', 'neutral', 'stressed', 'anxious', 'struggling'
  )),
  emotional_baseline_updated_at TIMESTAMPTZ,

  -- Engagement patterns (learned from behavior)
  engagement_trend TEXT CHECK (engagement_trend IN (
    'increasing', 'stable', 'decreasing', 'sporadic'
  )),
  typical_session_length_seconds INTEGER,
  preferred_time_of_day TEXT CHECK (preferred_time_of_day IN (
    'morning', 'afternoon', 'evening', 'night', 'varies'
  )),
  conversation_frequency TEXT CHECK (conversation_frequency IN (
    'daily', 'few_times_week', 'weekly', 'sporadic'
  )),

  -- Learned preferences (may differ from onboarding answers)
  actual_communication_style TEXT CHECK (actual_communication_style IN (
    'direct', 'warm', 'reflective', 'structured', 'mixed'
  )),
  responds_well_to TEXT[] DEFAULT '{}',

  -- Current focus and concerns
  current_primary_concern TEXT,
  recurring_topics TEXT[] DEFAULT '{}',
  recurring_triggers TEXT[] DEFAULT '{}',

  -- Progress toward goals (matches onboarding primary_goal options)
  -- Example: {"stress_anxiety": {"score": 0.6, "trend": "improving", "notes": ["practicing breathing"]}}
  goals_progress JSONB DEFAULT '{}'::JSONB,

  -- Notes on progress
  improvements_noted TEXT[] DEFAULT '{}',
  challenges_persisting TEXT[] DEFAULT '{}',

  -- Aggregate metrics
  total_conversations INTEGER DEFAULT 0,
  total_activities_completed INTEGER DEFAULT 0,
  total_engagement_minutes INTEGER DEFAULT 0,

  -- Timestamps
  first_interaction_at TIMESTAMPTZ,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER user_wellness_profiles_updated_at
  BEFORE UPDATE ON user_wellness_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE user_wellness_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wellness profile"
  ON user_wellness_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wellness profile"
  ON user_wellness_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert (for backend operations)
CREATE POLICY "Service role can insert wellness profiles"
  ON user_wellness_profiles FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE user_wellness_profiles IS
  'Dynamic user profile that evolves based on interactions. 1:1 with profiles table. Updated by analyze_profile node.';

-- ============================================================================
-- PART 3: CONVERSATION ANALYSES TABLE
-- ============================================================================
-- Stores LLM-generated analysis of each conversation.
-- Includes vector embedding for semantic search across past analyses.
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User ownership (required for RLS)
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Link to analyzed conversation
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

  -- Link to the message that triggered/ended the analysis
  analyzed_up_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,

  -- Emotional analysis
  primary_emotion TEXT NOT NULL,
  emotion_intensity REAL CHECK (emotion_intensity >= 0 AND emotion_intensity <= 1),
  emotional_valence REAL CHECK (emotional_valence >= -1 AND emotional_valence <= 1),
  emotional_trajectory TEXT CHECK (emotional_trajectory IN (
    'improving', 'stable', 'declining', 'fluctuating'
  )),

  -- Content analysis
  topics_discussed TEXT[] DEFAULT '{}',
  concerns_raised TEXT[] DEFAULT '{}',
  positive_aspects TEXT[] DEFAULT '{}',
  coping_strategies_mentioned TEXT[] DEFAULT '{}',
  detected_triggers TEXT[] DEFAULT '{}',

  -- Session characterization
  conversation_type TEXT CHECK (conversation_type IN (
    'venting', 'seeking_advice', 'checking_in', 'doing_activity',
    'crisis', 'celebration', 'general_chat'
  )),
  engagement_level TEXT CHECK (engagement_level IN ('high', 'medium', 'low')),
  session_quality TEXT CHECK (session_quality IN ('productive', 'neutral', 'difficult')),

  -- Actionable insights
  follow_up_topics TEXT[] DEFAULT '{}',
  suggested_activities TEXT[] DEFAULT '{}',

  -- Full analysis as JSON (for flexibility and future fields)
  analysis_json JSONB DEFAULT '{}'::JSONB,

  -- Searchable summary and embedding for semantic search
  analysis_summary TEXT,
  embedding halfvec(768),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversation_analyses_user_id
  ON conversation_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analyses_conversation_id
  ON conversation_analyses(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analyses_user_created
  ON conversation_analyses(user_id, created_at DESC);

-- HNSW index for semantic search on embeddings
CREATE INDEX IF NOT EXISTS idx_conversation_analyses_embedding
  ON conversation_analyses USING hnsw (embedding halfvec_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- RLS
ALTER TABLE conversation_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversation analyses"
  ON conversation_analyses FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert (backend operations only)
CREATE POLICY "Service role can insert conversation analyses"
  ON conversation_analyses FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE conversation_analyses IS
  'LLM-generated analysis of each conversation. Created by analyze_profile node. Includes embeddings for semantic search.';

-- ============================================================================
-- PART 4: EMOTIONAL SNAPSHOTS TABLE (Time-series)
-- ============================================================================
-- Time-series of emotional states from conversations and activities.
-- Uses the standardized 1-5 mood scale where applicable.
-- ============================================================================

CREATE TABLE IF NOT EXISTS emotional_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User ownership (required)
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Context links (optional)
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,

  -- Activity context (if from activity)
  activity_type TEXT CHECK (activity_type IN ('breathing', 'meditation', 'journaling', 'grounding')),
  activity_session_id UUID,

  -- Emotional state (psychological model)
  primary_emotion TEXT NOT NULL,
  secondary_emotion TEXT,
  -- Intensity: 0.0 (barely noticeable) to 1.0 (overwhelming)
  intensity REAL CHECK (intensity >= 0 AND intensity <= 1),
  -- Valence: -1.0 (very negative) to 1.0 (very positive)
  valence REAL CHECK (valence >= -1 AND valence <= 1),
  -- Arousal: 0.0 (calm/low energy) to 1.0 (activated/high energy)
  arousal REAL CHECK (arousal >= 0 AND arousal <= 1),

  -- Mood rating (1-5 scale, for before/after activities)
  mood_rating SMALLINT CHECK (mood_rating BETWEEN 1 AND 5),

  -- Context
  detected_triggers TEXT[] DEFAULT '{}',
  source TEXT NOT NULL CHECK (source IN (
    'conversation', 'activity_before', 'activity_after', 'check_in', 'inferred'
  )),

  -- Confidence in the detection (0-1)
  confidence REAL CHECK (confidence >= 0 AND confidence <= 1),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_emotional_snapshots_user_time
  ON emotional_snapshots(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotional_snapshots_user_source
  ON emotional_snapshots(user_id, source);
-- Note: Date-based aggregation uses the user_time index with date truncation in queries

-- RLS
ALTER TABLE emotional_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emotional snapshots"
  ON emotional_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own emotional snapshots"
  ON emotional_snapshots FOR DELETE
  USING (auth.uid() = user_id);

-- Service role can insert (backend operations)
CREATE POLICY "Service role can insert emotional snapshots"
  ON emotional_snapshots FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE emotional_snapshots IS
  'Time-series log of detected emotional states. Sources: conversations, activities, check-ins. Used for pattern analysis.';

-- ============================================================================
-- PART 5: ACTIVITY EFFECTIVENESS TABLE
-- ============================================================================
-- Aggregated effectiveness metrics per activity/technique per user.
-- Computed from breathing_sessions and meditation_sessions mood data.
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_effectiveness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Activity identification
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'breathing', 'meditation', 'journaling', 'grounding'
  )),
  technique TEXT, -- e.g., 'wim_hof', '4_7_8', 'body_scan', 'loving_kindness'

  -- Engagement metrics (aggregated from session tables)
  times_started INTEGER DEFAULT 0,
  times_completed INTEGER DEFAULT 0,
  total_duration_seconds INTEGER DEFAULT 0,
  average_duration_seconds INTEGER,

  -- Effectiveness metrics (from mood_before/mood_after tracking)
  mood_improvements INTEGER DEFAULT 0,
  mood_no_change INTEGER DEFAULT 0,
  mood_declines INTEGER DEFAULT 0,
  -- Average mood change (-4 to +4 scale based on 1-5 ratings)
  average_mood_change REAL DEFAULT 0,

  -- Contexts where this technique was helpful
  effective_contexts TEXT[] DEFAULT '{}',

  -- Composite effectiveness score (0-100)
  -- Formula: completion_rate * 40 + mood_improvement_rate * 40 + frequency_bonus * 20
  effectiveness_score REAL CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),

  -- Recommendation flag (set by analysis node)
  is_recommended BOOLEAN DEFAULT FALSE,
  recommendation_reason TEXT,

  -- Timestamps
  first_used_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one row per user + activity + technique
  UNIQUE(user_id, activity_type, technique)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_activity_effectiveness_user
  ON activity_effectiveness(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_effectiveness_user_score
  ON activity_effectiveness(user_id, effectiveness_score DESC NULLS LAST);

-- Trigger for updated_at
CREATE TRIGGER activity_effectiveness_updated_at
  BEFORE UPDATE ON activity_effectiveness
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE activity_effectiveness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity effectiveness"
  ON activity_effectiveness FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert/update (backend operations)
CREATE POLICY "Service role can manage activity effectiveness"
  ON activity_effectiveness FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE activity_effectiveness IS
  'Aggregated effectiveness metrics per activity/technique. Computed from breathing and meditation sessions.';

-- ============================================================================
-- PART 6: HELPER FUNCTIONS
-- ============================================================================

-- Function to search conversation analyses semantically
CREATE OR REPLACE FUNCTION search_conversation_analyses(
  p_user_id UUID,
  p_embedding halfvec(768),
  p_limit INTEGER DEFAULT 5,
  p_similarity_threshold REAL DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  primary_emotion TEXT,
  topics_discussed TEXT[],
  concerns_raised TEXT[],
  analysis_summary TEXT,
  similarity REAL,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ca.id,
    ca.conversation_id,
    ca.primary_emotion,
    ca.topics_discussed,
    ca.concerns_raised,
    ca.analysis_summary,
    (1 - (ca.embedding <=> p_embedding))::REAL AS similarity,
    ca.created_at
  FROM conversation_analyses ca
  WHERE ca.user_id = p_user_id
    AND ca.embedding IS NOT NULL
    AND 1 - (ca.embedding <=> p_embedding) > p_similarity_threshold
  ORDER BY ca.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$;

-- Function to get comprehensive user wellness context for LLM prompts
CREATE OR REPLACE FUNCTION get_user_wellness_context(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    -- Static preferences from profiles
    'preferences', (
      SELECT preferences FROM profiles WHERE id = p_user_id
    ),
    -- Dynamic wellness profile
    'wellness_profile', (
      SELECT jsonb_build_object(
        'emotional_baseline', wp.emotional_baseline,
        'engagement_trend', wp.engagement_trend,
        'current_concern', wp.current_primary_concern,
        'recurring_topics', wp.recurring_topics,
        'recurring_triggers', wp.recurring_triggers,
        'goals_progress', wp.goals_progress,
        'improvements', wp.improvements_noted,
        'challenges', wp.challenges_persisting,
        'total_conversations', wp.total_conversations,
        'total_activities', wp.total_activities_completed
      )
      FROM user_wellness_profiles wp
      WHERE wp.user_id = p_user_id
    ),
    -- Recent emotional trend (last 5 snapshots)
    'recent_emotions', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'emotion', es.primary_emotion,
        'intensity', es.intensity,
        'valence', es.valence,
        'mood_rating', es.mood_rating,
        'source', es.source,
        'date', es.created_at
      ) ORDER BY es.created_at DESC), '[]'::JSONB)
      FROM (
        SELECT primary_emotion, intensity, valence, mood_rating, source, created_at
        FROM emotional_snapshots
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 5
      ) es
    ),
    -- Top effective activities
    'effective_activities', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'activity', ae.activity_type,
        'technique', ae.technique,
        'score', ae.effectiveness_score,
        'avg_mood_change', ae.average_mood_change,
        'times_completed', ae.times_completed,
        'reason', ae.recommendation_reason
      ) ORDER BY ae.effectiveness_score DESC NULLS LAST), '[]'::JSONB)
      FROM (
        SELECT activity_type, technique, effectiveness_score, average_mood_change,
               times_completed, recommendation_reason
        FROM activity_effectiveness
        WHERE user_id = p_user_id AND is_recommended = TRUE
        ORDER BY effectiveness_score DESC NULLS LAST
        LIMIT 3
      ) ae
    ),
    -- Recent conversation topics (from last 3 analyses)
    'recent_topics', (
      SELECT COALESCE(
        array_agg(DISTINCT topic),
        '{}'::TEXT[]
      )
      FROM (
        SELECT unnest(topics_discussed) AS topic
        FROM conversation_analyses
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 3
      ) t
    )
  ) INTO result;

  RETURN COALESCE(result, '{}'::JSONB);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION search_conversation_analyses(UUID, halfvec, INTEGER, REAL) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_wellness_context(UUID) TO authenticated;

COMMENT ON FUNCTION search_conversation_analyses IS
  'Semantic search across conversation analyses using vector similarity. Returns top matches above threshold.';
COMMENT ON FUNCTION get_user_wellness_context IS
  'Returns comprehensive user context for LLM prompts including preferences, profile, emotions, and activities.';

-- ============================================================================
-- PART 7: AUTO-CREATE WELLNESS PROFILE TRIGGER
-- ============================================================================
-- Creates a user_wellness_profiles row when a profile is created.
-- This ensures every user has a wellness profile from signup.
-- ============================================================================

CREATE OR REPLACE FUNCTION create_wellness_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_wellness_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS on_profile_created_create_wellness ON profiles;

-- Create trigger
CREATE TRIGGER on_profile_created_create_wellness
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_wellness_profile_for_user();

-- Backfill existing users (create wellness profile for users who don't have one)
INSERT INTO user_wellness_profiles (user_id)
SELECT id FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_wellness_profiles)
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON FUNCTION create_wellness_profile_for_user IS
  'Trigger function to auto-create wellness profile when a new profile is created.';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Summary of changes:
-- 1. Standardized breathing_sessions mood columns to SMALLINT (1-5)
-- 2. Created user_wellness_profiles table (1:1 with profiles)
-- 3. Created conversation_analyses table with vector embeddings
-- 4. Created emotional_snapshots table for time-series data
-- 5. Created activity_effectiveness table for aggregated metrics
-- 6. Added search_conversation_analyses() for semantic search
-- 7. Added get_user_wellness_context() for LLM context injection
-- 8. Added auto-create trigger for wellness profiles
-- ============================================================================
