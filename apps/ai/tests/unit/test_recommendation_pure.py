"""
Unit tests for meditation recommendation engine - isolated pure function tests.
These tests avoid circular imports by testing functions in complete isolation.
"""

import sys
from pathlib import Path

# Add src to path and import the module directly to avoid circular imports
src_path = Path(__file__).parent.parent.parent / "src"
sys.path.insert(0, str(src_path))


def test_session_to_duration_mapping():
    """Test SESSION_TO_DURATION mapping."""
    from nodes.meditation_guidance.recommendation import SESSION_TO_DURATION

    assert SESSION_TO_DURATION["few_minutes"] == "short"
    assert SESSION_TO_DURATION["short"] == "short"
    assert SESSION_TO_DURATION["medium"] == "medium"
    assert SESSION_TO_DURATION["long"] == "long"
    assert SESSION_TO_DURATION["flexible"] is None


def test_time_of_day_weights_structure():
    """Test TIME_OF_DAY_WEIGHTS has expected structure."""
    from nodes.meditation_guidance.recommendation import TIME_OF_DAY_WEIGHTS

    assert "morning" in TIME_OF_DAY_WEIGHTS
    assert "afternoon" in TIME_OF_DAY_WEIGHTS
    assert "evening" in TIME_OF_DAY_WEIGHTS
    assert "night" in TIME_OF_DAY_WEIGHTS

    # Check morning has expected types
    assert TIME_OF_DAY_WEIGHTS["morning"]["breathing_focus"] == 1.3
    assert TIME_OF_DAY_WEIGHTS["night"]["sleep"] == 1.8


def test_emotional_state_signals_structure():
    """Test EMOTIONAL_STATE_SIGNALS has expected keywords."""
    from nodes.meditation_guidance.recommendation import EMOTIONAL_STATE_SIGNALS

    assert "anxious" in EMOTIONAL_STATE_SIGNALS["anxiety_relief"]
    assert "sleep" in EMOTIONAL_STATE_SIGNALS["sleep"]
    assert "focus" in EMOTIONAL_STATE_SIGNALS["breathing_focus"]


def test_recommendation_scores_dataclass():
    """Test RecommendationScores dataclass."""
    from nodes.meditation_guidance.recommendation import RecommendationScores

    scores = RecommendationScores()
    assert scores.history_score == 0.0
    assert scores.time_of_day_score == 0.0
    assert scores.emotional_state_score == 0.0
    assert scores.duration_match_score == 0.0
    assert scores.language_match_score == 0.0
    assert scores.total_score == 0.0


def test_user_meditation_history_dataclass():
    """Test UserMeditationHistory dataclass."""
    from nodes.meditation_guidance.recommendation import UserMeditationHistory

    history = UserMeditationHistory()
    assert history.total_sessions == 0
    assert history.completed_sessions == 0
    assert history.favorite_track_type is None
    assert history.current_streak == 0


def test_score_by_duration():
    """Test score_by_duration function."""
    from nodes.meditation_guidance.recommendation import score_by_duration

    track = {"durationPreset": "short", "type": "breathing_focus"}
    assert score_by_duration(track, "short") == 1.0
    assert score_by_duration(track, None) == 0.5
    assert score_by_duration(track, "long") == 0.2


def test_score_by_language():
    """Test score_by_language function."""
    from nodes.meditation_guidance.recommendation import score_by_language

    track_en = {"language": "en", "type": "breathing_focus"}
    track_es = {"language": "es", "type": "breathing_focus"}

    assert score_by_language(track_en, "en") == 1.0
    assert score_by_language(track_en, None) == 1.0
    assert score_by_language(track_es, "es") == 1.0
    assert score_by_language(track_en, "es") == 0.7


def test_score_by_emotional_state():
    """Test score_by_emotional_state function."""
    from nodes.meditation_guidance.recommendation import score_by_emotional_state

    track = {"type": "anxiety_relief"}
    assert score_by_emotional_state(track, "I feel anxious and worried") > 0.5
    assert score_by_emotional_state(track, "Hello there") == 0.0
    assert score_by_emotional_state(track, "") == 0.0


def test_score_by_time_of_day():
    """Test score_by_time_of_day function."""
    from nodes.meditation_guidance.recommendation import score_by_time_of_day

    breathing_track = {"type": "breathing_focus"}
    sleep_track = {"type": "sleep"}

    assert score_by_time_of_day(breathing_track, "morning") == 1.3
    assert score_by_time_of_day(sleep_track, "night") == 1.8


def test_detect_language_from_context():
    """Test detect_language_from_context function."""
    from nodes.meditation_guidance.recommendation import detect_language_from_context

    assert detect_language_from_context({"preferences": {"language": "es"}}, "") == "es"
    assert detect_language_from_context({"locale": "zh-CN"}, "") == "zh"
    assert detect_language_from_context({}, "Hola, necesito ayuda") == "es"
    assert detect_language_from_context({}, "Hello there") is None
