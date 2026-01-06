# User Profiling & Analysis System Research

> **Purpose**: Research and planning document for adding comprehensive user analysis, profiling, and personalization capabilities to the Wbot wellness chatbot.
>
> **Date**: January 5, 2025

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [What Data Should We Track](#what-data-should-we-track)
4. [LangGraph Implementation Best Practices](#langgraph-implementation-best-practices)
5. [Proposed Database Schema](#proposed-database-schema)
6. [Recommended Implementation](#recommended-implementation-end-of-graph-analysis-node)
7. [Privacy & Security Considerations](#privacy--security-considerations)
8. [Implementation Plan](#implementation-plan)
9. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

This document outlines a comprehensive plan for adding user profiling and analysis capabilities to Wbot. The goal is to:

1. **Analyze conversations** at the end of each graph execution to extract meaningful user insights
2. **Store profile data** in both the database (persistent) and thread state (runtime)
3. **Integrate profile data** into LLM calls to enhance personalization
4. **Enable efficient recall** of critical information across conversations

### Key Findings

- LangGraph's **Store API** provides the recommended abstraction for cross-thread long-term memory
- Wellness apps should track **emotional patterns**, **engagement metrics**, **technique effectiveness**, and **progress toward goals**
- A **multi-tier memory system** (episodic + semantic + profile) is the gold standard for personalization
- **Structured LLM extraction** via Pydantic models ensures reliable analysis output

---

## Current Architecture Analysis

### Existing Graph Flow

```
START → [3 parallel paths]
├─ retrieve_memories (semantic search)
├─ inject_user_context → prepare_routing (barrier)
└─ detect_activity ────→ prepare_routing

From barrier → route_activity (conditional routing)
├─ breathing_exercise (immediate, no memory wait)
├─ generate_response (waits for retrieve_memories)
└─ generate_meditation_script (waits for retrieve_memories)

All paths → store_memory → END
```

### Current User Profiling

**Onboarding Data Collected** (8 questions):

- `current_feeling`: great | okay | stressed | anxious | sad | numb
- `primary_goal`: stress_anxiety | mood | sleep | emotions | habits | growth | talk
- `challenges[]`: racing_thoughts, sleep_issues, work_stress, relationships, etc.
- `communication_style`: direct | warm | reflective | structured
- `support_type`: listening | advice | encouragement | understanding | guided
- `preferred_activities[]`: chat, breathing, meditation, journaling, grounding, mood_tracking
- `experience_level`: first_time | tried_apps | some_therapy | regular_practice
- `session_length`: few_minutes | short | medium | long | flexible

**Storage**: `profiles.preferences` JSONB column

**Current Memory System**:

- **Short-term**: Thread-scoped message history (LangGraph checkpointer)
- **Semantic memories**: User/AI message pairs with vector embeddings (`memories` table)
- **User context**: Static onboarding preferences injected into system prompt

### Gaps Identified

| Gap                            | Description                                            |
| ------------------------------ | ------------------------------------------------------ |
| **No dynamic profile updates** | User preferences never update based on actual behavior |
| **No emotional tracking**      | Emotional states aren't tracked over time              |
| **No effectiveness metrics**   | No measurement of which techniques help most           |
| **No progress tracking**       | No measurement toward stated goals                     |
| **No behavioral patterns**     | Engagement patterns not analyzed                       |
| **No conversation analysis**   | Individual conversations aren't analyzed for insights  |

---

## What Data Should We Track

Based on research from mental health app best practices and academic literature, here are the key data categories:

### 1. Emotional State Tracking

Track emotional states detected in conversations over time.

```python
class EmotionalState:
    primary_emotion: str          # anxiety, sadness, stress, calm, joy, etc.
    intensity: float              # 0.0-1.0 scale
    valence: float                # -1.0 (negative) to 1.0 (positive)
    arousal: float                # 0.0 (calm) to 1.0 (activated)
    detected_triggers: list[str]  # work, relationships, health, etc.
    timestamp: datetime
```

**Why**: Mental health apps that track mood over time can offer personalized advice based on data trends ([PMC Research](https://pmc.ncbi.nlm.nih.gov/articles/PMC10360018/)).

### 2. Conversation Insights

Extract structured insights from each conversation.

```python
class ConversationInsight:
    # Content analysis
    topics_discussed: list[str]       # What was talked about
    concerns_raised: list[str]        # Specific worries mentioned
    positive_aspects: list[str]       # Good things mentioned
    coping_strategies_mentioned: list[str]

    # User state signals
    emotional_trajectory: str         # improving | stable | declining
    engagement_level: str             # high | medium | low
    openness_level: str               # very_open | somewhat_open | guarded

    # Actionable items
    follow_up_topics: list[str]       # Things to check in about
    suggested_activities: list[str]   # Activities that might help

    # Meta
    conversation_type: str            # venting | seeking_advice | checking_in | activity
    session_quality: str              # productive | neutral | difficult
```

**Why**: Research shows that extracting structured insights enables better personalization than raw conversation history ([InsightLens Research](https://arxiv.org/html/2404.01644v2)).

### 3. Activity Effectiveness

Track how well different activities work for the user.

```python
class ActivityEffectiveness:
    activity_type: str          # breathing | meditation | journaling
    technique: str              # wim_hof | 4_7_8 | body_scan | etc.

    # Engagement metrics
    times_completed: int
    times_started_not_finished: int
    average_duration: float

    # Effectiveness signals
    mood_change_avg: float      # -5 to +5 scale
    user_feedback: list[str]    # "that helped", "didn't work", etc.
    contexts_when_helpful: list[str]  # "before_sleep", "anxiety", etc.

    # Recommendation score
    effectiveness_score: float  # Calculated composite score
```

**Why**: AI chatbots that analyze user interactions and data develop personalized mental health plans by tracking user behavior over time ([ValueCoders](https://www.valuecoders.com/blog/ai-ml/how-chatbots-are-changing-mental-healthcare/)).

### 4. User Profile Evolution

Track how the user's profile evolves over time.

```python
class UserProfileSnapshot:
    # Current state (updates each session)
    current_primary_concern: str
    current_emotional_baseline: str   # anxious | stressed | neutral | positive
    current_engagement_level: str

    # Learned preferences (refined from behavior)
    actual_communication_style: str   # May differ from stated preference
    actual_session_length_preference: str
    preferred_time_of_day: str

    # Progress tracking
    goals_progress: dict[str, float]  # goal -> progress percentage
    improvements_noted: list[str]
    challenges_persisting: list[str]

    # Behavioral patterns
    typical_topics: list[str]
    conversation_frequency: str       # daily | few_times_week | weekly | sporadic
    engagement_trend: str             # increasing | stable | decreasing
```

### 5. Long-term Patterns

Higher-level analysis across multiple conversations.

```python
class LongTermPatterns:
    # Temporal patterns
    mood_by_day_of_week: dict[str, float]
    mood_by_time_of_day: dict[str, float]
    stress_triggers_recurring: list[str]

    # Relationship patterns
    relationship_topics_frequency: dict[str, int]
    work_stress_correlation: float

    # Progress indicators
    emotional_stability_trend: str    # improving | stable | declining
    coping_skills_development: list[str]
    resilience_indicators: list[str]

    # Wellness journey
    milestone_achievements: list[str]
    areas_of_growth: list[str]
    recommended_focus_areas: list[str]
```

---

## LangGraph Implementation Best Practices

### LangGraph Memory Architecture

LangGraph provides two types of memory ([LangChain Docs](https://docs.langchain.com/oss/python/concepts/memory)):

1. **Short-term memory** (Thread-scoped): Conversation history within a session
2. **Long-term memory** (Store): Cross-thread data like user profiles

### Recommended: Use LangGraph Store API

The Store API is the official LangGraph primitive for long-term memory:

```python
from langgraph.store.base import BaseStore
from langgraph.graph import StateGraph

async def analyze_and_store_profile(
    state: WellnessState,
    config: RunnableConfig,
    *,
    store: BaseStore
):
    user_id = config["configurable"]["user_id"]

    # Namespace for different profile types
    insights_ns = (user_id, "conversation_insights")
    profile_ns = (user_id, "profile")
    patterns_ns = (user_id, "patterns")

    # Store conversation insight
    insight_id = str(uuid.uuid4())
    store.put(insights_ns, insight_id, {"insight": insight_data})

    # Update user profile
    store.put(profile_ns, "current", {"profile": profile_data})

    # Search for similar past insights
    similar = store.search(insights_ns, query="anxiety work stress", limit=5)
```

### Enable Semantic Search in Store

Configure in `langgraph.json` to use Gemini embeddings (matching our existing memory system):

```json
{
  "store": {
    "index": {
      "embed": "google_genai:models/gemini-embedding-001",
      "dims": 768,
      "fields": ["$"]
    }
  }
}
```

> **Note**: We use Gemini's `gemini-embedding-001` model (768 dimensions) for consistency
> with our existing `memories` table embeddings. This ensures we can share embedding
> utilities and maintain consistent semantic similarity across the system.

### Node Pattern for Profile Analysis

```python
from pydantic import BaseModel, Field
from langgraph.store.base import BaseStore

class ConversationAnalysis(BaseModel):
    """Structured output for conversation analysis"""
    primary_emotion: str = Field(description="Main emotion detected")
    intensity: float = Field(ge=0, le=1, description="Emotion intensity 0-1")
    topics: list[str] = Field(description="Topics discussed")
    concerns: list[str] = Field(description="Concerns raised")
    follow_ups: list[str] = Field(description="Topics to follow up on")
    suggested_activities: list[str] = Field(description="Recommended activities")
    conversation_type: str = Field(description="Type: venting/advice/checking_in")
    emotional_trajectory: str = Field(description="improving/stable/declining")

async def analyze_conversation(
    state: WellnessState,
    config: RunnableConfig,
    *,
    store: BaseStore
) -> dict:
    """Analyze the conversation and extract insights"""

    # Use FAST tier model for analysis (cost-effective)
    llm = create_llm(tier=ModelTier.FAST)
    structured_llm = llm.with_structured_output(ConversationAnalysis)

    # Build analysis prompt
    messages = state.get("messages", [])
    analysis_prompt = f"""
    Analyze this wellness conversation and extract structured insights.
    Focus on emotional state, topics, and what might help this user.

    Conversation:
    {format_messages(messages)}
    """

    # Get structured analysis
    analysis = await structured_llm.ainvoke(analysis_prompt)

    # Store in long-term memory
    user_id = config["configurable"]["user_id"]
    conversation_id = config["configurable"].get("thread_id")

    store.put(
        (user_id, "insights"),
        str(uuid.uuid4()),
        {
            "analysis": analysis.model_dump(),
            "conversation_id": conversation_id,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

    return {"conversation_analysis": analysis.model_dump()}
```

### Integrating Profile into LLM Calls

Retrieve and inject profile data in response generation:

```python
async def generate_response(
    state: WellnessState,
    config: RunnableConfig,
    *,
    store: BaseStore
) -> dict:
    user_id = config["configurable"]["user_id"]

    # Retrieve current profile
    profile_item = store.get((user_id, "profile"), "current")
    profile = profile_item.value if profile_item else {}

    # Retrieve recent insights for context
    recent_insights = store.search(
        (user_id, "insights"),
        query=state["messages"][-1].content,
        limit=3
    )

    # Format profile context for system prompt
    profile_context = format_profile_for_prompt(profile, recent_insights)

    # Generate response with enriched context
    system_prompt = WELLNESS_SYSTEM_PROMPT.format(
        user_context=profile_context
    )
    # ... rest of generation
```

---

## Proposed Database Schema

### Entity Relationship Diagram

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              EXISTING TABLES                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐      ┌─────────────────┐      ┌──────────────┐                │
│  │  auth.users  │──1:1─│    profiles     │──1:N─│conversations │                │
│  │  (Supabase)  │      │                 │      │              │                │
│  └──────────────┘      │ - id (PK)       │      │ - id (PK)    │                │
│                        │ - display_name  │      │ - user_id    │──1:N──┐       │
│                        │ - preferences   │      │ - title      │       │       │
│                        └────────┬────────┘      └──────┬───────┘       │       │
│                                 │                      │               │       │
│                                 │ 1:N                  │ 1:N           │       │
│                                 │                      │               ▼       │
│                                 │               ┌──────┴───────┐  ┌──────────┐ │
│                                 │               │   messages   │  │ memories │ │
│                                 │               │              │  │          │ │
│                                 │               │ - id (PK)    │  │ - id     │ │
│                                 │               │ - conv_id    │  │ - user_id│ │
│                                 │               │ - role       │  │ - conv_id│ │
│                                 │               │ - content    │  │ - embed  │ │
│                                 │               └──────────────┘  └──────────┘ │
│                                 │                                              │
│        ┌────────────────────────┴───────────────────────────────┐              │
│        │                        │                               │              │
│        ▼ 1:N                    ▼ 1:N                           ▼ 1:N         │
│  ┌──────────────────┐   ┌────────────────────┐   ┌──────────────────────────┐ │
│  │breathing_sessions│   │meditation_sessions │   │user_generated_meditations│ │
│  │                  │   │                    │   │                          │ │
│  │ - user_id        │   │ - user_id          │   │ - user_id                │ │
│  │ - conversation_id│   │ - conversation_id  │   │ - conversation_id        │ │
│  │ - mood_before    │   │ - mood_before      │   │ - mood_before            │ │
│  │ - mood_after     │   │ - mood_after       │   │ - mood_after             │ │
│  └──────────────────┘   └────────────────────┘   └──────────────────────────┘ │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              NEW PROFILING TABLES                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  From profiles.id:                                                              │
│        │                                                                         │
│        ├──1:1──▶ ┌─────────────────────────┐                                   │
│        │         │ user_wellness_profiles  │  (Dynamic profile - one per user) │
│        │         │                         │                                    │
│        │         │ - user_id (PK, FK)      │                                   │
│        │         │ - emotional_baseline    │                                    │
│        │         │ - engagement_trend      │                                    │
│        │         │ - goals_progress (JSON) │                                   │
│        │         │ - learned_preferences   │                                    │
│        │         └─────────────────────────┘                                   │
│        │                                                                         │
│        ├──1:N──▶ ┌─────────────────────────┐                                   │
│        │         │ conversation_analyses   │  (Analysis per conversation)      │
│        │         │                         │                                    │
│        │         │ - id (PK)               │                                   │
│        │         │ - user_id (FK)          │──────┐                            │
│        │         │ - conversation_id (FK)  │◀─────┼── Links to conversations   │
│        │         │ - message_id (FK)       │◀─────┼── Links to triggering msg  │
│        │         │ - emotional_state       │      │                            │
│        │         │ - topics[]              │                                   │
│        │         │ - insights (JSON)       │                                   │
│        │         │ - embedding             │  (For semantic search)            │
│        │         └─────────────────────────┘                                   │
│        │                                                                         │
│        ├──1:N──▶ ┌─────────────────────────┐                                   │
│        │         │  emotional_snapshots    │  (Time-series emotional data)     │
│        │         │                         │                                    │
│        │         │ - id (PK)               │                                   │
│        │         │ - user_id (FK)          │                                   │
│        │         │ - conversation_id (FK)  │  (Optional - when detected)       │
│        │         │ - emotion, intensity    │                                   │
│        │         │ - triggers[]            │                                   │
│        │         │ - source                │  (conversation/activity/checkin)  │
│        │         └─────────────────────────┘                                   │
│        │                                                                         │
│        └──1:N──▶ ┌─────────────────────────┐                                   │
│                  │ activity_effectiveness  │  (Aggregated from sessions)       │
│                  │                         │                                    │
│                  │ - id (PK)               │                                   │
│                  │ - user_id (FK)          │                                   │
│                  │ - activity_type         │  (breathing/meditation/journal)   │
│                  │ - technique             │  (wim_hof/4_7_8/body_scan/etc)    │
│                  │ - effectiveness_score   │  (Calculated from mood changes)   │
│                  │ - UNIQUE(user,type,tech)│                                   │
│                  └─────────────────────────┘                                   │
│                           ▲                                                     │
│                           │ Aggregated from                                     │
│                           │                                                     │
│           ┌───────────────┴───────────────┐                                    │
│           │                               │                                     │
│  breathing_sessions            meditation_sessions                             │
│  (mood_before, mood_after)     (mood_before, mood_after)                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Key Relationships

| New Table                | Links To        | Relationship   | Purpose                                      |
| ------------------------ | --------------- | -------------- | -------------------------------------------- |
| `user_wellness_profiles` | `profiles`      | 1:1 (PK=FK)    | Dynamic profile extending static preferences |
| `conversation_analyses`  | `profiles`      | N:1            | User ownership                               |
| `conversation_analyses`  | `conversations` | N:1            | Which conversation was analyzed              |
| `conversation_analyses`  | `messages`      | N:1            | Which message triggered analysis             |
| `emotional_snapshots`    | `profiles`      | N:1            | User ownership                               |
| `emotional_snapshots`    | `conversations` | N:1 (optional) | Context when detected in conversation        |
| `activity_effectiveness` | `profiles`      | N:1            | User ownership                               |

### Migration SQL

```sql
-- ============================================================================
-- Migration: User Profiling Tables
-- Purpose: Add comprehensive user profiling and analysis capabilities
-- ============================================================================

-- ============================================================================
-- TABLE 1: user_wellness_profiles
-- ============================================================================
-- Single row per user containing dynamic profile data that evolves over time.
-- Extends the static preferences in profiles.preferences with learned patterns.
-- Uses user_id as PK to enforce 1:1 relationship with profiles.
-- ============================================================================

CREATE TABLE user_wellness_profiles (
    -- Primary key is also foreign key to profiles (1:1 relationship)
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,

    -- Current emotional state (updated each session)
    -- Represents the user's baseline emotional state based on recent interactions
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

    -- Learned communication preferences (may differ from stated preferences)
    -- These are derived from actual interactions, not onboarding answers
    actual_communication_style TEXT CHECK (actual_communication_style IN (
        'direct', 'warm', 'reflective', 'structured', 'mixed'
    )),
    responds_well_to TEXT[], -- e.g., ['validation', 'practical_advice', 'questions']

    -- Current focus and concerns
    current_primary_concern TEXT,
    recurring_topics TEXT[],
    recurring_triggers TEXT[],

    -- Progress tracking toward stated goals
    -- Keys match primary_goal from preferences: stress_anxiety, mood, sleep, etc.
    goals_progress JSONB DEFAULT '{}'::JSONB,
    -- Example: {"stress_anxiety": {"score": 0.6, "trend": "improving", "notes": ["practicing breathing"]}}

    improvements_noted TEXT[],
    challenges_persisting TEXT[],

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

-- Trigger to auto-update updated_at
CREATE TRIGGER user_wellness_profiles_updated_at
    BEFORE UPDATE ON user_wellness_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE user_wellness_profiles IS
    'Dynamic user profile that evolves based on interactions. 1:1 with profiles table.';

-- ============================================================================
-- TABLE 2: conversation_analyses
-- ============================================================================
-- Stores structured analysis of each conversation.
-- Links to: user (owner), conversation (analyzed), message (trigger point).
-- Includes embedding for semantic search across past analyses.
-- ============================================================================

CREATE TABLE conversation_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link to user (required for RLS and queries)
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Link to the conversation being analyzed
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- Link to the specific message that triggered/ended the analysis
    -- This helps correlate analysis with conversation timeline
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

    -- Full analysis as structured JSON (for flexibility)
    analysis_json JSONB DEFAULT '{}'::JSONB,

    -- Searchable summary text for semantic search
    analysis_summary TEXT,
    -- Vector embedding of analysis_summary (768 dims for Gemini)
    embedding halfvec(768),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user queries
CREATE INDEX idx_conversation_analyses_user_id
    ON conversation_analyses(user_id);

-- Index for finding analysis by conversation
CREATE INDEX idx_conversation_analyses_conversation_id
    ON conversation_analyses(conversation_id);

-- Index for recent analyses per user
CREATE INDEX idx_conversation_analyses_user_created
    ON conversation_analyses(user_id, created_at DESC);

-- HNSW index for semantic search on embeddings
CREATE INDEX idx_conversation_analyses_embedding
    ON conversation_analyses USING hnsw (embedding halfvec_cosine_ops)
    WITH (m = 16, ef_construction = 64);

COMMENT ON TABLE conversation_analyses IS
    'Structured LLM-generated analysis of each conversation. Links to conversation and triggering message.';

-- ============================================================================
-- TABLE 3: emotional_snapshots
-- ============================================================================
-- Time-series of emotional states detected throughout user interactions.
-- Can be detected from conversations, activities, or explicit check-ins.
-- Used for tracking emotional patterns over time.
-- ============================================================================

CREATE TABLE emotional_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Link to user (required)
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Optional context links
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    -- If from activity, store reference
    activity_type TEXT, -- 'breathing', 'meditation', 'journaling', null
    activity_session_id UUID, -- Reference to breathing_sessions or meditation_sessions

    -- Emotional state (based on psychological models)
    primary_emotion TEXT NOT NULL,
    secondary_emotion TEXT,
    -- Intensity: 0.0 (barely noticeable) to 1.0 (overwhelming)
    intensity REAL CHECK (intensity >= 0 AND intensity <= 1),
    -- Valence: -1.0 (very negative) to 1.0 (very positive)
    valence REAL CHECK (valence >= -1 AND valence <= 1),
    -- Arousal: 0.0 (calm/low energy) to 1.0 (activated/high energy)
    arousal REAL CHECK (arousal >= 0 AND arousal <= 1),

    -- Context
    detected_triggers TEXT[] DEFAULT '{}',
    source TEXT NOT NULL CHECK (source IN (
        'conversation', 'activity_before', 'activity_after', 'check_in', 'inferred'
    )),

    -- Confidence in the detection (0-1)
    confidence REAL CHECK (confidence >= 0 AND confidence <= 1),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user time-series queries
CREATE INDEX idx_emotional_snapshots_user_time
    ON emotional_snapshots(user_id, created_at DESC);

-- Index for filtering by source
CREATE INDEX idx_emotional_snapshots_user_source
    ON emotional_snapshots(user_id, source);

-- Index for date-based aggregations (mood by day)
CREATE INDEX idx_emotional_snapshots_user_date
    ON emotional_snapshots(user_id, DATE(created_at));

COMMENT ON TABLE emotional_snapshots IS
    'Time-series log of detected emotional states. Sources: conversations, activities, check-ins.';

-- ============================================================================
-- TABLE 4: activity_effectiveness
-- ============================================================================
-- Aggregated effectiveness metrics for each activity/technique per user.
-- Data is computed from breathing_sessions and meditation_sessions tables.
-- One row per user + activity_type + technique combination.
-- ============================================================================

CREATE TABLE activity_effectiveness (
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

    -- Effectiveness metrics (from mood_before/mood_after)
    -- Count of sessions where mood improved
    mood_improvements INTEGER DEFAULT 0,
    -- Count of sessions where mood stayed same
    mood_no_change INTEGER DEFAULT 0,
    -- Count of sessions where mood declined
    mood_declines INTEGER DEFAULT 0,
    -- Average mood change (-5 to +5 scale if using 1-5 mood ratings)
    average_mood_change REAL DEFAULT 0,

    -- Contextual effectiveness (learned over time)
    -- Situations where this technique was helpful
    effective_contexts TEXT[] DEFAULT '{}',
    -- e.g., ['anxiety', 'before_sleep', 'stress', 'morning_routine']

    -- Calculated composite score (0-100)
    -- Formula: weighted combination of completion rate, mood improvement, frequency
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

-- Index for user queries
CREATE INDEX idx_activity_effectiveness_user
    ON activity_effectiveness(user_id);

-- Index for finding top techniques
CREATE INDEX idx_activity_effectiveness_user_score
    ON activity_effectiveness(user_id, effectiveness_score DESC NULLS LAST);

-- Trigger for updated_at
CREATE TRIGGER activity_effectiveness_updated_at
    BEFORE UPDATE ON activity_effectiveness
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE activity_effectiveness IS
    'Aggregated effectiveness metrics per activity/technique. Computed from breathing and meditation sessions.';

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- user_wellness_profiles
ALTER TABLE user_wellness_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wellness profile"
    ON user_wellness_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wellness profile"
    ON user_wellness_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Note: INSERT/DELETE handled by service role for backend operations

-- conversation_analyses
ALTER TABLE conversation_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversation analyses"
    ON conversation_analyses FOR SELECT
    USING (auth.uid() = user_id);

-- Note: INSERT handled by service role (AI backend)

-- emotional_snapshots
ALTER TABLE emotional_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own emotional snapshots"
    ON emotional_snapshots FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own emotional snapshots"
    ON emotional_snapshots FOR DELETE
    USING (auth.uid() = user_id);

-- activity_effectiveness
ALTER TABLE activity_effectiveness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity effectiveness"
    ON activity_effectiveness FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTIONS
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

-- Function to get comprehensive user profile for LLM context
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
        -- Dynamic profile
        'wellness_profile', (
            SELECT jsonb_build_object(
                'emotional_baseline', wp.emotional_baseline,
                'engagement_trend', wp.engagement_trend,
                'current_concern', wp.current_primary_concern,
                'recurring_topics', wp.recurring_topics,
                'goals_progress', wp.goals_progress,
                'improvements', wp.improvements_noted,
                'challenges', wp.challenges_persisting,
                'total_conversations', wp.total_conversations
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
                'source', es.source,
                'date', es.created_at
            ) ORDER BY es.created_at DESC), '[]'::JSONB)
            FROM (
                SELECT primary_emotion, intensity, valence, source, created_at
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
                'reason', ae.recommendation_reason
            ) ORDER BY ae.effectiveness_score DESC NULLS LAST), '[]'::JSONB)
            FROM (
                SELECT activity_type, technique, effectiveness_score, recommendation_reason
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

-- Function to auto-create wellness profile for new users
CREATE OR REPLACE FUNCTION create_wellness_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_wellness_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create wellness profile when profile is created
CREATE TRIGGER on_profile_created_create_wellness
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_wellness_profile_for_user();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION search_conversation_analyses IS
    'Semantic search across conversation analyses using vector similarity.';

COMMENT ON FUNCTION get_user_wellness_context IS
    'Returns comprehensive user context for LLM prompts including preferences, profile, emotions, and activities.';
```

### Schema Summary

| Table                    | Relationship                                           | Description                     |
| ------------------------ | ------------------------------------------------------ | ------------------------------- |
| `user_wellness_profiles` | 1:1 with `profiles`                                    | Dynamic profile (PK=FK pattern) |
| `conversation_analyses`  | N:1 with `profiles`, `conversations`, `messages`       | Per-conversation analysis       |
| `emotional_snapshots`    | N:1 with `profiles`, optional N:1 with `conversations` | Time-series emotions            |
| `activity_effectiveness` | N:1 with `profiles`, computed from `*_sessions`        | Aggregated effectiveness        |

### How Tables Connect

```text
                    User Journey Flow
                    ─────────────────

  User signs up
       │
       ▼
  ┌─────────┐     auto-creates     ┌─────────────────────────┐
  │profiles │ ──────────────────▶  │ user_wellness_profiles  │
  └─────────┘                      │ (1:1, starts empty)     │
       │                           └─────────────────────────┘
       │ creates                              ▲
       ▼                                      │ updated by
  ┌──────────────┐                            │
  │conversations │ ◀─────────────────────────-┤
  └──────────────┘                            │
       │                                      │
       │ contains                             │
       ▼                                      │
  ┌──────────────┐                            │
  │  messages    │                            │
  └──────────────┘                            │
       │                                      │
       │ triggers analysis at END             │
       ▼                                      │
  ┌───────────────────────┐                   │
  │ conversation_analyses │───────────────────┤
  │                       │                   │
  │ - extracts emotions ──┼───▶ emotional_snapshots
  │ - detects topics      │
  │ - identifies concerns │
  └───────────────────────┘
                                              │
  User does activity                          │
       │                                      │
       ▼                                      │
  ┌──────────────────────┐                    │
  │ breathing_sessions   │                    │
  │ meditation_sessions  │                    │
  │ (mood_before/after)  │                    │
  └──────────────────────┘                    │
       │                                      │
       │ aggregates to                        │
       ▼                                      │
  ┌────────────────────────┐                  │
  │ activity_effectiveness │──────────────────┘
  │ (computed scores)      │
  └────────────────────────┘
```

---

## Recommended Implementation: End-of-Graph Analysis Node

After evaluating multiple approaches, **Option 1 (End-of-Graph Analysis Node)** is the recommended implementation for maximum **performance** and **reliability**.

### Why This Approach?

#### Performance: Zero Latency Impact

```text
Current Graph Flow:
START → [parallel nodes] → route → generate_response → store_memory → END
                                          ↑
                                    Response streamed here
                                    (user sees response)

With Analysis Node:
START → [parallel nodes] → route → generate_response → store_memory → analyze_profile → END
                                          ↑                                ↑
                                    Response streamed              Analysis runs here
                                    (user sees response)           (zero latency impact)
```

The key insight: **the response is already streamed to the user before `store_memory` runs**. Adding `analyze_profile` after `store_memory` has absolutely no impact on perceived latency.

#### Reliability: In-Graph Execution

| Approach              | Error Handling        | Data Consistency   | Debugging           |
| --------------------- | --------------------- | ------------------ | ------------------- |
| **End-of-Graph Node** | ✅ Catchable in graph | ✅ Atomic with run | ✅ LangSmith traces |
| Background Task       | ❌ Fire-and-forget    | ❌ Can lose data   | ❌ Hard to trace    |
| Parallel Subgraph     | ⚠️ Isolated errors    | ✅ Good            | ⚠️ Complex          |

Background tasks (`asyncio.create_task()`) detach from the graph lifecycle - if they fail, data is lost silently with no retry mechanism.

### Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                      analyze_profile Node                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Extract conversation context                                 │
│     └─ messages, user_context, activity completed               │
│                                                                  │
│  2. LLM Analysis (FAST tier - Gemini Flash)                     │
│     └─ Structured output via Pydantic model                     │
│     └─ ~100ms latency (vs ~500ms for Claude)                    │
│                                                                  │
│  3. Store Results (batch transaction)                           │
│     ├─ conversation_analyses (with embedding)                   │
│     ├─ emotional_snapshots (time-series)                        │
│     ├─ user_wellness_profiles (update aggregates)               │
│     └─ activity_effectiveness (if activity completed)           │
│                                                                  │
│  4. Error Handling                                               │
│     └─ Log errors but don't fail graph                          │
│     └─ User already has response - analysis is best-effort      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Code

```python
from pydantic import BaseModel, Field
from src.llm.providers import create_llm, ModelTier
from src.logging_config import NodeLogger

class ConversationAnalysis(BaseModel):
    """Structured output for conversation analysis."""

    # Emotional state
    primary_emotion: str = Field(description="Main emotion: anxiety, stress, sadness, calm, joy, neutral")
    emotion_intensity: float = Field(ge=0, le=1, description="Intensity 0-1")
    emotional_valence: float = Field(ge=-1, le=1, description="Negative (-1) to positive (1)")
    emotional_trajectory: str = Field(description="improving, stable, declining, or fluctuating")

    # Content analysis
    topics_discussed: list[str] = Field(description="Main topics covered")
    concerns_raised: list[str] = Field(description="Worries or issues mentioned")
    positive_aspects: list[str] = Field(description="Positive things mentioned")
    detected_triggers: list[str] = Field(description="Stress triggers identified")

    # Session characterization
    conversation_type: str = Field(description="venting, seeking_advice, checking_in, doing_activity, general_chat")
    engagement_level: str = Field(description="high, medium, or low")

    # Actionable insights
    follow_up_topics: list[str] = Field(description="Topics to revisit in future")
    suggested_activities: list[str] = Field(description="Activities that might help")


async def analyze_profile(
    state: WellnessState,
    config: RunnableConfig,
) -> dict:
    """
    Analyze conversation and update user profile.

    Runs at END of graph after response is streamed.
    Uses FAST tier (Gemini) for cost-effective analysis.
    Errors are logged but don't fail the graph.
    """
    logger = NodeLogger("analyze_profile")
    logger.node_start()

    try:
        # Extract context
        auth_user = config.get("configurable", {}).get("langgraph_auth_user", {})
        user_id = auth_user.get("identity")
        messages = state.get("messages", [])
        conversation_id = config.get("configurable", {}).get("thread_id")

        # Skip analysis for very short exchanges
        if not user_id or len(messages) < 2:
            logger.info("Skipping analysis", reason="insufficient_context")
            logger.node_end()
            return {}

        # Get the last user message for analysis focus
        user_messages = [m for m in messages if m.type == "human"]
        if not user_messages:
            logger.node_end()
            return {}

        # Build analysis prompt
        analysis_prompt = _build_analysis_prompt(messages)

        # Use FAST tier for cost-effective analysis (~100ms)
        llm = create_llm(tier=ModelTier.FAST, temperature=0.1)
        structured_llm = llm.with_structured_output(ConversationAnalysis)

        # Run analysis
        analysis: ConversationAnalysis = await structured_llm.ainvoke(analysis_prompt)

        logger.info("Analysis complete",
            emotion=analysis.primary_emotion,
            intensity=f"{analysis.emotion_intensity:.1f}",
            type=analysis.conversation_type
        )

        # Store results (awaited for reliability, but user already has response)
        await _store_analysis_results(
            user_id=user_id,
            conversation_id=conversation_id,
            messages=messages,
            analysis=analysis,
        )

        # Update wellness profile aggregates
        await _update_wellness_profile(user_id, analysis)

        # Record emotional snapshot
        await _record_emotional_snapshot(user_id, conversation_id, analysis)

        # If activity was completed, update effectiveness
        if state.get("exercise_completed"):
            await _update_activity_effectiveness(
                user_id=user_id,
                activity_type=state.get("suggested_activity"),
                technique=state.get("exercise_technique"),
                analysis=analysis,
            )

        logger.info("Profile updated successfully")

    except Exception as e:
        # Log error but don't fail - user already has their response
        logger.error("Analysis failed", error=str(e))

    logger.node_end()
    return {}


def _build_analysis_prompt(messages: list) -> str:
    """Build the analysis prompt from conversation messages."""

    # Format recent messages (last 10 for context)
    recent = messages[-10:] if len(messages) > 10 else messages
    formatted = "\n".join([
        f"{'User' if m.type == 'human' else 'Assistant'}: {m.content[:500]}"
        for m in recent
    ])

    return f"""Analyze this wellness conversation and extract structured insights.
Focus on the user's emotional state, concerns, and what might help them.

## Conversation
{formatted}

## Instructions
- Identify the primary emotion and its intensity
- Note any concerns, triggers, or positive aspects mentioned
- Characterize the conversation type and engagement level
- Suggest follow-up topics and activities that might help
- Be specific and actionable in your analysis
"""
```

### Graph Wiring

```python
# In apps/ai/src/graph/wellness.py

from src.nodes.analyze_profile.node import analyze_profile

# Add node
graph.add_node("analyze_profile", analyze_profile)

# Wire after store_memory
graph.add_edge("store_memory", "analyze_profile")
graph.add_edge("analyze_profile", END)
```

### Performance Optimizations

1. **FAST Tier (Gemini Flash)**: ~100ms vs ~500ms for Claude
2. **Skip Short Exchanges**: Only analyze conversations with 2+ messages
3. **Batch Database Writes**: Single transaction for all profile updates
4. **Reuse Embeddings**: Share embedding generation with `store_memory` if possible
5. **Truncate Long Messages**: Cap at 500 chars per message in analysis prompt

### Error Handling Strategy

```python
# Errors are caught and logged, but never fail the graph
try:
    analysis = await structured_llm.ainvoke(prompt)
    await store_results(analysis)
except Exception as e:
    logger.error("Analysis failed", error=str(e))
    # Don't re-raise - user already has response
    # Analysis is best-effort, not critical path
```

This ensures the user experience is never degraded by analysis failures.

---

## Privacy & Security Considerations

### Data Minimization

- Store **derived insights**, not raw conversation text
- Use **aggregated patterns** rather than individual data points where possible
- Implement **data retention policies** (e.g., delete detailed logs after 90 days)

### Security

- All profile tables use **RLS with user_id isolation**
- Backend uses **service role key** for writes (bypasses RLS)
- **Encrypt sensitive fields** if storing specific concerns/triggers
- **Anonymize data** before any analytics/reporting

### User Control

- Allow users to **view their profile data**
- Provide option to **delete profile data**
- Allow **opting out** of detailed tracking
- Clear explanation of **what data is collected and why**

### Compliance

- Mental health data has extra sensitivity under various regulations
- Consider **HIPAA-like protections** even if not legally required
- Document data flows and retention policies

---

## Implementation Plan

### Phase 1: Core Profiling (Start Here)

Create the foundation for user profiling with conversation analysis.

**Database:**

- [ ] Create migration with all 4 tables (single migration file)
  - `user_wellness_profiles` (1:1 with profiles)
  - `conversation_analyses` (per-conversation insights)
  - `emotional_snapshots` (time-series emotions)
  - `activity_effectiveness` (aggregated metrics)
- [ ] Add RLS policies and helper functions
- [ ] Add trigger for auto-creating wellness profile on signup
- [ ] Generate TypeScript types (`pnpm db:generate-types`)

**Backend:**

- [ ] Create `ConversationAnalysis` Pydantic model
- [ ] Create `analyze_profile` node in `apps/ai/src/nodes/analyze_profile/`
- [ ] Add storage utilities for each table
- [ ] Wire node into graph after `store_memory`

**Integration:**

- [ ] Update `inject_user_context` to fetch wellness profile
- [ ] Update `generate_response` to include profile context
- [ ] Call `get_user_wellness_context()` DB function

**Deliverables:**

```text
apps/ai/src/
├── nodes/
│   └── analyze_profile/
│       ├── __init__.py
│       ├── node.py          # Main analysis node
│       ├── models.py        # Pydantic models
│       └── storage.py       # DB storage utilities
├── graph/
│   └── wellness.py          # Updated with new node
```

### Phase 2: Activity Effectiveness

Track which activities work best for each user.

**Tasks:**

- [ ] Update `breathing_exercise` node to record mood before/after
- [ ] Update `generate_meditation_script` node similarly
- [ ] Add logic in `analyze_profile` to update `activity_effectiveness`
- [ ] Compute effectiveness scores from `breathing_sessions` and `meditation_sessions`
- [ ] Use effectiveness data to influence activity suggestions in prompts

**New Capabilities:**

- "Breathing exercises have been really helpful for you, especially the 4-7-8 technique"
- Recommend activities based on past success, not just user preference

### Phase 3: Emotional Intelligence

Build emotional pattern awareness over time.

**Tasks:**

- [ ] Aggregate `emotional_snapshots` into daily/weekly patterns
- [ ] Detect emotional trends (improving, declining, stable)
- [ ] Identify recurring triggers from conversation analyses
- [ ] Add proactive messaging based on patterns
- [ ] Consider time-of-day patterns in recommendations

**New Capabilities:**

- "I've noticed you tend to feel more anxious in the evenings"
- "You've been feeling better this week compared to last"
- Trigger-aware responses that acknowledge known stressors

### Phase 4: Semantic Profile Search

Add semantic search across past insights for deeper personalization.

**Tasks:**

- [ ] Generate embeddings for `conversation_analyses.analysis_summary`
- [ ] Implement `search_conversation_analyses()` semantic search
- [ ] Retrieve relevant past insights based on current conversation
- [ ] Integrate with LangGraph Store API for cross-thread memory
- [ ] Build long-term pattern summaries

**New Capabilities:**

- "Last time we talked about work stress, the breathing exercise helped"
- Connect current concerns to past conversations
- Personalized recommendations based on what's worked before

---

## Implementation Checklist

### Phase 1 Checklist (Core Profiling) ✅ COMPLETE

**Database:**

- [x] Create `supabase/migrations/20250105000001_user_profiling.sql`
- [x] Include all 4 tables with proper FK relationships
- [x] Include RLS policies (inline in migration)
- [x] Include helper functions (`get_user_wellness_context`, `search_conversation_analyses`)
- [x] Include trigger for auto-creating `user_wellness_profiles`
- [x] Run `pnpm db:push` to apply migration
- [x] Run `pnpm db:generate-types` to update TypeScript types

**Backend Node:**

- [x] Create `apps/ai/src/nodes/analyze_profile/` folder
- [x] Create `models.py` with `ConversationAnalysis` Pydantic model
- [x] Create `storage.py` with async Supabase storage functions
- [x] Create `node.py` with `analyze_profile` async function
- [x] Export from `__init__.py`

**Graph Integration:**

- [x] Import `analyze_profile` in `wellness.py`
- [x] Add node: `graph.add_node("analyze_profile", analyze_profile)`
- [x] Update edge: `store_memory` → `analyze_profile` → `END`

**Profile Injection:**

- [x] Update `inject_user_context` to call `get_user_wellness_context()` (via RPC)
- [ ] Format wellness context for system prompt (profile data available but not yet used in prompts)
- [ ] Update `generate_response` to use enriched context (TODO: Phase 3)

**Testing:**

- [ ] Unit tests for `ConversationAnalysis` model validation
- [ ] Unit tests for storage functions
- [ ] Integration test for full analysis flow
- [ ] Test profile injection in responses
- [ ] Test error handling (analysis failure shouldn't break responses)

---

## References

### LangGraph Documentation

- [Long-term Memory](https://docs.langchain.com/oss/python/langchain/long-term-memory)
- [Memory Concepts](https://docs.langchain.com/oss/python/concepts/memory)
- [LangGraph Store (Persistence)](https://docs.langchain.com/oss/python/langgraph/persistence)
- [Dynamic Context](https://docs.langchain.com/oss/python/concepts/context)

### Research & Best Practices

- [Mental Health Chatbot User Event Log Analysis (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10360018/)
- [Personalized Mental Health Chatbots](https://chatbotresearch.org/project/personalized-mental-health-chatbots/)
- [Building Mental Health Chatbots Guide](https://topflightapps.com/ideas/build-mental-health-chatbot/)
- [AI Mental Health Apps Development](https://www.hashstudioz.com/blog/developing-mental-health-apps-ai-powered-insights-for-better-wellbeing/)
- [InsightLens: LLM-Powered Analysis](https://arxiv.org/html/2404.01644v2)
- [LLM User Analytics Framework](https://www.nebuly.com/blog/what-is-user-analytics-for-llms)

### Privacy & Compliance

- [Mental Health Apps and Personal Information](https://www.newamerica.org/oti/blog/how-mental-health-apps-are-handling-personal-information/)
- [APA Guidelines on AI and Wellness Apps](https://www.apa.org/topics/artificial-intelligence-machine-learning/health-advisory-chatbots-wellness-apps)

---

## Implementation Notes

### What Was Implemented (January 5, 2025)

#### Database Migration

- **File**: `supabase/migrations/20250105000001_user_profiling.sql`
- Created all 4 tables with proper relationships
- Added standardized mood scale (1-5 integers) across all activity tables
- Helper functions for semantic search and wellness context retrieval
- Auto-create trigger for wellness profiles on user signup

#### Backend (Python/LangGraph)

**Analyze Profile Node** (`apps/ai/src/nodes/analyze_profile/`):

- `models.py` - `ConversationAnalysis` Pydantic model for structured LLM output
- `storage.py` - Async Supabase storage functions for all profile tables
- `node.py` - Main analysis node using FAST tier (Gemini Flash) LLM

**Graph Updates** (`apps/ai/src/graph/wellness.py`):

- Added `analyze_profile` node after `store_memory`
- Updated graph flow: `store_memory` → `analyze_profile` → `END`
- Zero latency impact (runs after response is streamed to user)

**Profile Injection** (`apps/ai/src/nodes/inject_user_context/`):

- Updated to fetch wellness profile via `get_user_wellness_context()` RPC
- Profile data now available in `user_context.wellness_profile`

#### Frontend (React/TypeScript)

**Shared Types** (`packages/shared/src/types/`):

- `mood.ts` - Standardized `MoodRating` type (1-5) and utilities
- Updated `breathing.ts` with `moodBefore`/`moodAfter` fields

**MoodCheck Component** (`apps/web/src/components/MoodCheck/`):

- Reusable mood rating selector component
- Used by breathing and meditation activities

**Mood Tracking in Breathing**:

- `ImmersiveBreathingConfirmation` - Asks mood before starting (optional)
- `ImmersiveBreathing` - Asks mood after completion, shows mood change
- Stats now include `moodBefore`, `moodAfter`, and `techniqueId`

**WellnessProfile Component** (`apps/web/src/components/WellnessProfile/`):

- Displays user wellness profile data
- Shows emotional baseline, stats, topics, triggers, and progress
- Supports compact mode for sidebar display

### Files Created/Modified

```
Created:
  supabase/migrations/20250105000001_user_profiling.sql
  packages/shared/src/types/mood.ts
  apps/web/src/components/MoodCheck/MoodCheck.tsx
  apps/web/src/components/MoodCheck/MoodCheck.module.css
  apps/web/src/components/MoodCheck/index.ts
  apps/web/src/components/WellnessProfile/WellnessProfile.tsx
  apps/web/src/components/WellnessProfile/WellnessProfile.module.css
  apps/web/src/components/WellnessProfile/types.ts
  apps/web/src/components/WellnessProfile/index.ts
  apps/ai/src/nodes/analyze_profile/__init__.py
  apps/ai/src/nodes/analyze_profile/models.py
  apps/ai/src/nodes/analyze_profile/storage.py
  apps/ai/src/nodes/analyze_profile/node.py

Modified:
  packages/shared/src/types/breathing.ts (added mood fields)
  packages/shared/src/types/index.ts (export mood types)
  apps/web/src/components/ImmersiveBreathing/types.ts (mood props)
  apps/web/src/components/ImmersiveBreathing/ImmersiveBreathingConfirmation.tsx
  apps/web/src/components/ImmersiveBreathing/ImmersiveBreathing.tsx
  apps/web/src/components/ImmersiveBreathing/ImmersiveBreathing.module.css
  apps/web/src/components/GuidedMeditation/* (updated MoodCheck imports)
  apps/ai/src/graph/wellness.py (added analyze_profile node)
  apps/ai/src/nodes/inject_user_context/node.py (fetch wellness profile)
```

### Phase 2+ TODO

The following items remain for future phases:

**Phase 2: Activity Effectiveness**

- [ ] Store mood data to `activity_effectiveness` table after activities
- [ ] Compute effectiveness scores from actual mood changes
- [ ] Use effectiveness data in activity recommendations

**Phase 3: Emotional Intelligence**

- [ ] Format wellness profile into system prompt context
- [ ] Detect emotional trends from snapshots
- [ ] Add proactive messaging based on patterns

**Phase 4: Semantic Profile Search**

- [ ] Generate embeddings for conversation analyses
- [ ] Implement semantic search for past insights
- [ ] Connect current conversations to relevant history

---

_Document created: January 5, 2025_
_Last updated: January 5, 2025_
