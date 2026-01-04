# Meditation Audio Setup Guide

This guide explains how to set up the meditation audio files for the guided meditation feature.

## Audio Source

All meditation audio files are from **UCLA Mindful Awareness Research Center (MARC)**.

- **Website**: [UCLA MARC Free Guided Meditations](https://www.uclahealth.org/programs/marc/free-guided-meditations)
- **License**: Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 (CC BY-NC-ND 4.0)
- **Narrator**: Diana Winston

## Required Files

Download the following files from UCLA MARC and rename them:

| Original File                | Rename To                               | Duration | Type            |
| ---------------------------- | --------------------------------------- | -------- | --------------- |
| Breathing Meditation (3 min) | `body-scan-3min-en.mp3`                 | 3 min    | body_scan       |
| Body Scan for Sleep          | `body-scan-9min-en.mp3`                 | 9 min    | body_scan       |
| Breathing Meditation         | `breathing-5min-en.mp3`                 | 5 min    | breathing_focus |
| Loving Kindness Meditation   | `loving-kindness-9min-en.mp3`           | 9 min    | loving_kindness |
| Working with Difficulties    | `working-with-difficulties-7min-en.mp3` | 7 min    | anxiety_relief  |

## Upload Steps

### Option 1: Via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the sidebar
3. Click on the `meditation-audio` bucket (created by migration)
4. Click **Upload** and select the downloaded files
5. Ensure file names match exactly (case-sensitive)

### Option 2: Via Supabase CLI

```bash
# Upload all files from a local directory
supabase storage cp ./meditation-audio/* storage://meditation-audio/

# Or upload individual files
supabase storage cp body-scan-3min-en.mp3 storage://meditation-audio/body-scan-3min-en.mp3
```

### Option 3: Via Node.js Script

```typescript
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Service key required for uploads
);

async function uploadAudio(filePath: string, fileName: string) {
  const file = fs.readFileSync(filePath);
  const { error } = await supabase.storage.from('meditation-audio').upload(fileName, file, {
    contentType: 'audio/mpeg',
    upsert: true,
  });

  if (error) {
    console.error(`Failed to upload ${fileName}:`, error);
  } else {
    console.log(`Uploaded ${fileName}`);
  }
}

// Upload all files
const files = [
  ['./audio/body-scan-3min-en.mp3', 'body-scan-3min-en.mp3'],
  ['./audio/body-scan-9min-en.mp3', 'body-scan-9min-en.mp3'],
  ['./audio/breathing-5min-en.mp3', 'breathing-5min-en.mp3'],
  ['./audio/loving-kindness-9min-en.mp3', 'loving-kindness-9min-en.mp3'],
  ['./audio/working-with-difficulties-7min-en.mp3', 'working-with-difficulties-7min-en.mp3'],
];

for (const [path, name] of files) {
  await uploadAudio(path, name);
}
```

## Verify Setup

After uploading, verify the files are accessible:

```bash
# Test public URL access
curl -I "${SUPABASE_URL}/storage/v1/object/public/meditation-audio/breathing-5min-en.mp3"
```

You should get a 200 OK response with `Content-Type: audio/mpeg`.

## Local Development

For local development without real audio files, you can:

1. **Use placeholder audio**: Create short test audio files with the same names
2. **Mock the audio**: The component gracefully handles audio loading errors
3. **Use local files**: Place files in `apps/web/public/audio/meditation/` and update `techniques.ts` to use relative paths for development

## License Compliance

When using UCLA MARC audio files, you must:

1. **Non-commercial use only** - Wbot must not monetize the audio content directly
2. **Attribution required** - Display: "Meditation by Diana Winston, UCLA Mindful Awareness Research Center (MARC). Licensed under CC BY-NC-ND 4.0."
3. **No derivatives** - Do not edit, remix, or transform the audio files

The `GuidedMeditation` component automatically displays the attribution when the track has an `attribution` field set.

## Adding New Tracks

To add new meditation tracks:

1. Download the audio file (ensure license allows use)
2. Upload to the `meditation-audio` bucket
3. Add a new entry to `apps/web/src/components/GuidedMeditation/techniques.ts`
4. Add a corresponding entry in `apps/ai/src/nodes/meditation_guidance/node.py`

---

_Last updated: January 3, 2026_
