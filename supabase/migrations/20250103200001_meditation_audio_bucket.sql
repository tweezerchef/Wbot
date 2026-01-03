-- ============================================================================
-- Migration: Create meditation-audio storage bucket
-- ============================================================================
-- Sets up a public storage bucket for hosting meditation audio files.
-- Files are from UCLA MARC under CC BY-NC-ND 4.0 license.
--
-- Expected files:
-- - body-scan-3min-en.mp3
-- - body-scan-9min-en.mp3
-- - breathing-5min-en.mp3
-- - loving-kindness-9min-en.mp3
-- - working-with-difficulties-7min-en.mp3
--
-- Note: After running this migration, upload audio files manually via
-- Supabase Dashboard > Storage > meditation-audio
-- ============================================================================

-- Create the meditation-audio bucket (public for audio streaming)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meditation-audio',
  'meditation-audio',
  true,  -- Public bucket for streaming without auth
  52428800,  -- 50MB max file size
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================================
-- Storage Policies
-- ============================================================================
-- Public read access for all users (authenticated or anonymous)
-- Admin write access only (uploads handled through dashboard or service role)

-- Allow public read access to meditation audio
CREATE POLICY "Public read access for meditation audio"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'meditation-audio');

-- Note: Upload/delete policies are not needed since audio files are
-- managed via the Supabase dashboard or service role key, not client-side.
