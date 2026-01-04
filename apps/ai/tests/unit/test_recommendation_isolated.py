"""
Isolated tests for recommendation module - avoids all circular imports.
"""

import importlib.util
from pathlib import Path

import pytest


def load_recommendation_module():
    """Load recommendation.py directly without triggering imports."""
    module_path = (
        Path(__file__).parent.parent.parent
        / "src"
        / "nodes"
        / "meditation_guidance"
        / "recommendation.py"
    )
    spec = importlib.util.spec_from_file_location("recommendation", module_path)
    module = importlib.util.module_from_spec(spec)

    # Mock the imports that would cause circular dependencies
    import sys
    from unittest.mock import MagicMock

    # Create mock modules
    sys.modules["src.auth"] = MagicMock()
    sys.modules["src.logging_config"] = MagicMock()
    sys.modules["src.logging_config"].NodeLogger = MagicMock()

    spec.loader.exec_module(module)
    return module


class TestRecommendationModule:
    """Tests for recommendation module functions."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.module = load_recommendation_module()

    def test_session_to_duration_mapping(self):
        """Test SESSION_TO_DURATION mapping."""
        mapping = self.module.SESSION_TO_DURATION
        assert mapping["few_minutes"] == "short"
        assert mapping["short"] == "short"
        assert mapping["medium"] == "medium"
        assert mapping["long"] == "long"
        assert mapping["flexible"] is None

    def test_time_of_day_weights(self):
        """Test TIME_OF_DAY_WEIGHTS structure."""
        weights = self.module.TIME_OF_DAY_WEIGHTS
        assert "morning" in weights
        assert "night" in weights
        assert weights["morning"]["breathing_focus"] == 1.3
        assert weights["night"]["sleep"] == 1.8

    def test_emotional_state_signals(self):
        """Test EMOTIONAL_STATE_SIGNALS."""
        signals = self.module.EMOTIONAL_STATE_SIGNALS
        assert "anxious" in signals["anxiety_relief"]
        assert "sleep" in signals["sleep"]

    def test_recommendation_scores_dataclass(self):
        """Test RecommendationScores dataclass."""
        scores = self.module.RecommendationScores()
        assert scores.total_score == 0.0

    def test_score_by_duration_exact_match(self):
        """Test score_by_duration with exact match."""
        track = {"durationPreset": "short", "type": "test"}
        assert self.module.score_by_duration(track, "short") == 1.0

    def test_score_by_duration_no_pref(self):
        """Test score_by_duration with no preference."""
        track = {"durationPreset": "short", "type": "test"}
        assert self.module.score_by_duration(track, None) == 0.5

    def test_score_by_language_exact_match(self):
        """Test score_by_language with exact match."""
        track = {"language": "es", "type": "test"}
        assert self.module.score_by_language(track, "es") == 1.0

    def test_score_by_language_english_default(self):
        """Test score_by_language with English default."""
        track = {"language": "en", "type": "test"}
        assert self.module.score_by_language(track, None) == 1.0

    def test_score_by_emotional_state_match(self):
        """Test score_by_emotional_state with matching keywords."""
        track = {"type": "anxiety_relief"}
        score = self.module.score_by_emotional_state(track, "I feel anxious")
        assert score > 0

    def test_score_by_emotional_state_no_match(self):
        """Test score_by_emotional_state with no matching keywords."""
        track = {"type": "anxiety_relief"}
        assert self.module.score_by_emotional_state(track, "Hello") == 0.0

    def test_score_by_time_of_day(self):
        """Test score_by_time_of_day."""
        track = {"type": "breathing_focus"}
        assert self.module.score_by_time_of_day(track, "morning") == 1.3

    def test_detect_language_explicit_pref(self):
        """Test detect_language_from_context with explicit preference."""
        ctx = {"preferences": {"language": "es"}}
        assert self.module.detect_language_from_context(ctx, "") == "es"

    def test_detect_language_locale(self):
        """Test detect_language_from_context with locale."""
        ctx = {"locale": "zh-CN"}
        assert self.module.detect_language_from_context(ctx, "") == "zh"

    def test_detect_language_spanish_text(self):
        """Test detect_language_from_context with Spanish text."""
        assert self.module.detect_language_from_context({}, "Hola, necesito") == "es"

    def test_detect_language_no_detection(self):
        """Test detect_language_from_context with no signals."""
        assert self.module.detect_language_from_context({}, "Hello") is None
