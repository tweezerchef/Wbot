"""
============================================================================
Analyze Profile Storage
============================================================================
Async Supabase storage functions for persisting conversation analyses
and updating user wellness profiles.

Uses the service role key to bypass RLS for backend operations.
============================================================================
"""

import os
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from supabase import AsyncClient, acreate_client

from src.logging_config import NodeLogger

from .models import ConversationAnalysis

logger = NodeLogger("analyze_profile_storage")

# Singleton async client
_supabase_client: AsyncClient | None = None


async def get_supabase_client() -> AsyncClient:
    """
    Gets or creates the async Supabase client.

    Uses the service role key to bypass RLS for backend operations.
    """
    global _supabase_client

    if _supabase_client is None:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_KEY")

        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")

        _supabase_client = await acreate_client(url, key)

    return _supabase_client


async def store_conversation_analysis(
    user_id: str,
    conversation_id: str,
    analysis: ConversationAnalysis,
    analysis_summary: str | None = None,
) -> str | None:
    """
    Stores a conversation analysis in the database.

    Args:
        user_id: User's UUID
        conversation_id: Conversation's UUID
        analysis: Structured analysis from LLM
        analysis_summary: Optional text summary for semantic search

    Returns:
        The UUID of the created analysis, or None on error
    """
    try:
        client = await get_supabase_client()

        analysis_id = str(uuid4())

        data = {
            "id": analysis_id,
            "user_id": user_id,
            "conversation_id": conversation_id,
            "primary_emotion": analysis.primary_emotion,
            "emotion_intensity": analysis.emotion_intensity,
            "emotional_valence": analysis.emotional_valence,
            "emotional_trajectory": analysis.emotional_trajectory,
            "topics_discussed": analysis.topics_discussed,
            "concerns_raised": analysis.concerns_raised,
            "positive_aspects": analysis.positive_aspects,
            "detected_triggers": analysis.detected_triggers,
            "conversation_type": analysis.conversation_type,
            "engagement_level": analysis.engagement_level,
            "follow_up_topics": analysis.follow_up_topics,
            "suggested_activities": analysis.suggested_activities,
            "analysis_json": analysis.model_dump(),
            "analysis_summary": analysis_summary,
            # Note: embedding will be added later in Phase 4
        }

        await client.table("conversation_analyses").insert(data).execute()
        logger.info("Conversation analysis stored", analysis_id=analysis_id)

        return analysis_id

    except Exception as e:
        logger.error("Failed to store conversation analysis", error=str(e))
        return None


async def store_emotional_snapshot(
    user_id: str,
    analysis: ConversationAnalysis,
    conversation_id: str | None = None,
    source: str = "conversation",
) -> str | None:
    """
    Stores an emotional snapshot from the analysis.

    This creates a time-series entry of the user's emotional state
    for tracking patterns over time.

    Args:
        user_id: User's UUID
        analysis: Structured analysis containing emotional data
        conversation_id: Optional conversation UUID for context
        source: Source of the snapshot (conversation, activity_before, activity_after, check_in)

    Returns:
        The UUID of the created snapshot, or None on error
    """
    try:
        client = await get_supabase_client()

        snapshot_id = str(uuid4())

        data = {
            "id": snapshot_id,
            "user_id": user_id,
            "conversation_id": conversation_id,
            "primary_emotion": analysis.primary_emotion,
            "intensity": analysis.emotion_intensity,
            "valence": analysis.emotional_valence,
            "detected_triggers": analysis.detected_triggers,
            "source": source,
            "confidence": 0.8,  # Default confidence for LLM-inferred emotions
        }

        await client.table("emotional_snapshots").insert(data).execute()
        logger.info("Emotional snapshot stored", snapshot_id=snapshot_id)

        return snapshot_id

    except Exception as e:
        logger.error("Failed to store emotional snapshot", error=str(e))
        return None


async def update_wellness_profile(
    user_id: str,
    analysis: ConversationAnalysis,
) -> bool:
    """
    Updates the user's wellness profile with insights from the analysis.

    This updates aggregate fields and tracking counters.

    Args:
        user_id: User's UUID
        analysis: Structured analysis to extract updates from

    Returns:
        True if update succeeded, False otherwise
    """
    try:
        client = await get_supabase_client()

        # First, get current profile to merge arrays
        result = await (
            client.table("user_wellness_profiles")
            .select("*")
            .eq("user_id", user_id)
            .single()
            .execute()
        )

        current = result.data if result.data else {}

        # Merge recurring topics (keep unique, limit to 10 most recent)
        existing_topics = current.get("recurring_topics") or []
        new_topics = list(set(existing_topics + analysis.topics_discussed))[:10]

        # Merge recurring triggers
        existing_triggers = current.get("recurring_triggers") or []
        new_triggers = list(set(existing_triggers + analysis.detected_triggers))[:10]

        # Increment conversation count
        total_conversations = (current.get("total_conversations") or 0) + 1

        # Determine emotional baseline from recent pattern
        emotional_baseline = _determine_emotional_baseline(analysis)

        # Build update data
        update_data: dict[str, Any] = {
            "recurring_topics": new_topics,
            "recurring_triggers": new_triggers,
            "total_conversations": total_conversations,
            "last_interaction_at": datetime.now(UTC).isoformat(),
            "updated_at": datetime.now(UTC).isoformat(),
        }

        # Update emotional baseline if significant
        if emotional_baseline:
            update_data["emotional_baseline"] = emotional_baseline
            update_data["emotional_baseline_updated_at"] = datetime.now(UTC).isoformat()

        # Update current primary concern if concerns were raised
        if analysis.concerns_raised:
            update_data["current_primary_concern"] = analysis.concerns_raised[0]

        # Set first interaction if not set
        if not current.get("first_interaction_at"):
            update_data["first_interaction_at"] = datetime.now(UTC).isoformat()

        # Upsert the profile
        await (
            client.table("user_wellness_profiles")
            .upsert({"user_id": user_id, **update_data})
            .execute()
        )

        logger.info("Wellness profile updated", user_id=user_id)
        return True

    except Exception as e:
        logger.error("Failed to update wellness profile", error=str(e))
        return False


def _determine_emotional_baseline(analysis: ConversationAnalysis) -> str | None:
    """
    Determines emotional baseline from analysis.

    Maps emotion intensity and valence to baseline categories.

    Returns:
        Baseline string or None if not determinable
    """
    valence = analysis.emotional_valence
    intensity = analysis.emotion_intensity

    # High positive valence
    if valence > 0.5 and intensity > 0.5:
        return "very_positive"
    if valence > 0.2:
        return "positive"

    # Neutral range
    if -0.2 <= valence <= 0.2:
        return "neutral"

    # Negative emotions
    if analysis.primary_emotion in ("anxiety", "anxious", "worried"):
        return "anxious"
    if valence < -0.3 and intensity > 0.6:
        return "struggling"
    if valence < -0.2:
        return "stressed"

    return None


async def update_activity_effectiveness(
    user_id: str,
    activity_type: str,
    technique: str | None,
    mood_before: int | None,
    mood_after: int | None,
    completed: bool = True,
) -> bool:
    """
    Updates activity effectiveness metrics.

    Called after an activity is completed to track how well
    different activities work for the user.

    Args:
        user_id: User's UUID
        activity_type: Type of activity (breathing, meditation, etc.)
        technique: Specific technique used (wim_hof, 4_7_8, body_scan, etc.)
        mood_before: Mood rating before activity (1-5)
        mood_after: Mood rating after activity (1-5)
        completed: Whether the activity was completed

    Returns:
        True if update succeeded, False otherwise
    """
    try:
        client = await get_supabase_client()

        # Get existing effectiveness record
        result = await (
            client.table("activity_effectiveness")
            .select("*")
            .eq("user_id", user_id)
            .eq("activity_type", activity_type)
            .eq("technique", technique or "")
            .maybeSingle()
            .execute()
        )

        existing = result.data if result.data else {}

        # Calculate updates
        times_started = (existing.get("times_started") or 0) + 1
        times_completed = (existing.get("times_completed") or 0) + (1 if completed else 0)

        # Mood change tracking
        mood_improvements = existing.get("mood_improvements") or 0
        mood_no_change = existing.get("mood_no_change") or 0
        mood_declines = existing.get("mood_declines") or 0

        if mood_before is not None and mood_after is not None:
            mood_change = mood_after - mood_before
            if mood_change > 0:
                mood_improvements += 1
            elif mood_change < 0:
                mood_declines += 1
            else:
                mood_no_change += 1

        # Calculate average mood change
        total_with_mood = mood_improvements + mood_no_change + mood_declines
        if total_with_mood > 0:
            # Weighted average: improvements = +1, no change = 0, declines = -1
            average_mood_change = (mood_improvements - mood_declines) / total_with_mood
        else:
            average_mood_change = 0.0

        # Calculate effectiveness score (0-100)
        # Formula: completion_rate * 40 + mood_improvement_rate * 40 + frequency_bonus * 20
        completion_rate = times_completed / times_started if times_started > 0 else 0
        mood_improvement_rate = mood_improvements / total_with_mood if total_with_mood > 0 else 0
        frequency_bonus = min(times_completed / 10, 1)  # Cap at 10 completions

        effectiveness_score = (
            (completion_rate * 40) + (mood_improvement_rate * 40) + (frequency_bonus * 20)
        )

        # Determine if recommended
        is_recommended = effectiveness_score >= 50 and times_completed >= 3

        now = datetime.now(UTC).isoformat()

        data = {
            "user_id": user_id,
            "activity_type": activity_type,
            "technique": technique or "",
            "times_started": times_started,
            "times_completed": times_completed,
            "mood_improvements": mood_improvements,
            "mood_no_change": mood_no_change,
            "mood_declines": mood_declines,
            "average_mood_change": average_mood_change,
            "effectiveness_score": effectiveness_score,
            "is_recommended": is_recommended,
            "recommendation_reason": _get_recommendation_reason(
                effectiveness_score, mood_improvement_rate, times_completed
            ),
            "last_used_at": now,
            "updated_at": now,
        }

        # Set first_used_at only on insert
        if not existing:
            data["first_used_at"] = now

        await client.table("activity_effectiveness").upsert(data).execute()
        logger.info(
            "Activity effectiveness updated",
            activity=activity_type,
            technique=technique,
            score=f"{effectiveness_score:.1f}",
        )

        return True

    except Exception as e:
        logger.error("Failed to update activity effectiveness", error=str(e))
        return False


def _get_recommendation_reason(
    score: float,
    mood_improvement_rate: float,
    times_completed: int,
) -> str | None:
    """Generates a human-readable recommendation reason."""
    if score >= 70 and mood_improvement_rate >= 0.6:
        return "Consistently improves your mood"
    if score >= 60 and times_completed >= 5:
        return "You complete this regularly and it helps"
    if mood_improvement_rate >= 0.5:
        return "Often helps improve your mood"
    if score >= 50:
        return "Works well for you"
    return None
