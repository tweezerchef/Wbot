# Activity Integration Plan: End-to-End Activity Flow

This document outlines the current state, gap analysis, and implementation plan for fully integrating activities between the frontend sidebar navigation and the AI backend.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Gap Analysis](#gap-analysis)
4. [Integration Requirements](#integration-requirements)
5. [Implementation Plan](#implementation-plan)
6. [API Design](#api-design)
7. [Database Schema Changes](#database-schema-changes)
8. [Priority & Effort Estimates](#priority--effort-estimates)

---

## Executive Summary

### Problem Statement

The Wbot application has **two separate paths** for triggering wellness activities:

1. **AI-Driven Path**: User messages trigger AI detection → HITL confirmation → Activity rendering
2. **Direct Navigation Path**: User clicks sidebar → Activity renders immediately (no backend integration)

Currently, these paths operate independently. Direct navigation activities:

- Don't track completion to the backend
- Use placeholder data for gamification (badges, streaks)
- Don't persist mood checks to the database
- Have no connection to the AI's memory/profile system

### Goal

Create a **unified activity system** where:

- Both paths track sessions to the backend
- Completion data feeds into gamification
- User progress informs AI recommendations
- Activities contribute to wellness profile analysis

---

## Current Architecture Analysis

### Frontend Flow (Two Paths)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (apps/web)                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────┐              ┌─────────────────────────────┐   │
│  │   AI-DRIVEN PATH    │              │   DIRECT NAVIGATION PATH    │   │
│  ├─────────────────────┤              ├─────────────────────────────┤   │
│  │ User sends message  │              │ User clicks sidebar item    │   │
│  │         ↓           │              │            ↓                │   │
│  │ AI detects activity │              │ ActivityRenderer opens      │   │
│  │         ↓           │              │            ↓                │   │
│  │ HITL confirmation   │              │ Component renders           │   │
│  │         ↓           │              │ (no backend call)           │   │
│  │ Activity renders in │              │            ↓                │   │
│  │ MessageBubble       │              │ onComplete → closes overlay │   │
│  │         ↓           │              │ (TODO: send to backend)     │   │
│  │ store_memory node   │              └─────────────────────────────┘   │
│  │ saves to backend    │                                                 │
│  └─────────────────────┘                                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Backend Flow (AI Path Only)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (apps/ai)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  START                                                                   │
│    ├─ retrieve_memories (parallel)                                       │
│    ├─ inject_user_context (parallel)                                     │
│    └─ detect_activity (parallel) ← Returns suggested_activity            │
│            ↓                                                             │
│    [BARRIER: prepare_routing]                                            │
│            ↓                                                             │
│    [CONDITIONAL ROUTING]                                                 │
│        ├─ breathing_exercise   → HITL → [ACTIVITY_START]...[ACTIVITY_END]│
│        ├─ meditation_guidance  → HITL → [ACTIVITY_START]...[ACTIVITY_END]│
│        ├─ journaling_prompt    → HITL → [ACTIVITY_START]...[ACTIVITY_END]│
│        └─ generate_response    → Normal text response                    │
│            ↓                                                             │
│    store_memory (saves conversation pair)                                │
│            ↓                                                             │
│    analyze_profile (updates wellness profile)                            │
│            ↓                                                             │
│    END                                                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Files Reference

| Component          | Frontend Path                                                   | Backend Path                             |
| ------------------ | --------------------------------------------------------------- | ---------------------------------------- |
| Activity Parsing   | `apps/web/src/lib/parseActivity.ts`                             | N/A                                      |
| Activity Rendering | `apps/web/src/features/*/components/`                           | N/A                                      |
| Direct Navigation  | `apps/web/src/features/navigation/components/DiscoverNav/`      | N/A                                      |
| Activity Renderer  | `apps/web/src/features/navigation/components/ActivityRenderer/` | N/A                                      |
| Activity Detection | N/A                                                             | `apps/ai/src/nodes/detect_activity/`     |
| Breathing Node     | N/A                                                             | `apps/ai/src/nodes/breathing_exercise/`  |
| Meditation Node    | N/A                                                             | `apps/ai/src/nodes/meditation_guidance/` |
| Journaling Node    | N/A                                                             | `apps/ai/src/nodes/journaling_prompt/`   |
| Profile Analysis   | N/A                                                             | `apps/ai/src/nodes/analyze_profile/`     |
| API Endpoints      | N/A                                                             | `apps/ai/src/api/graph.py`               |

---

## Gap Analysis

### 1. Session Tracking (High Priority)

**Current State**:

- AI-driven activities save via `store_memory` node
- Direct navigation activities have `// TODO` comments for tracking

**Gap**:

- No API endpoint for session completion
- No database tables for activity sessions (only `messages` table)
- Completion stats not captured (technique used, duration, rounds, etc.)

**Impact**:

- No historical activity data
- Gamification can't calculate streaks/badges
- AI can't reference past activity performance

### 2. Gamification Data (Medium Priority)

**Current State**:

```typescript
// ActivityRenderer.tsx
case 'badges':
  // TODO: Fetch actual badges from backend
  return <BadgeGrid badges={PLACEHOLDER_BADGES} />;

case 'streak':
  // TODO: Fetch actual streak from backend
  return <StreakDisplay streakDays={7} />;
```

**Gap**:

- No API endpoints to fetch badges, streaks, goals
- No backend logic to calculate badge unlocks
- No streak calculation based on activity completion

**Impact**:

- Users see fake data
- No motivation/reward loop

### 3. Mood Persistence (Medium Priority)

**Current State**:

```typescript
// ActivityRenderer.tsx
onSelect={(_mood) => {
  // TODO: Save mood to backend
  onClose();
}}
```

**Gap**:

- Mood selection not saved to database
- No API endpoint for mood logging
- `emotional_snapshot` table exists but isn't connected to direct mood checks

**Impact**:

- Mood data lost
- AI can't track mood trends over time
- No mood history visualization

### 4. Meditation Track Playback (Medium Priority)

**Current State**:

```typescript
// For guided meditation from sidebar
case 'guided':
  return (
    <MeditationLibrary
      onPlay={(_meditation) => {
        // TODO: Start guided meditation with selected track
        onClose();
      }}
    />
  );
```

**Gap**:

- Library shows tracks but clicking play just closes
- No transition from library → player component
- Session not tracked

**Impact**:

- Feature appears broken
- Users can't play meditations from library

### 5. AI Awareness of Direct Activities (Low Priority)

**Current State**:

- AI only knows about activities triggered through chat
- Direct navigation activities invisible to AI memory

**Gap**:

- No mechanism to inform AI about directly-triggered activities
- AI can't reference "you did a breathing exercise an hour ago"

**Impact**:

- Disjointed experience
- AI might suggest activities user just did

---

## Integration Requirements

### R1: Activity Session API

Create REST endpoints for activity session management:

```
POST /api/sessions/start
POST /api/sessions/complete
GET  /api/sessions/history
GET  /api/sessions/stats
```

### R2: Gamification API

Create REST endpoints for gamification data:

```
GET  /api/gamification/badges
GET  /api/gamification/streak
GET  /api/gamification/goals
POST /api/gamification/goals (set weekly goals)
```

### R3: Mood Tracking API

Create REST endpoint for mood logging:

```
POST /api/wellness/mood
GET  /api/wellness/mood/history
```

### R4: Frontend Integration

- Hook up ActivityRenderer completion callbacks to API
- Replace placeholder gamification data with real API calls
- Add loading/error states for data fetching

### R5: Database Schema

Add tables for:

- `activity_sessions` - Individual activity completions
- `user_badges` - Badge unlock tracking
- `user_streaks` - Streak calculation cache
- `mood_entries` - Direct mood check logs (separate from AI-analyzed snapshots)

---

## Implementation Plan

### Phase 1: Database Schema & Core APIs (Foundation)

#### 1.1 Database Migrations

Create new tables to support activity tracking:

**Table: `activity_sessions`**

```sql
CREATE TABLE activity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  activity_type TEXT NOT NULL, -- 'breathing', 'meditation', 'journaling'
  activity_variant TEXT, -- 'box', '4-7-8', 'wim_hof', 'guided', 'timer', etc.
  source TEXT NOT NULL, -- 'ai_driven', 'direct_navigation'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  metadata JSONB DEFAULT '{}', -- Activity-specific data
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX idx_activity_sessions_user_id ON activity_sessions(user_id);
CREATE INDEX idx_activity_sessions_activity_type ON activity_sessions(activity_type);
CREATE INDEX idx_activity_sessions_completed_at ON activity_sessions(completed_at);

-- RLS policies
ALTER TABLE activity_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON activity_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON activity_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON activity_sessions FOR UPDATE
  USING (auth.uid() = user_id);
```

**Metadata Examples by Activity Type:**

```jsonc
// Breathing - Box/4-7-8/Coherent/Deep Calm
{
  "technique_id": "box",
  "cycles_completed": 4,
  "technique_config": { "durations": [4, 4, 4, 4] }
}

// Breathing - Wim Hof
{
  "technique_id": "wim_hof",
  "rounds_completed": 3,
  "retention_times": [45, 62, 78],
  "breaths_per_round": 30
}

// Meditation - Timer
{
  "duration_minutes": 10,
  "ambient_sounds": ["rain"],
  "binaural_enabled": true,
  "binaural_frequency": 10
}

// Meditation - Guided
{
  "track_id": "body_scan_medium",
  "track_name": "Body Scan",
  "duration_seconds": 540,
  "completed_percentage": 100
}

// Journaling
{
  "prompt_id": "process_emotions",
  "prompt_category": "processing",
  "word_count": 245,
  "shared_with_ai": true
}
```

**Table: `mood_entries`**

```sql
CREATE TABLE mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  mood_rating INTEGER NOT NULL CHECK (mood_rating BETWEEN 1 AND 5),
  source TEXT NOT NULL, -- 'direct_check', 'ai_prompted'
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_created_at ON mood_entries(created_at);

ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mood entries"
  ON mood_entries FOR ALL
  USING (auth.uid() = user_id);
```

**Table: `user_streaks`** (Cache for performance)

```sql
CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  streak_history JSONB DEFAULT '[]', -- Array of {date, activities}
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak"
  ON user_streaks FOR SELECT
  USING (auth.uid() = user_id);
```

**Table: `user_badges`**

```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  progress JSONB DEFAULT '{}', -- For badges with progress tracking
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges"
  ON user_badges FOR ALL
  USING (auth.uid() = user_id);
```

#### 1.2 Backend API Endpoints

Create new API module: `apps/ai/src/api/activities.py`

```python
# Endpoint definitions (FastAPI style)

@router.post("/api/sessions/start")
async def start_session(request: StartSessionRequest) -> SessionResponse:
    """
    Called when user begins an activity (optional, for tracking abandonment)
    """
    pass

@router.post("/api/sessions/complete")
async def complete_session(request: CompleteSessionRequest) -> SessionResponse:
    """
    Called when user completes an activity
    Records session data and updates streak/badges
    """
    pass

@router.get("/api/sessions/history")
async def get_session_history(
    activity_type: str | None = None,
    limit: int = 20,
    offset: int = 0
) -> SessionHistoryResponse:
    """
    Get user's activity history for display
    """
    pass

@router.get("/api/sessions/stats")
async def get_session_stats() -> SessionStatsResponse:
    """
    Get aggregated stats (total sessions, time, by type, etc.)
    """
    pass

@router.post("/api/wellness/mood")
async def log_mood(request: MoodLogRequest) -> MoodEntryResponse:
    """
    Log a mood check from direct navigation
    """
    pass

@router.get("/api/wellness/mood/history")
async def get_mood_history(
    days: int = 30
) -> MoodHistoryResponse:
    """
    Get mood history for trends visualization
    """
    pass

@router.get("/api/gamification/badges")
async def get_badges() -> BadgesResponse:
    """
    Get all badges with unlock status and progress
    """
    pass

@router.get("/api/gamification/streak")
async def get_streak() -> StreakResponse:
    """
    Get current streak data
    """
    pass

@router.get("/api/gamification/goals")
async def get_goals() -> GoalsResponse:
    """
    Get weekly goals and progress
    """
    pass
```

### Phase 2: Frontend API Integration

#### 2.1 Create API Client Functions

Add to `apps/web/src/lib/api/activities.ts`:

```typescript
// Session tracking
export async function startSession(data: StartSessionData): Promise<Session> { ... }
export async function completeSession(data: CompleteSessionData): Promise<Session> { ... }
export async function getSessionHistory(params?: HistoryParams): Promise<SessionHistory> { ... }
export async function getSessionStats(): Promise<SessionStats> { ... }

// Mood tracking
export async function logMood(data: MoodLogData): Promise<MoodEntry> { ... }
export async function getMoodHistory(days?: number): Promise<MoodHistory> { ... }

// Gamification
export async function getBadges(): Promise<Badge[]> { ... }
export async function getStreak(): Promise<StreakData> { ... }
export async function getGoals(): Promise<Goal[]> { ... }
```

#### 2.2 Create TanStack Query Hooks

Add to `apps/web/src/lib/queries/activities.ts`:

```typescript
// Query keys
export const activityKeys = {
  all: ['activities'] as const,
  sessions: () => [...activityKeys.all, 'sessions'] as const,
  history: (params?: HistoryParams) => [...activityKeys.sessions(), 'history', params] as const,
  stats: () => [...activityKeys.sessions(), 'stats'] as const,
  mood: () => [...activityKeys.all, 'mood'] as const,
  moodHistory: (days?: number) => [...activityKeys.mood(), 'history', days] as const,
  gamification: () => [...activityKeys.all, 'gamification'] as const,
  badges: () => [...activityKeys.gamification(), 'badges'] as const,
  streak: () => [...activityKeys.gamification(), 'streak'] as const,
  goals: () => [...activityKeys.gamification(), 'goals'] as const,
};

// Hooks
export function useSessionHistory(params?: HistoryParams) { ... }
export function useSessionStats() { ... }
export function useMoodHistory(days?: number) { ... }
export function useBadges() { ... }
export function useStreak() { ... }
export function useGoals() { ... }

// Mutations
export function useCompleteSession() { ... }
export function useLogMood() { ... }
```

#### 2.3 Update ActivityRenderer

Wire up completion callbacks:

```typescript
// apps/web/src/features/navigation/components/ActivityRenderer/ActivityRenderer.tsx

import { useCompleteSession, useLogMood } from '@/lib/queries/activities';

export function ActivityRenderer({ component, onClose }: ActivityRendererProps) {
  const completeSession = useCompleteSession();
  const logMood = useLogMood();

  // Breathing exercises
  const handleBreathingComplete = (stats: BreathingStats) => {
    completeSession.mutate(
      {
        activity_type: 'breathing',
        activity_variant: stats.technique,
        source: 'direct_navigation',
        duration_seconds: stats.totalDuration,
        metadata: {
          technique_id: stats.technique,
          cycles_completed: stats.cyclesCompleted,
          technique_config: stats.config,
        },
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  // Wim Hof
  const handleWimHofComplete = (stats: WimHofStats) => {
    completeSession.mutate(
      {
        activity_type: 'breathing',
        activity_variant: 'wim_hof',
        source: 'direct_navigation',
        duration_seconds: stats.totalDuration,
        metadata: {
          technique_id: 'wim_hof',
          rounds_completed: stats.roundsCompleted,
          retention_times: stats.retentionTimes,
          breaths_per_round: stats.breathsPerRound,
        },
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  // Mood check
  const handleMoodSelect = (mood: MoodRating) => {
    logMood.mutate(
      {
        mood_rating: mood,
        source: 'direct_check',
      },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  // ... rest of component
}
```

#### 2.4 Update Gamification Components

Replace placeholders with real data:

```typescript
// apps/web/src/features/navigation/components/ActivityRenderer/ActivityRenderer.tsx

import { useBadges, useStreak, useGoals } from '@/lib/queries/activities';

// In component:
case 'badges':
  return <BadgesWithData onClose={onClose} />;

case 'streak':
  return <StreakWithData onClose={onClose} />;

case 'goals':
  return <GoalsWithData onClose={onClose} />;

// Wrapper components with loading states
function BadgesWithData({ onClose }: { onClose: () => void }) {
  const { data: badges, isLoading, error } = useBadges();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState message="Failed to load badges" />;

  return <BadgeGrid badges={badges} />;
}
```

### Phase 3: Meditation Library Flow

#### 3.1 Fix Guided Meditation Selection

Current broken flow:

```
Library → Click track → Nothing happens (just closes)
```

Target flow:

```
Library → Click track → Transition to GuidedMeditation → Play → Complete → Track session
```

Update ActivityRenderer:

```typescript
// State for active meditation
const [activeMeditation, setActiveMeditation] = useState<MeditationTrack | null>(null);

case 'meditation':
  if (component.variant === 'guided') {
    if (activeMeditation) {
      // Playing a meditation
      return (
        <GuidedMeditation
          track={activeMeditation}
          onComplete={(stats) => {
            completeSession.mutate({
              activity_type: 'meditation',
              activity_variant: 'guided',
              source: 'direct_navigation',
              duration_seconds: stats.listenDuration,
              metadata: {
                track_id: activeMeditation.id,
                track_name: activeMeditation.name,
                completed_percentage: stats.completedPercentage,
              },
            });
            setActiveMeditation(null);
            onClose();
          }}
          onExit={() => setActiveMeditation(null)}
        />
      );
    }
    // Show library for selection
    return (
      <MeditationLibrary
        onPlay={(savedMeditation) => {
          // Convert SavedMeditation to MeditationTrack format
          const track = convertToTrack(savedMeditation);
          setActiveMeditation(track);
        }}
      />
    );
  }
```

### Phase 4: AI Integration (Optional Enhancement)

#### 4.1 Notify AI of Direct Activities

After completing a direct activity, optionally create a synthetic message pair:

```typescript
// After session completion
const notifyAI = async (session: CompletedSession) => {
  // Create a synthetic conversation entry so AI knows about it
  await aiClient.recordActivity({
    activity_type: session.activity_type,
    activity_variant: session.activity_variant,
    completed_at: session.completed_at,
    duration_seconds: session.duration_seconds,
    source: 'direct_navigation',
  });
};
```

Backend endpoint:

```python
@router.post("/api/activities/record")
async def record_activity(request: RecordActivityRequest):
    """
    Creates a synthetic memory entry for directly-triggered activities
    so the AI can reference them in future conversations.
    """
    # Create minimal message pair
    user_message = f"[User completed {request.activity_type} via direct navigation]"
    ai_response = f"[Activity recorded: {request.activity_variant} for {request.duration_seconds}s]"

    # Store to memory system
    await store_memory(user_message, ai_response, user_id)
```

---

## API Design

### Session Endpoints

#### POST /api/sessions/complete

**Request:**

```typescript
interface CompleteSessionRequest {
  activity_type: 'breathing' | 'meditation' | 'journaling';
  activity_variant: string;
  source: 'ai_driven' | 'direct_navigation';
  started_at?: string; // ISO timestamp
  duration_seconds: number;
  metadata: Record<string, unknown>;
}
```

**Response:**

```typescript
interface SessionResponse {
  id: string;
  activity_type: string;
  activity_variant: string;
  duration_seconds: number;
  completed_at: string;
  streak_updated: boolean;
  badges_earned: string[]; // Any newly unlocked badges
}
```

#### GET /api/sessions/history

**Query Params:**

- `activity_type` (optional): Filter by type
- `limit`: Default 20
- `offset`: For pagination

**Response:**

```typescript
interface SessionHistoryResponse {
  sessions: Session[];
  total: number;
  has_more: boolean;
}
```

### Gamification Endpoints

#### GET /api/gamification/badges

**Response:**

```typescript
interface BadgesResponse {
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'breathing' | 'meditation' | 'journaling' | 'streak' | 'milestone';
    unlocked: boolean;
    unlocked_at?: string;
    progress?: number; // 0-100 for in-progress badges
    requirement: string; // Human-readable requirement
  }>;
}
```

#### GET /api/gamification/streak

**Response:**

```typescript
interface StreakResponse {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
  today_completed: boolean;
  streak_history: Array<{
    date: string;
    activity_count: number;
  }>;
}
```

### Mood Endpoints

#### POST /api/wellness/mood

**Request:**

```typescript
interface MoodLogRequest {
  mood_rating: 1 | 2 | 3 | 4 | 5;
  source: 'direct_check' | 'ai_prompted';
  notes?: string;
}
```

---

## Database Schema Changes

### New Tables Summary

| Table               | Purpose                        | Key Columns                                                 |
| ------------------- | ------------------------------ | ----------------------------------------------------------- |
| `activity_sessions` | Track all activity completions | user_id, activity_type, variant, source, duration, metadata |
| `mood_entries`      | Direct mood check logs         | user_id, mood_rating, source, notes                         |
| `user_streaks`      | Cached streak calculations     | user_id, current_streak, longest_streak, last_activity_date |
| `user_badges`       | Badge unlock tracking          | user_id, badge_id, unlocked_at, progress                    |

### Badge Definitions (Code Constants)

Badges defined in code, unlock status in database:

```python
BADGES = {
    # Breathing badges
    "first_breath": {
        "name": "First Breath",
        "description": "Complete your first breathing exercise",
        "requirement": "Complete 1 breathing session",
        "check": lambda stats: stats.breathing_count >= 1
    },
    "breath_master": {
        "name": "Breath Master",
        "description": "Complete 50 breathing exercises",
        "requirement": "Complete 50 breathing sessions",
        "check": lambda stats: stats.breathing_count >= 50
    },
    "wim_hof_warrior": {
        "name": "Wim Hof Warrior",
        "description": "Complete 10 Wim Hof sessions",
        "requirement": "Complete 10 Wim Hof sessions",
        "check": lambda stats: stats.wim_hof_count >= 10
    },

    # Streak badges
    "week_streak": {
        "name": "Week Warrior",
        "description": "Maintain a 7-day streak",
        "requirement": "7 consecutive days of activity",
        "check": lambda stats: stats.current_streak >= 7
    },
    "month_streak": {
        "name": "Monthly Master",
        "description": "Maintain a 30-day streak",
        "requirement": "30 consecutive days of activity",
        "check": lambda stats: stats.current_streak >= 30
    },

    # Meditation badges
    "first_meditation": {
        "name": "First Sit",
        "description": "Complete your first meditation",
        "requirement": "Complete 1 meditation session",
        "check": lambda stats: stats.meditation_count >= 1
    },
    "zen_master": {
        "name": "Zen Master",
        "description": "Meditate for 10 hours total",
        "requirement": "Accumulate 10 hours of meditation",
        "check": lambda stats: stats.meditation_minutes >= 600
    },

    # Journaling badges
    "first_journal": {
        "name": "First Entry",
        "description": "Complete your first journal entry",
        "requirement": "Complete 1 journaling session",
        "check": lambda stats: stats.journaling_count >= 1
    },
    "reflective_soul": {
        "name": "Reflective Soul",
        "description": "Write 20 journal entries",
        "requirement": "Complete 20 journaling sessions",
        "check": lambda stats: stats.journaling_count >= 20
    },
}
```

---

## Priority & Effort Estimates

### High Priority (Do First)

| Task                               | Effort  | Impact | Dependencies |
| ---------------------------------- | ------- | ------ | ------------ |
| Create `activity_sessions` table   | 1 hour  | High   | None         |
| Create session completion API      | 2 hours | High   | Database     |
| Wire up ActivityRenderer callbacks | 2 hours | High   | API          |
| Create `mood_entries` table        | 30 min  | Medium | None         |
| Create mood logging API            | 1 hour  | Medium | Database     |
| Wire up MoodCheck callback         | 30 min  | Medium | API          |

**Total: ~7 hours**

### Medium Priority (Core Features)

| Task                               | Effort  | Impact | Dependencies      |
| ---------------------------------- | ------- | ------ | ----------------- |
| Create `user_streaks` table        | 30 min  | Medium | None              |
| Implement streak calculation logic | 2 hours | Medium | activity_sessions |
| Create streak API                  | 1 hour  | Medium | Streak logic      |
| Create `user_badges` table         | 30 min  | Medium | None              |
| Define badge requirements          | 1 hour  | Medium | None              |
| Implement badge check logic        | 2 hours | Medium | Badge definitions |
| Create badges API                  | 1 hour  | Medium | Badge logic       |
| Update gamification components     | 2 hours | Medium | APIs              |

**Total: ~10 hours**

### Medium Priority (UX Improvements)

| Task                        | Effort  | Impact | Dependencies |
| --------------------------- | ------- | ------ | ------------ |
| Fix meditation library flow | 3 hours | High   | None         |
| Add loading states          | 1 hour  | Medium | None         |
| Add error states            | 1 hour  | Medium | None         |
| Add success toasts          | 1 hour  | Low    | None         |

**Total: ~6 hours**

### Low Priority (Nice to Have)

| Task                                 | Effort  | Impact | Dependencies |
| ------------------------------------ | ------- | ------ | ------------ |
| AI notification of direct activities | 3 hours | Low    | Core APIs    |
| Session history UI                   | 4 hours | Low    | History API  |
| Mood trends visualization            | 4 hours | Low    | Mood API     |
| Weekly goals system                  | 6 hours | Medium | Core APIs    |

**Total: ~17 hours**

---

## Implementation Order

### Sprint 1: Foundation (Week 1)

1. Database migrations for `activity_sessions` and `mood_entries`
2. Session completion API endpoint
3. Mood logging API endpoint
4. Wire up ActivityRenderer to APIs
5. Test end-to-end flow

### Sprint 2: Gamification (Week 2)

1. Database migrations for `user_streaks` and `user_badges`
2. Streak calculation logic and API
3. Badge definitions and check logic
4. Badges API
5. Update gamification components with real data

### Sprint 3: Polish (Week 3)

1. Fix meditation library → player flow
2. Add loading/error/success states
3. Session history API and basic UI
4. Mood history API
5. Testing and bug fixes

### Sprint 4: Enhancement (Optional)

1. AI notification of direct activities
2. Mood trends visualization
3. Weekly goals system
4. Activity recommendations based on history

---

## Files to Create/Modify

### New Files

```
apps/ai/src/api/activities.py          # New API endpoints
apps/web/src/lib/api/activities.ts     # API client functions
apps/web/src/lib/queries/activities.ts # TanStack Query hooks
supabase/migrations/XXXXXXXX_activity_sessions.sql
supabase/migrations/XXXXXXXX_mood_entries.sql
supabase/migrations/XXXXXXXX_gamification.sql
```

### Files to Modify

```
apps/web/src/features/navigation/components/ActivityRenderer/ActivityRenderer.tsx
apps/web/src/features/gamification/components/BadgeGrid/BadgeGrid.tsx
apps/web/src/features/gamification/components/StreakDisplay/StreakDisplay.tsx
apps/web/src/features/gamification/components/WeeklyGoals/WeeklyGoals.tsx
apps/web/src/features/wellness/components/MoodCheck/MoodCheck.tsx
```

---

## Success Criteria

### Phase 1 Complete When

- [ ] User completes breathing from sidebar → Session saved to database
- [ ] User completes Wim Hof from sidebar → Session saved with round data
- [ ] User completes timer meditation → Session saved
- [ ] User logs mood from sidebar → Entry saved to database

### Phase 2 Complete When

- [ ] Streak display shows real calculated streak
- [ ] Badges show actual unlock status and progress
- [ ] Completing activities updates streak same day
- [ ] New badges unlock and display correctly

### Phase 3 Complete When

- [ ] Guided meditation flow works end-to-end
- [ ] All components have loading states
- [ ] All components have error states
- [ ] User can view activity history

---

## Appendix: Existing TODOs from Code

From `docs/direct-navigation-todos.md`:

1. **WimHofExercise** (line ~128): Send completion stats to backend
2. **ImmersiveBreathing** (line ~146): Send completion stats to backend
3. **TimerMeditation** (line ~168): Send completion to backend
4. **GuidedMeditation** (line ~175-185): Start guided meditation with selected track
5. **MeditationLibrary** (line ~191): Handle track selection - start playback
6. **MoodCheck** (line ~217): Save mood to backend
7. **BadgeGrid** (line ~232): Fetch actual badges from backend
8. **StreakDisplay** (line ~236): Fetch actual streak from backend

All of these are addressed in this integration plan.
