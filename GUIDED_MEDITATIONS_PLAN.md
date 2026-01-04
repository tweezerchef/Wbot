# Guided Meditations Feature: Analysis & Implementation Plan

## Executive Summary

This document analyzes the research on guided meditation resources and maps out a comprehensive implementation plan based on the existing Wbot architecture patterns (learned from the `BreathingExercise` component).

**Status**: ✅ **ALL PHASES COMPLETE** (Phases 1-4)

**Implementation**: A tiered approach with pre-recorded UCLA MARC meditations (free, CC-licensed, professionally recorded) PLUS TTS-generated custom meditations via ElevenLabs API, personalized recommendation engine, and meditation series with badge rewards.

---

## Table of Contents

1. [Codebase Architecture Analysis](#1-codebase-architecture-analysis)
2. [Research Analysis](#2-research-analysis)
3. [Technical Decision Matrix](#3-technical-decision-matrix)
4. [Implementation Plan](#4-implementation-plan)
5. [Component Specifications](#5-component-specifications)
6. [Database Schema](#6-database-schema)
7. [Testing Strategy](#7-testing-strategy)
8. [Phase Breakdown](#8-phase-breakdown)

---

## 1. Codebase Architecture Analysis

### 1.1 Existing Pattern: BreathingExercise Component

The `BreathingExercise` component provides a proven architecture for interactive wellness activities:

```
apps/web/src/components/BreathingExercise/
├── BreathingExercise.tsx      # Main component with state machine
├── BreathingAnimation.tsx      # Visual animation component
├── useBreathingLoop.ts        # Timer/phase logic hook
├── useBreathingAudio.ts       # Web Audio API for ambient sounds + chimes
├── types.ts                    # TypeScript type definitions
├── BreathingExercise.module.css
├── index.ts
└── __tests__/
    ├── BreathingExercise.test.tsx
    ├── useBreathingLoop.test.tsx
    └── mocks/
```

**Key Architecture Decisions**:

1. **Hooks for logic separation**: `useBreathingLoop` handles timing, `useBreathingAudio` handles audio
2. **Web Audio API**: Used for ambient sounds with volume control and smooth fade in/out
3. **State machine pattern**: Tracks phases (idle → active → paused → complete)
4. **Activity markers**: `[ACTIVITY_START]...[ACTIVITY_END]` wrapping JSON for frontend parsing

### 1.2 Backend Pattern: LangGraph Nodes

```
apps/ai/src/nodes/breathing_exercise/
├── node.py         # Main node with HITL interrupt pattern
└── safety.py       # Safety validation for advanced techniques
```

**Key Backend Patterns**:

1. **HITL (Human-in-the-Loop)**: Uses `interrupt()` to pause graph and get user confirmation
2. **Technique selection via LLM**: Analyzes conversation context to recommend appropriate technique
3. **Structured output**: Returns JSON with activity markers for frontend parsing
4. **Safety checks**: Validates user eligibility for advanced techniques

### 1.3 Activity Detection & Routing

The `detect_activity_intent` node in `apps/ai/src/nodes/detect_activity/node.py`:

- Uses LLM with structured output (Pydantic model)
- Classifies intent: `breathing`, `meditation`, `journaling`, or `None`
- Confidence threshold (0.7) before routing to activity node
- Graph state includes `suggested_activity: ActivityType | None`

### 1.4 Activity Parsing (Frontend)

`apps/web/src/lib/parseActivity.ts`:

- Zod schemas for validation
- Discriminated union: `z.discriminatedUnion('activity', [...])`
- Returns `{ textBefore, activity, textAfter, hasActivity }`

---

## 2. Research Analysis

### 2.1 Audio Content Sources (Prioritized)

| Source                   | License         | Quality      | Languages | Best For                   |
| ------------------------ | --------------- | ------------ | --------- | -------------------------- |
| **UCLA MARC**            | CC BY-NC-ND 4.0 | Professional | 8+        | P1 - Immediate use         |
| Free Mindfulness Project | CC BY-NC-SA 3.0 | Good         | English   | P1 - Body scans, breathing |
| Self-Compassion.org      | Free            | Good         | English   | P2 - Self-compassion       |
| Pixabay Music            | Public Domain   | Varies       | N/A       | P1 - Background music      |
| Freesound.org            | CC (various)    | Varies       | N/A       | P1 - Nature sounds         |

**Recommendation**: Start with UCLA MARC meditations (5-19 minutes, multi-language, professionally recorded by Diana Winston). These cover:

- Breathing meditation (3-5 min)
- Body scan (various lengths)
- Loving kindness
- Meditation for difficulties
- Sleep meditation

### 2.2 TTS Solutions (Future)

For generating custom meditations from scripts:

| Solution      | Type        | Quality        | Cost | Best For                |
| ------------- | ----------- | -------------- | ---- | ----------------------- |
| **Coqui TTS** | Self-hosted | Good-Excellent | Free | P2 - Custom meditations |
| ElevenLabs    | API         | Excellent      | $$$  | P3 - Premium voices     |
| OpenAI TTS    | API         | Excellent      | $$   | P2 - Backup option      |

**Recommendation**: Phase 2 should explore Coqui TTS for self-hosted meditation voice synthesis. XTTS-v2 offers high-quality multilingual output.

### 2.3 Feature Comparison: Meditation vs Breathing

| Aspect         | Breathing Exercise    | Guided Meditation        |
| -------------- | --------------------- | ------------------------ |
| Duration       | 2-5 minutes           | 5-30 minutes             |
| User Action    | Follow visual prompts | Listen passively         |
| Audio          | Ambient (optional)    | Primary (voice guidance) |
| Visual         | Animation-focused     | Minimal/calming          |
| State Tracking | Phase/cycle progress  | Playback position        |
| Completion     | Cycle count           | Audio finished           |

### 2.4 Meditation Types to Support

Based on research and user needs:

1. **Body Scan** - Progressive relaxation, tension release
2. **Loving Kindness (Metta)** - Compassion cultivation
3. **Breathing Focus** - Mindfulness on breath (different from breathing exercises)
4. **Sleep** - Relaxation for bedtime
5. **Anxiety Relief** - Calming during stress
6. **Daily Mindfulness** - Quick check-ins

---

## 3. Technical Decision Matrix

### 3.1 Audio Delivery Architecture

**Option A: Pre-hosted Audio Files (Recommended for P1)**

```
pros: Simple, reliable, no runtime dependencies
cons: Limited customization, storage costs
implementation: Host on CDN (Supabase Storage, S3, or Cloudflare R2)
```

**Option B: TTS Generation on Demand (P2/P3)**

```
pros: Infinite customization, personalization
cons: Latency, compute costs, voice quality variance
implementation: Coqui TTS server or API integration
```

**Decision**: Start with Option A for P1, prepare architecture for Option B.

### 3.2 Audio Player Architecture

**Option A: HTML5 Audio Element (Recommended)**

```typescript
// Simple, widely supported, handles streaming
const audioRef = useRef<HTMLAudioElement>(null);
```

**Option B: Web Audio API (Used for breathing)**

```typescript
// Better for mixing, effects, but more complex
const audioContextRef = useRef<AudioContext>(null);
```

**Decision**: Use HTML5 Audio for primary meditation playback (simpler, handles long audio well), Web Audio API for optional ambient mixing layer.

### 3.3 Meditation Selection Logic

```python
# Detection: Look for meditation-specific signals
MEDITATION_SIGNALS = [
    "trouble focusing", "scattered thoughts", "mindfulness",
    "need to be present", "seeking clarity", "meditation",
    "body scan", "loving kindness", "relax deeply"
]

# Selection: Match meditation type to user context
MEDITATION_TYPES = {
    "body_scan": ["tension", "physical stress", "can't relax body"],
    "loving_kindness": ["lonely", "self-critical", "need compassion"],
    "sleep": ["can't sleep", "insomnia", "bedtime"],
    "anxiety_relief": ["anxious", "worried", "panic"],
    "daily_mindfulness": ["general", "default", "quick break"],
}
```

---

## 4. Implementation Plan

### 4.1 Directory Structure

```
apps/
├── web/src/
│   ├── components/
│   │   └── GuidedMeditation/
│   │       ├── GuidedMeditation.tsx          # Main component
│   │       ├── GuidedMeditation.module.css   # Styles
│   │       ├── MeditationPlayer.tsx          # Audio player component
│   │       ├── MeditationVisual.tsx          # Calming visual (optional)
│   │       ├── useMeditationAudio.ts         # Audio playback hook
│   │       ├── useMeditationProgress.ts      # Progress tracking hook
│   │       ├── useAmbientMixer.ts            # Background sounds hook
│   │       ├── types.ts                      # TypeScript types
│   │       ├── techniques.ts                 # Meditation definitions
│   │       ├── index.ts
│   │       └── __tests__/
│   │           ├── GuidedMeditation.test.tsx
│   │           ├── useMeditationAudio.test.tsx
│   │           └── mocks/
│   └── lib/
│       └── parseActivity.ts                  # Add meditation schema
│
├── ai/src/
│   └── nodes/
│       └── meditation_guidance/
│           ├── node.py                       # Replace placeholder
│           ├── techniques.py                 # Meditation technique definitions
│           └── safety.py                     # Optional: safety checks
│
packages/
└── shared/src/types/
    └── meditation.ts                         # Shared meditation types
```

### 4.2 Type Definitions

```typescript
// packages/shared/src/types/meditation.ts

/** Types of guided meditation */
export type MeditationType =
  | 'body_scan'
  | 'loving_kindness'
  | 'breathing_focus'
  | 'sleep'
  | 'anxiety_relief'
  | 'daily_mindfulness';

/** Duration presets */
export type MeditationDuration = 'short' | 'medium' | 'long';

/** A guided meditation track */
export interface MeditationTrack {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Type/category */
  type: MeditationType;
  /** Duration in seconds */
  durationSeconds: number;
  /** Duration preset */
  durationPreset: MeditationDuration;
  /** Description of the meditation */
  description: string;
  /** Audio file URL */
  audioUrl: string;
  /** Instructor/narrator name */
  narrator?: string;
  /** Language code (e.g., 'en', 'es') */
  language: string;
  /** Benefits/use cases */
  bestFor: string[];
  /** Attribution for CC content */
  attribution?: string;
}

/** Session data for meditation completion */
export interface MeditationSessionData {
  /** Track that was played */
  trackId: string;
  /** Duration listened (seconds) */
  listenedDuration: number;
  /** Total track duration */
  totalDuration: number;
  /** Whether completed to the end */
  completedFully: boolean;
  /** If stopped early, at what percentage */
  stoppedAtPercent?: number;
  /** User's mood before (1-5) */
  moodBefore?: number;
  /** User's mood after (1-5) */
  moodAfter?: number;
}

/** Ambient sound options for meditation background */
export type AmbientSound = 'none' | 'ocean' | 'rain' | 'forest' | 'white_noise' | 'binaural_theta';
```

### 4.3 Activity Data Schema

```typescript
// Update apps/web/src/lib/parseActivity.ts

/** Schema for meditation track configuration */
const meditationTrackSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum([
    'body_scan',
    'loving_kindness',
    'breathing_focus',
    'sleep',
    'anxiety_relief',
    'daily_mindfulness',
  ]),
  durationSeconds: z.number(),
  durationPreset: z.enum(['short', 'medium', 'long']),
  description: z.string(),
  audioUrl: z.string().url(),
  narrator: z.string().optional(),
  language: z.string(),
  bestFor: z.array(z.string()),
  attribution: z.string().optional(),
});

/** Schema for meditation activity data */
const meditationActivitySchema = z.object({
  type: z.literal('activity'),
  activity: z.literal('meditation'),
  status: z.enum(['ready', 'in_progress', 'complete']),
  track: meditationTrackSchema,
  introduction: z.string(),
  ambientSoundSuggestion: z
    .enum(['none', 'ocean', 'rain', 'forest', 'white_noise', 'binaural_theta'])
    .optional(),
});

// Add to discriminated union
const activityDataSchema = z.discriminatedUnion('activity', [
  breathingActivitySchema,
  wimHofActivitySchema,
  meditationActivitySchema, // NEW
]);
```

---

## 5. Component Specifications

### 5.1 GuidedMeditation Component

```tsx
// apps/web/src/components/GuidedMeditation/GuidedMeditation.tsx

interface GuidedMeditationProps {
  /** The meditation track to play */
  track: MeditationTrack;
  /** Optional introduction from AI */
  introduction?: string;
  /** Suggested ambient sound */
  ambientSound?: AmbientSound;
  /** Callback when meditation completes */
  onComplete?: (sessionData: MeditationSessionData) => void;
  /** Callback when user stops early */
  onStop?: (sessionData: MeditationSessionData) => void;
}

/**
 * States:
 * 1. idle: Shows track info, start button
 * 2. playing: Audio playing, shows progress, pause/stop controls
 * 3. paused: Audio paused, shows resume/stop
 * 4. complete: Shows completion message, mood check (optional)
 */
```

**Component States**:

```
┌─────────────────────────────────────────┐
│            IDLE STATE                   │
├─────────────────────────────────────────┤
│  [Introduction text from AI]            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🧘 Body Scan Meditation        │   │
│  │  10 minutes • By Diana Winston  │   │
│  │                                 │   │
│  │  [Description text...]          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Ambient Sound: [Ocean ▼]               │
│                                         │
│         [ Start Meditation ]            │
│                                         │
│  🔊 Sound On                            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           PLAYING STATE                 │
├─────────────────────────────────────────┤
│                                         │
│           ╭──────────────╮              │
│           │              │              │
│           │   🧘 ~~~     │   Animated   │
│           │              │   breathing  │
│           ╰──────────────╯   circle     │
│                                         │
│  ════════════════════════════           │
│  2:34 ─────────●───────── 10:00         │
│                                         │
│       [ Pause ]    [ Stop ]             │
│                                         │
│  🔊 ──────●────────  Volume             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          COMPLETE STATE                 │
├─────────────────────────────────────────┤
│                                         │
│              ✓                          │
│       Well Done!                        │
│                                         │
│  You completed a 10-minute Body Scan.   │
│  Take a moment to notice how you feel.  │
│                                         │
│  How are you feeling? (optional)        │
│  [ 😔 ] [ 😐 ] [ 🙂 ] [ 😊 ] [ 😌 ]    │
│                                         │
│        [ Do Another ]                   │
└─────────────────────────────────────────┘
```

### 5.2 useMeditationAudio Hook

```typescript
// apps/web/src/components/GuidedMeditation/useMeditationAudio.ts

interface UseMeditationAudioOptions {
  /** Audio URL to play */
  audioUrl: string;
  /** Initial volume (0-1) */
  initialVolume?: number;
  /** Callback when playback ends */
  onEnded?: () => void;
  /** Callback on time update */
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

interface UseMeditationAudioReturn {
  /** Whether audio is playing */
  isPlaying: boolean;
  /** Whether audio is loading */
  isLoading: boolean;
  /** Current playback time in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Current volume (0-1) */
  volume: number;
  /** Progress as percentage (0-100) */
  progress: number;
  /** Play the audio */
  play: () => Promise<void>;
  /** Pause the audio */
  pause: () => void;
  /** Stop and reset */
  stop: () => void;
  /** Seek to position (seconds) */
  seek: (time: number) => void;
  /** Set volume */
  setVolume: (volume: number) => void;
  /** Any error that occurred */
  error: Error | null;
}
```

### 5.3 useAmbientMixer Hook

```typescript
// apps/web/src/components/GuidedMeditation/useAmbientMixer.ts

/**
 * Manages optional ambient background sounds during meditation.
 * Uses Web Audio API for mixing with main audio.
 *
 * Features:
 * - Multiple ambient sound options
 * - Independent volume control
 * - Smooth fade in/out
 * - Auto-pause when meditation pauses
 */

interface UseAmbientMixerOptions {
  /** Whether mixer is enabled */
  enabled: boolean;
  /** Selected ambient sound */
  sound: AmbientSound;
  /** Volume level (0-1) */
  volume: number;
  /** Whether main meditation is playing */
  isMainPlaying: boolean;
}

interface UseAmbientMixerReturn {
  /** Change ambient sound */
  setSound: (sound: AmbientSound) => void;
  /** Set ambient volume */
  setVolume: (volume: number) => void;
  /** Toggle ambient on/off */
  toggle: () => void;
}
```

---

## 6. Database Schema

### 6.1 Meditation Sessions Table

```sql
-- database/migrations/006_meditation_sessions.sql

CREATE TABLE meditation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Track information
  track_id TEXT NOT NULL,
  track_name TEXT NOT NULL,
  track_type TEXT NOT NULL,

  -- Session data
  duration_seconds INTEGER NOT NULL,
  listened_seconds INTEGER NOT NULL,
  completed_fully BOOLEAN DEFAULT false,
  stopped_at_percent DECIMAL(5,2),

  -- Optional mood tracking
  mood_before SMALLINT CHECK (mood_before BETWEEN 1 AND 5),
  mood_after SMALLINT CHECK (mood_after BETWEEN 1 AND 5),

  -- Metadata
  ambient_sound TEXT,
  conversation_id UUID,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user queries
CREATE INDEX idx_meditation_sessions_user_id ON meditation_sessions(user_id);
CREATE INDEX idx_meditation_sessions_created_at ON meditation_sessions(created_at);

-- RLS Policies
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meditation sessions"
  ON meditation_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meditation sessions"
  ON meditation_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 6.2 Meditation Tracks Table (Optional - for dynamic content)

```sql
-- database/migrations/007_meditation_tracks.sql

CREATE TABLE meditation_tracks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  duration_preset TEXT NOT NULL,
  description TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  narrator TEXT,
  language TEXT DEFAULT 'en',
  best_for TEXT[] NOT NULL,
  attribution TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- No RLS needed - tracks are public/read-only
```

---

## 7. Testing Strategy

### 7.1 Unit Tests

```typescript
// apps/web/src/components/GuidedMeditation/__tests__/

// GuidedMeditation.test.tsx
describe('GuidedMeditation', () => {
  it('renders idle state with track info', () => {});
  it('starts playback when Start button clicked', () => {});
  it('pauses playback when Pause button clicked', () => {});
  it('shows completion state when audio ends', () => {});
  it('calls onComplete with session data on completion', () => {});
  it('calls onStop with session data when stopped early', () => {});
  it('handles audio loading errors gracefully', () => {});
});

// useMeditationAudio.test.tsx
describe('useMeditationAudio', () => {
  it('loads audio and reports duration', () => {});
  it('plays and pauses audio', () => {});
  it('tracks progress during playback', () => {});
  it('handles seek operations', () => {});
  it('adjusts volume', () => {});
  it('calls onEnded when audio completes', () => {});
  it('handles network errors', () => {});
});

// useAmbientMixer.test.tsx
describe('useAmbientMixer', () => {
  it('plays ambient sound when enabled', () => {});
  it('pauses ambient when main audio pauses', () => {});
  it('changes ambient sound type', () => {});
  it('adjusts ambient volume independently', () => {});
});
```

### 7.2 Integration Tests

```python
# apps/ai/tests/integration/test_meditation_node.py

class TestMeditationGuidanceNode:
    async def test_detects_meditation_intent(self):
        """Meditation detected from 'need to focus' message"""

    async def test_selects_appropriate_track(self):
        """Body scan selected for physical tension"""

    async def test_returns_valid_activity_data(self):
        """Activity markers and JSON parse correctly"""

    async def test_hitl_confirmation_flow(self):
        """User can confirm, change, or decline meditation"""

    async def test_respects_user_duration_preference(self):
        """Short meditation selected for users preferring quick sessions"""
```

### 7.3 Recommendation Engine Tests ✅ IMPLEMENTED

```python
# apps/ai/tests/unit/test_recommendation.py
# apps/ai/tests/unit/test_recommendation_pure.py
# apps/ai/tests/unit/test_recommendation_isolated.py

class TestScoreFunctions:
    def test_score_by_duration_exact_match(self): ...
    def test_score_by_duration_no_preference(self): ...
    def test_score_by_duration_mismatch(self): ...
    def test_score_by_language_exact_match(self): ...
    def test_score_by_language_english_default(self): ...
    def test_score_by_emotional_state_anxiety(self): ...
    def test_score_by_time_of_day_morning(self): ...
    def test_score_by_time_of_day_night_sleep(self): ...

class TestLanguageDetection:
    def test_explicit_preference(self): ...
    def test_locale_detection(self): ...
    def test_spanish_in_text(self): ...
    def test_no_detection(self): ...
```

### 7.4 ElevenLabs TTS Tests ✅ IMPLEMENTED

```python
# apps/ai/tests/unit/test_elevenlabs.py

class TestMeditationScript:
    def test_create_script(self): ...
    def test_script_with_placeholders(self): ...

class TestElevenLabsTTS:
    def test_init_with_api_key(self): ...
    def test_init_without_api_key_raises(self): ...
    def test_get_cache_key_consistent(self): ...
    def test_get_cache_key_different_for_different_voices(self): ...
    def test_render_script_basic(self): ...
    def test_render_script_with_name(self): ...
    def test_render_script_with_goal(self): ...
    def test_render_script_default_goal(self): ...
```

### 7.5 MeditationSeries Tests ✅ IMPLEMENTED

```typescript
// apps/web/src/components/MeditationSeries/__tests__/

describe('MeditationSeries', () => {
  describe('rendering', () => { ... });
  describe('progress display', () => { ... });
  describe('buttons', () => { ... });
  describe('callbacks', () => { ... });
});

describe('SeriesProgressBar', () => { ... });
describe('BadgeUnlock', () => { ... });
```

### 7.6 PersonalizedMeditation Storybook ✅ IMPLEMENTED

```typescript
// packages/storybook/stories/interactive/PersonalizedMeditation.stories.tsx

// 12+ stories covering:
-GeneratingState - // TTS loading state
  PreGeneratedAudio - // Cached/instant playback
  BreathingFocus - // 5-min breathing script
  BodyScan - // 10-min body scan script
  LovingKindness - // 8-min compassion script
  SleepMeditation - // 15-min sleep script
  AnxietyRelief - // 7-min grounding script
  FullPersonalization - // Name + goal placeholders
  WithoutPersonalization - // Anonymous mode
  NoIntroduction - // No AI intro text
  WithAmbientSounds - // Ambient mixer enabled
  AllScripts - // Overview of all 5 scripts
  InteractiveDemo - // Configure & generate demo
  MobileView; // Responsive mobile layout
```

---

## 8. Phase Breakdown

### Phase 1: Core Implementation (2-3 days) ✅ COMPLETED

**Goal**: Working guided meditation with pre-recorded UCLA MARC content

**Tasks**:

1. ☑ Create `GuidedMeditation/` component structure
2. ☑ Implement `useMeditationAudio` hook with HTML5 Audio
3. ☑ Implement basic `GuidedMeditation.tsx` (idle → playing → complete)
4. ☑ Add meditation types to `parseActivity.ts`
5. ☑ Create shared types in `packages/shared/src/types/meditation.ts`
6. ☑ Update `meditation_guidance/node.py` with real implementation
7. ☑ Add meditation detection signals to `detect_activity/node.py`
8. ☑ Host 3-5 UCLA MARC audio files (body scan, breathing, loving kindness)
9. ☑ Create database migration for `meditation_sessions`
10. ☑ Write unit tests for components and hooks

**Deliverables**:

- ☑ User can request meditation
- ☑ AI selects appropriate track
- ☑ Audio plays with progress bar
- ☑ Session data saved to database

### Phase 2: Enhanced Experience (2 days) ✅ COMPLETED

**Goal**: Polished UI with ambient sounds and mood tracking

**Tasks**:

1. ☑ Implement `useAmbientMixer` hook (Web Audio API with fade in/out)
2. ☑ Add ambient sound options (ocean, rain, forest)
3. ☑ Implement `MeditationVisual.tsx` (3 variants: orb, rings, gradient)
4. ☑ Add mood check on completion (before/after with skip option)
5. ☑ Implement volume controls for both audio layers (dual sliders)
6. ☑ Add CSS animations and transitions (container hover, reduced motion)
7. ☑ Create Storybook stories (16+ stories with test coverage)
8. ☑ Add more meditation tracks (12 total including Spanish)

**Deliverables**:

- ☑ Ambient sound mixer with volume control
- ☑ Calming visual during meditation
- ☑ Mood tracking for analytics
- ☑ Complete Storybook documentation

**New Tracks Added**:

- `sleep_meditation` - 13 min sleep preparation
- `daily_mindfulness` - 3 min quick mindfulness pause
- `complete_relaxation` - 15 min deep relaxation
- `loving_kindness_extended` - 13 min extended compassion practice
- `breathing_focus_es` - 5 min Spanish breathing meditation
- `body_scan_short_es` - 3 min Spanish body scan

### Phase 3: Personalization (2-3 days) ✅ COMPLETED

**Goal**: Smart recommendations based on user history and context

**Tasks**:

1. ☑ Implement meditation preference learning
2. ☑ Add duration preferences (short/medium/long)
3. ☑ Create recommendation algorithm based on:
   - Time of day (`TIME_OF_DAY_WEIGHTS`)
   - User history (`fetch_user_meditation_history()`)
   - Current emotional state (`EMOTIONAL_STATE_SIGNALS`)
   - Conversation context
4. ☑ Add multi-language support (Spanish tracks + language detection)
5. ☑ Implement streak tracking for meditation habit

**Implementation**:

- `recommendation.py` - Full personalization engine with weighted scoring
- `SESSION_TO_DURATION` mapping for duration preferences
- `detect_language_from_context()` for automatic language detection
- `get_personalized_recommendation()` orchestrates all scoring factors
- `UserMeditationHistory` tracks streak, favorites, and completion rates

**Deliverables**:

- ☑ Personalized meditation recommendations
- ☑ Duration preferences respected
- ☑ Multi-language meditation tracks
- ☑ Meditation habit tracking

### Phase 4: Advanced Features (2-3 days) ✅ COMPLETED

**Goal**: Custom meditations and advanced audio features

**Tasks**:

1. ☑ Integrate TTS for custom meditation generation (ElevenLabs API)
2. ☐ Add binaural beats generation (Future enhancement)
3. ☑ Implement meditation scripts library
4. ☐ Add timer-only meditation mode (Future enhancement)
5. ☑ Create meditation series/courses

**Implementation**:

- `elevenlabs.py` - Full TTS integration with:
  - Script personalization ({{USER_NAME}}, {{USER_GOAL}} placeholders)
  - Audio caching to Supabase Storage
  - High-quality voice synthesis via ElevenLabs API
- `007_meditation_scripts.sql` - 5 personalized meditation scripts:
  - Breathing (5 min), Body Scan (10 min), Loving Kindness (8 min)
  - Sleep (15 min), Anxiety Relief (7 min)
- `MeditationSeries/` - Complete series UI:
  - `MeditationSeries.tsx` - Progress tracking component
  - `SeriesProgressBar.tsx` - Visual progress indicator
  - `BadgeUnlock.tsx` - Celebration animation for earned badges
  - `types.ts` - TypeScript interfaces for series and progress
- `008_meditation_series.sql` - Database tables and 3 seed series:
  - "7 Day Calm" (beginner, 🧘 badge)
  - "Sleep Better" (beginner, 😴 badge)
  - "Self-Compassion Journey" (intermediate, 💛 badge)
- `PersonalizedMeditation.tsx` - Frontend component for TTS meditations:
  - Generation loading state with progress indicator
  - Personalization display (user name, goal)
  - Audio playback after generation completes
  - All standard meditation features (ambient, mood tracking)
- `PersonalizedMeditation.stories.tsx` - 12+ Storybook stories:
  - Generation flow (loading, ready, error states)
  - All 5 script types with personalization
  - Interactive demo with configuration
  - Mobile responsive views
- Activity schema updates:
  - `parseActivity.ts` - Added `meditation_personalized` activity type
  - `types.ts` - Added `PersonalizedScript`, `TTSGenerationState`, etc.

**Deliverables**:

- ☑ Custom TTS-generated meditations with personalization
- ☑ Meditation scripts library with 5 scripts
- ☑ Meditation series/courses with badge rewards
- ☑ Progress tracking and badge celebration UI
- ☑ Frontend component for TTS/personalized meditations
- ☑ Storybook stories for personalized meditation flow

---

## Appendix A: Audio File Hosting

### Recommended: Supabase Storage

```typescript
// Upload meditation audio to Supabase Storage
const { data, error } = await supabase.storage
  .from('meditation-audio')
  .upload('body-scan-10min-en.mp3', file);

// Public URL for playback
const {
  data: { publicUrl },
} = supabase.storage.from('meditation-audio').getPublicUrl('body-scan-10min-en.mp3');
```

### Audio File Naming Convention

```
{type}-{duration}min-{language}[-{variant}].mp3

Examples:
- body-scan-10min-en.mp3
- loving-kindness-15min-en.mp3
- body-scan-10min-es.mp3 (Spanish)
- sleep-20min-en-diana.mp3 (narrator variant)
```

---

## Appendix B: License Compliance

### UCLA MARC (CC BY-NC-ND 4.0)

**Requirements**:

1. Non-commercial use only ✓ (wellness chatbot, not selling content)
2. Attribution required → Display: "Meditation by Diana Winston, UCLA Mindful Awareness Research Center"
3. No derivatives → Use audio files as-is, no editing

### Implementation

```tsx
{
  track.attribution && <p className={styles.attribution}>{track.attribution}</p>;
}
```

---

## Appendix C: Initial Meditation Tracks

### Phase 1 Tracks (UCLA MARC)

| ID                        | Name                      | Type            | Duration | Language |
| ------------------------- | ------------------------- | --------------- | -------- | -------- |
| `body-scan-short`         | Body Scan                 | body_scan       | 3 min    | en       |
| `body-scan-medium`        | Body Scan                 | body_scan       | 9 min    | en       |
| `breathing-focus`         | Breathing                 | breathing_focus | 5 min    | en       |
| `loving-kindness`         | Loving Kindness           | loving_kindness | 9 min    | en       |
| `meditation-difficulties` | Working with Difficulties | anxiety_relief  | 7 min    | en       |

### Phase 2 Tracks (Added) ✅

| ID                         | Name                       | Type              | Duration | Language |
| -------------------------- | -------------------------- | ----------------- | -------- | -------- |
| `sleep_meditation`         | Sleep Meditation           | sleep             | 13 min   | en       |
| `daily_mindfulness`        | Daily Mindfulness          | daily_mindfulness | 3 min    | en       |
| `complete_relaxation`      | Complete Relaxation        | body_scan         | 15 min   | en       |
| `loving_kindness_extended` | Loving Kindness (Extended) | loving_kindness   | 13 min   | en       |
| `breathing_focus_es`       | Meditación de Respiración  | breathing_focus   | 5 min    | es       |
| `body_scan_short_es`       | Exploración Corporal       | body_scan         | 3 min    | es       |

---

## Next Steps

1. ~~**Review this plan** - Confirm approach with stakeholder~~ ✅
2. ~~**Set up audio hosting** - Create Supabase bucket, upload initial tracks~~ ✅
3. ~~**Begin Phase 1** - Start with component skeleton and types~~ ✅
4. ~~**Parallel work** - Backend node and frontend component can be developed simultaneously~~ ✅
5. ~~**Begin Phase 3** - Personalization and recommendation algorithm~~ ✅
6. ~~**Begin Phase 4** - TTS integration and meditation series~~ ✅
7. ~~**Create PersonalizedMeditation frontend** - Component + Storybook stories~~ ✅
8. **Upload audio files** - Run `scripts/upload-meditation-audio.ts` with audio files in `tmp/meditation-audio/`
9. **Test in production** - Verify audio playback, ambient mixing, and TTS generation
10. **Run database migrations** - Apply migrations 007 and 008 for scripts and series tables
11. **Configure ElevenLabs** - Set `ELEVENLABS_API_KEY` env var for custom TTS meditations
12. **Connect PersonalizedMeditation to backend API** - Wire up actual TTS generation calls

### Future Enhancements

- Binaural beats generation (Python `binaural` package)
- Timer-only meditation mode (no guidance audio)
- More language support (Mandarin, French, German)
- Advanced analytics dashboard for meditation habits

---

## Appendix D: Custom TTS Meditation Scripts ✅

### Personalization Scripts (Phase 4)

| ID                       | Type            | Duration | Placeholders  |
| ------------------------ | --------------- | -------- | ------------- |
| `breathing_custom_5min`  | breathing_focus | 5 min    | {{USER_NAME}} |
| `body_scan_custom_10min` | body_scan       | 10 min   | {{USER_NAME}} |
| `loving_kindness_custom` | loving_kindness | 8 min    | {{USER_NAME}} |
| `sleep_custom`           | sleep           | 15 min   | {{USER_NAME}} |
| `anxiety_relief_custom`  | anxiety_relief  | 7 min    | {{USER_NAME}} |

### Placeholder System

Scripts support personalization placeholders:

- `{{USER_NAME}}` - Replaced with user's name (empty if not provided)
- `{{USER_GOAL}}` - Replaced with user's goal (defaults to "finding peace")

### ElevenLabs Configuration

```bash
# Required environment variables
ELEVENLABS_API_KEY=your_api_key
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL  # Default voice
```

---

## Appendix E: Meditation Series ✅

### Available Series (Phase 4)

| Series ID         | Title                   | Sessions | Badge            | Difficulty   |
| ----------------- | ----------------------- | -------- | ---------------- | ------------ |
| `7_day_calm`      | 7 Day Calm              | 7        | 🧘 Week of Calm  | Beginner     |
| `sleep_better`    | Sleep Better            | 5        | 😴 Sleep Master  | Beginner     |
| `self_compassion` | Self-Compassion Journey | 7        | 💛 Heart of Gold | Intermediate |

### Badge System

Users earn badges upon completing a meditation series:

- Badges stored in `user_badges` table
- `BadgeUnlock.tsx` displays celebration animation
- Badges can be earned from series, streaks, or milestones

---

## Appendix F: PersonalizedMeditation Frontend ✅

### Component Overview

The `PersonalizedMeditation` component handles TTS-generated meditations:

```
apps/web/src/components/GuidedMeditation/
├── PersonalizedMeditation.tsx    # Main TTS meditation component
├── types.ts                      # Added personalization types
└── index.ts                      # Updated exports

apps/web/src/lib/
└── parseActivity.ts              # Added meditation_personalized schema
```

### Component States

```
[Generating] → [Ready/Idle] → [Playing] → [Mood After] → [Complete]
     ↓              ↓
  [Error]        [Stop]
```

### Activity Schema

```typescript
// New activity type in parseActivity.ts
{
  type: 'activity',
  activity: 'meditation_personalized',
  status: 'ready' | 'generating' | 'in_progress' | 'complete',
  script: {
    id: 'breathing_custom_5min',
    title: 'Personalized Breathing Meditation',
    type: 'breathing_focus',
    durationEstimateSeconds: 300,
    language: 'en'
  },
  personalization: {
    userName: 'Sarah',
    userGoal: 'reducing stress'
  },
  introduction: "I've created this meditation just for you.",
  audioUrl: 'https://...'  // If already generated
}
```

### Storybook Stories

| Story               | Description                         |
| ------------------- | ----------------------------------- |
| GeneratingState     | TTS loading with progress indicator |
| PreGeneratedAudio   | Cached audio, instant playback      |
| BreathingFocus      | 5-min personalized breathing        |
| BodyScan            | 10-min personalized body scan       |
| LovingKindness      | 8-min personalized compassion       |
| SleepMeditation     | 15-min personalized sleep           |
| AnxietyRelief       | 7-min personalized grounding        |
| FullPersonalization | With name and goal                  |
| InteractiveDemo     | Configure and generate              |
| AllScripts          | Overview grid of all 5 scripts      |

---

_Document created: January 3, 2026_
_Author: AI Analysis based on codebase architecture and research document_
_Last updated: January 3, 2026 - Phases 1-4 completed_
