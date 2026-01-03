/**
 * Upload meditation audio files to Supabase Storage
 *
 * Run with: npx tsx scripts/upload-meditation-audio.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment from apps/web/.env or root .env
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  console.error('Set them in your shell or load from .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const AUDIO_DIR = path.join(process.cwd(), 'tmp/meditation-audio');
const BUCKET_NAME = 'meditation-audio';

const FILES = [
  'body-scan-3min-en.mp3',
  'body-scan-9min-en.mp3',
  'breathing-5min-en.mp3',
  'loving-kindness-9min-en.mp3',
  'working-with-difficulties-7min-en.mp3',
];

async function uploadFile(fileName: string): Promise<boolean> {
  const filePath = path.join(AUDIO_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return false;
  }

  const fileBuffer = fs.readFileSync(filePath);

  console.log(`Uploading ${fileName}...`);

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, fileBuffer, {
    contentType: 'audio/mpeg',
    upsert: true, // Overwrite if exists
  });

  if (error) {
    console.error(`Failed to upload ${fileName}:`, error.message);
    return false;
  }

  console.log(`✓ Uploaded ${fileName}`);
  return true;
}

async function main() {
  console.log(`\nUploading meditation audio to ${SUPABASE_URL}`);
  console.log(`Bucket: ${BUCKET_NAME}\n`);

  let success = 0;
  let failed = 0;

  for (const file of FILES) {
    const result = await uploadFile(file);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  console.log(`\nDone! ${success} uploaded, ${failed} failed.`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Upload script failed:', err);
  process.exit(1);
});
