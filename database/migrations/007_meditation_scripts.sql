-- ============================================================================
-- Migration 007: Meditation Scripts Table
-- ============================================================================
-- Stores meditation scripts for TTS generation.
-- Scripts can contain placeholders for personalization.
-- ============================================================================

CREATE TABLE meditation_scripts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  duration_estimate_seconds INTEGER NOT NULL,
  script_content TEXT NOT NULL,
  has_personalization_placeholders BOOLEAN DEFAULT false,
  placeholders JSONB DEFAULT '{}',
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by type
CREATE INDEX idx_meditation_scripts_type ON meditation_scripts(type);

-- Auto-update timestamp
CREATE TRIGGER update_meditation_scripts_updated_at
  BEFORE UPDATE ON meditation_scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Seed Scripts
-- ============================================================================

INSERT INTO meditation_scripts (id, title, type, duration_estimate_seconds, script_content, has_personalization_placeholders, placeholders) VALUES

('breathing_custom_5min', 'Personalized Breathing Meditation', 'breathing_focus', 300,
'Welcome, {{USER_NAME}}. Find a comfortable position and gently close your eyes.

Take a deep breath in through your nose... and slowly exhale through your mouth.

Let go of any tension you''re holding. This is your time to simply be present.

Begin to notice your natural breath. No need to change it, just observe.

Feel your chest rise and fall. Feel your belly expand and contract.

With each exhale, allow yourself to relax a little more deeply.

If your mind wanders, that''s perfectly normal. Simply guide your attention back to your breath.

Breathe in calm... breathe out tension.

You''re doing wonderfully, {{USER_NAME}}. Continue this gentle rhythm.

As we near the end of this practice, take one more deep breath in... and release.

Slowly begin to bring awareness back to your surroundings.

When you''re ready, gently open your eyes.

Thank you for taking this time for yourself today.',
true, '{"name": "USER_NAME"}'),

('body_scan_custom_10min', 'Personalized Body Scan', 'body_scan', 600,
'Hello {{USER_NAME}}. Let''s take a journey through your body together.

Find a comfortable position, either sitting or lying down.

Close your eyes and take three deep breaths.

We''ll start at the top of your head. Notice any sensations there.

Slowly move your attention down to your forehead... release any tension.

Feel your eyes, your cheeks, your jaw. Let your jaw soften and relax.

Move down to your neck and shoulders. These areas often hold stress.

Breathe into any tightness. With each exhale, let it melt away.

Bring awareness to your arms, your hands, your fingers.

Feel the weight of your arms resting comfortably.

Now notice your chest and upper back. Feel the gentle rise and fall with each breath.

Move to your belly. Allow it to be soft and relaxed.

Continue down to your lower back and hips.

Feel your thighs, your knees, your calves.

Finally, bring attention to your feet and toes.

You''ve now scanned your entire body, {{USER_NAME}}.

Take a moment to feel your body as a whole.

When you''re ready, slowly open your eyes.',
true, '{"name": "USER_NAME"}'),

('loving_kindness_custom', 'Personalized Loving Kindness', 'loving_kindness', 480,
'{{USER_NAME}}, welcome to this loving kindness meditation.

Find a comfortable seat and close your eyes.

Begin by placing your hand over your heart.

Feel the warmth of your own touch.

Silently repeat these words to yourself:

May I be happy.
May I be healthy.
May I be safe.
May I live with ease.

Feel these wishes for yourself. You deserve this kindness, {{USER_NAME}}.

Now, think of someone you love deeply.

Picture them clearly in your mind.

Extend these same wishes to them:

May you be happy.
May you be healthy.
May you be safe.
May you live with ease.

Now expand this circle of kindness to all beings everywhere.

May all beings be happy.
May all beings be healthy.
May all beings be safe.
May all beings live with ease.

Rest in this feeling of universal compassion.

When you''re ready, gently open your eyes.

Carry this kindness with you, {{USER_NAME}}.',
true, '{"name": "USER_NAME"}'),

('sleep_custom', 'Personalized Sleep Meditation', 'sleep', 900,
'Good evening, {{USER_NAME}}. It''s time to prepare for restful sleep.

Lie down comfortably in your bed.

Close your eyes and take a long, slow breath.

Release the day''s worries with your exhale.

Feel the support of your bed beneath you.

Let your body sink into the mattress.

Starting with your feet, imagine warm, golden light relaxing each muscle.

Feel this warmth move up through your calves... your thighs...

Your hips and lower back... melting into deep relaxation.

The warmth continues up your spine... across your shoulders...

Down your arms to your fingertips.

Feel your neck relax... your jaw... your face.

Your entire body is now deeply relaxed.

With each breath, you sink deeper into comfort.

You are safe. You are at peace.

Let sleep come naturally, {{USER_NAME}}.

Sweet dreams.',
true, '{"name": "USER_NAME"}'),

('anxiety_relief_custom', 'Personalized Anxiety Relief', 'anxiety_relief', 420,
'{{USER_NAME}}, I''m here with you. Let''s work through this together.

Place both feet flat on the ground.

Feel the solid earth beneath you.

Take a slow breath in for 4 counts... hold for 4... release for 6.

You are safe in this moment.

Notice five things you can see around you.

Now notice four things you can feel.

Three things you can hear.

Two things you can smell.

One thing you can taste.

You are grounded. You are present.

Whatever you''re feeling is valid, {{USER_NAME}}.

But remember: feelings are temporary visitors.

They come, and they go.

Take another deep breath.

Feel your body supported and safe.

You have survived every difficult moment so far.

You will get through this one too.

When you''re ready, open your eyes with renewed calm.',
true, '{"name": "USER_NAME"}');

-- Grant access
GRANT SELECT ON meditation_scripts TO authenticated;
