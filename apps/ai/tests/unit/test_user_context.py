"""
============================================================================
Tests for user_context.py
============================================================================
Tests the format_user_context function that transforms user profile data
into natural language for the AI system prompt.
============================================================================
"""

import pytest

from src.utils.user_context import format_user_context


# -----------------------------------------------------------------------------
# format_user_context - Main Function Tests
# -----------------------------------------------------------------------------


class TestFormatUserContext:
    """Tests for the main format_user_context function."""

    def test_returns_generic_message_when_context_is_none(self) -> None:
        """Should return a generic message when no context is provided."""
        result = format_user_context(None)

        assert "No user context available" in result
        assert "warm, general approach" in result

    def test_returns_generic_message_when_preferences_empty(self) -> None:
        """Should return a message when user has no preferences."""
        context = {"display_name": "Test", "preferences": {}}

        result = format_user_context(context)

        assert "has not completed onboarding" in result

    def test_returns_generic_message_when_preferences_missing(self) -> None:
        """Should handle missing preferences key."""
        context = {"display_name": "Test"}

        result = format_user_context(context)

        assert "has not completed onboarding" in result

    def test_includes_display_name(self) -> None:
        """Should include the user's display name."""
        context = {
            "display_name": "Alex",
            "preferences": {"primary_goal": "stress_anxiety"},
        }

        result = format_user_context(context)

        assert "The user's name is Alex" in result

    def test_formats_full_preferences(self) -> None:
        """Should format all preference fields correctly."""
        context = {
            "display_name": "Jordan",
            "preferences": {
                "current_feeling": "stressed",
                "primary_goal": "stress_anxiety",
                "challenges": ["racing_thoughts", "work_stress"],
                "communication_style": "direct",
                "support_type": "advice",
                "preferred_activities": ["breathing", "meditation"],
                "experience_level": "tried_apps",
                "session_length": "short",
            },
        }

        result = format_user_context(context)

        # Check each section is present
        assert "Jordan" in result
        assert "stressed" in result
        assert "stress and anxiety" in result
        assert "racing thoughts" in result
        assert "work or school stress" in result
        assert "direct" in result
        assert "practical advice" in result
        assert "breathing exercises" in result
        assert "tried wellness apps before" in result
        assert "5-10 minute" in result


# -----------------------------------------------------------------------------
# Individual Preference Mapping Tests
# -----------------------------------------------------------------------------


class TestCurrentFeelingMapping:
    """Tests for current_feeling preference formatting."""

    @pytest.mark.parametrize(
        "feeling,expected",
        [
            ("great", "feeling great"),
            ("okay", "feeling okay but looking to feel better"),
            ("stressed", "feeling stressed or overwhelmed"),
            ("anxious", "feeling anxious or worried"),
            ("sad", "feeling sad or down"),
            ("numb", "feeling numb or disconnected"),
        ],
    )
    def test_maps_feeling_correctly(self, feeling: str, expected: str) -> None:
        """Should map each feeling to its description."""
        context = {
            "display_name": "Test",
            "preferences": {"current_feeling": feeling},
        }

        result = format_user_context(context)

        assert expected in result

    def test_handles_unknown_feeling(self) -> None:
        """Should use the raw value for unknown feelings."""
        context = {
            "display_name": "Test",
            "preferences": {"current_feeling": "mysterious"},
        }

        result = format_user_context(context)

        assert "mysterious" in result


class TestPrimaryGoalMapping:
    """Tests for primary_goal preference formatting."""

    @pytest.mark.parametrize(
        "goal,expected",
        [
            ("stress_anxiety", "managing stress and anxiety"),
            ("mood", "improving their mood"),
            ("sleep", "sleeping better"),
            ("emotions", "processing difficult emotions"),
            ("habits", "building better habits"),
            ("growth", "personal growth and self-discovery"),
            ("talk", "having someone to talk to"),
        ],
    )
    def test_maps_goal_correctly(self, goal: str, expected: str) -> None:
        """Should map each goal to its description."""
        context = {
            "display_name": "Test",
            "preferences": {"primary_goal": goal},
        }

        result = format_user_context(context)

        assert expected in result


class TestChallengesMapping:
    """Tests for challenges preference formatting."""

    def test_formats_single_challenge(self) -> None:
        """Should format a single challenge."""
        context = {
            "display_name": "Test",
            "preferences": {"challenges": ["racing_thoughts"]},
        }

        result = format_user_context(context)

        assert "racing thoughts" in result

    def test_formats_multiple_challenges(self) -> None:
        """Should format multiple challenges as comma-separated list."""
        context = {
            "display_name": "Test",
            "preferences": {"challenges": ["work_stress", "sleep_issues", "focus"]},
        }

        result = format_user_context(context)

        assert "work or school stress" in result
        assert "trouble sleeping" in result
        assert "difficulty focusing" in result

    def test_handles_empty_challenges_list(self) -> None:
        """Should not include challenges line if list is empty."""
        context = {
            "display_name": "Test",
            "preferences": {"challenges": [], "primary_goal": "mood"},
        }

        result = format_user_context(context)

        assert "struggle with" not in result


class TestCommunicationStyleMapping:
    """Tests for communication_style preference formatting."""

    @pytest.mark.parametrize(
        "style,expected",
        [
            ("direct", "direct, to-the-point"),
            ("warm", "warm, conversational"),
            ("reflective", "thoughtful, reflective"),
            ("structured", "structured communication with clear steps"),
        ],
    )
    def test_maps_style_correctly(self, style: str, expected: str) -> None:
        """Should map each communication style correctly."""
        context = {
            "display_name": "Test",
            "preferences": {"communication_style": style},
        }

        result = format_user_context(context)

        assert expected in result


class TestSupportTypeMapping:
    """Tests for support_type preference formatting."""

    @pytest.mark.parametrize(
        "support,expected",
        [
            ("listening", "listen without judgment"),
            ("advice", "practical advice"),
            ("encouragement", "encouragement and validation"),
            ("understanding", "understanding and naming their feelings"),
            ("guided", "guidance through structured exercises"),
        ],
    )
    def test_maps_support_type_correctly(self, support: str, expected: str) -> None:
        """Should map each support type correctly."""
        context = {
            "display_name": "Test",
            "preferences": {"support_type": support},
        }

        result = format_user_context(context)

        assert expected in result


class TestPreferredActivitiesMapping:
    """Tests for preferred_activities preference formatting."""

    def test_formats_multiple_activities(self) -> None:
        """Should format multiple activities as comma-separated list."""
        context = {
            "display_name": "Test",
            "preferences": {
                "preferred_activities": ["breathing", "meditation", "journaling"]
            },
        }

        result = format_user_context(context)

        assert "breathing exercises" in result
        assert "guided meditation" in result
        assert "journaling" in result

    def test_handles_empty_activities_list(self) -> None:
        """Should not include activities line if list is empty."""
        context = {
            "display_name": "Test",
            "preferences": {"preferred_activities": [], "primary_goal": "mood"},
        }

        result = format_user_context(context)

        assert "interested in" not in result


class TestExperienceLevelMapping:
    """Tests for experience_level preference formatting."""

    @pytest.mark.parametrize(
        "level,expected",
        [
            ("first_time", "first time using a wellness app"),
            ("tried_apps", "tried wellness apps before"),
            ("some_therapy", "some experience with wellness practices"),
            ("regular_practice", "practice wellness regularly"),
        ],
    )
    def test_maps_experience_correctly(self, level: str, expected: str) -> None:
        """Should map each experience level correctly."""
        context = {
            "display_name": "Test",
            "preferences": {"experience_level": level},
        }

        result = format_user_context(context)

        assert expected in result


class TestSessionLengthMapping:
    """Tests for session_length preference formatting."""

    @pytest.mark.parametrize(
        "length,expected",
        [
            ("few_minutes", "only have a few minutes"),
            ("short", "5-10 minute sessions"),
            ("medium", "10-20 minute sessions"),
            ("long", "20+ minutes per session"),
            ("flexible", "time varies"),
        ],
    )
    def test_maps_session_length_correctly(self, length: str, expected: str) -> None:
        """Should map each session length correctly."""
        context = {
            "display_name": "Test",
            "preferences": {"session_length": length},
        }

        result = format_user_context(context)

        assert expected in result
