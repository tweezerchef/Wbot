"""
============================================================================
Meditation Recommendation Engine
============================================================================
Personalized meditation track selection based on user history, time of day,
emotional state, and preferences.
============================================================================
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Literal

from src.auth import get_supabase_client
from src.logging_config import NodeLogger

if TYPE_CHECKING:
    from supabase._async.client import AsyncClient

    from .node import MeditationTrack

logger = NodeLogger("meditation_recommendation")

TimeOfDay = Literal["morning", "afternoon", "evening", "night"]
DurationPreset = Literal["short", "medium", "long"]

SESSION_TO_DURATION: dict[str, DurationPreset | None] = {
    "few_minutes": "short",
    "short": "short",
    "medium": "medium",
    "long": "long",
    "flexible": None,
}

TIME_OF_DAY_WEIGHTS: dict[TimeOfDay, dict[str, float]] = {
    "morning": {
        "daily_mindfulness": 1.5,
        "breathing_focus": 1.3,
        "body_scan": 1.0,
        "loving_kindness": 0.8,
        "anxiety_relief": 0.7,
        "sleep": 0.2,
    },
    "afternoon": {
        "breathing_focus": 1.3,
        "daily_mindfulness": 1.2,
        "anxiety_relief": 1.1,
        "body_scan": 1.0,
        "loving_kindness": 0.9,
        "sleep": 0.3,
    },
    "evening": {
        "body_scan": 1.4,
        "loving_kindness": 1.2,
        "anxiety_relief": 1.1,
        "breathing_focus": 1.0,
        "sleep": 1.3,
        "daily_mindfulness": 0.7,
    },
    "night": {
        "sleep": 1.8,
        "body_scan": 1.3,
        "loving_kindness": 1.0,
        "breathing_focus": 0.8,
        "anxiety_relief": 0.7,
        "daily_mindfulness": 0.4,
    },
}

EMOTIONAL_STATE_SIGNALS: dict[str, list[str]] = {
    "anxiety_relief": ["anxious", "worried", "panic", "stress", "overwhelm", "nervous"],
    "body_scan": ["tense", "tension", "tight", "physical", "body", "pain", "headache"],
    "loving_kindness": ["lonely", "self-critical", "harsh", "guilt", "shame", "compassion"],
    "sleep": ["sleep", "insomnia", "bedtime", "tired", "exhausted", "can't sleep"],
    "breathing_focus": ["focus", "distracted", "scattered", "present", "mindful", "calm"],
    "daily_mindfulness": ["quick", "break", "busy", "pause", "moment"],
}


@dataclass
class RecommendationScores:
    history_score: float = 0.0
    time_of_day_score: float = 0.0
    emotional_state_score: float = 0.0
    duration_match_score: float = 0.0
    language_match_score: float = 0.0
    total_score: float = 0.0


@dataclass
class UserMeditationHistory:
    total_sessions: int = 0
    completed_sessions: int = 0
    favorite_track_type: str | None = None
    track_completion_rates: dict[str, float] | None = None
    track_mood_improvements: dict[str, float] | None = None
    current_streak: int = 0


def get_time_of_day() -> TimeOfDay:
    hour = datetime.now(UTC).hour
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"


async def fetch_user_meditation_history(
    user_id: str, supabase: AsyncClient
) -> UserMeditationHistory:
    history = UserMeditationHistory()
    try:
        stats = await supabase.rpc("get_meditation_stats", {"p_user_id": user_id}).execute()
        if stats.data and len(stats.data) > 0:
            s = stats.data[0]
            history.total_sessions = s.get("total_sessions", 0) or 0
            history.completed_sessions = s.get("completed_sessions", 0) or 0
            history.favorite_track_type = s.get("favorite_track_type")
            history.current_streak = s.get("current_streak", 0) or 0
    except Exception as e:
        logger.warning(f"Failed to fetch meditation history: {e}")
    return history


def score_by_history(track: MeditationTrack, history: UserMeditationHistory) -> float:
    score = 0.0
    if history.track_completion_rates:
        score += history.track_completion_rates.get(track["type"], 0.5) * 0.5
    if history.favorite_track_type == track["type"]:
        score += 0.2
    return score


def score_by_time_of_day(track: MeditationTrack, time_of_day: TimeOfDay) -> float:
    return TIME_OF_DAY_WEIGHTS.get(time_of_day, {}).get(track["type"], 1.0)


def score_by_emotional_state(track: MeditationTrack, text: str) -> float:
    signals = EMOTIONAL_STATE_SIGNALS.get(track["type"], [])
    if not signals or not text:
        return 0.0
    matches = sum(1 for s in signals if s in text.lower())
    return min(1.0, matches * 0.3)


def score_by_duration(track: MeditationTrack, pref: DurationPreset | None) -> float:
    if pref is None:
        return 0.5
    if track["durationPreset"] == pref:
        return 1.0
    return 0.5 if pref == "medium" else 0.2


def score_by_language(track: MeditationTrack, lang: str | None) -> float:
    if lang is None:
        return 1.0 if track["language"] == "en" else 0.3
    return 1.0 if track["language"] == lang else (0.7 if track["language"] == "en" else 0.3)


def detect_language_from_context(ctx: dict, text: str) -> str | None:
    if lang := ctx.get("preferences", {}).get("language"):
        return str(lang)
    if locale := ctx.get("locale"):
        return str(locale).split("-")[0].lower()
    if text:
        t = text.lower()
        if any(w in t for w in ["hola", "gracias", "necesito"]):
            return "es"
        if any(w in t for w in ["ni hao", "xie xie"]):
            return "zh"
    return None


async def get_personalized_recommendation(
    user_id: str,
    user_context: dict,
    conversation_text: str,
    available_tracks: dict[str, MeditationTrack],
) -> tuple[MeditationTrack, dict[str, RecommendationScores]]:
    logger.info("Generating personalized recommendation", user_id=user_id)
    supabase = await get_supabase_client()
    history = await fetch_user_meditation_history(user_id, supabase)

    time_of_day = get_time_of_day()
    prefs = user_context.get("preferences", {})
    duration = SESSION_TO_DURATION.get(prefs.get("session_length", "medium"))
    language = detect_language_from_context(user_context, conversation_text)

    all_scores: dict[str, RecommendationScores] = {}
    best_track, best_score = None, -1.0

    for track_id, track in available_tracks.items():
        scores = RecommendationScores()
        scores.history_score = score_by_history(track, history)
        scores.time_of_day_score = score_by_time_of_day(track, time_of_day)
        scores.emotional_state_score = score_by_emotional_state(track, conversation_text)
        scores.duration_match_score = score_by_duration(track, duration)
        scores.language_match_score = score_by_language(track, language)
        scores.total_score = (
            scores.emotional_state_score * 2.0
            + scores.duration_match_score * 1.5
            + scores.history_score * 1.2
            + scores.time_of_day_score * 1.0
            + scores.language_match_score * 0.8
        )
        all_scores[track_id] = scores
        if scores.total_score > best_score:
            best_score, best_track = scores.total_score, track

    if best_track is None:
        best_track = available_tracks.get("breathing_focus", next(iter(available_tracks.values())))

    logger.info("Recommendation complete", selected_track=best_track["id"], score=best_score)
    return best_track, all_scores
