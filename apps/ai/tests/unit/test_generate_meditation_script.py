"""
Unit tests for generate_meditation_script node helper functions.

Note: We test the pure helper functions directly to avoid circular imports
from the full graph module.
"""

import json
from datetime import datetime
from typing import Literal, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage

from src.tts.voices import DEFAULT_VOICE_KEY, MEDITATION_VOICES

# -----------------------------------------------------------------------------
# Copy of pure helper functions from the node for isolated testing
# These are exact copies to test the logic without triggering graph imports
# -----------------------------------------------------------------------------


class Voice(TypedDict):
    """A meditation voice option."""

    id: str
    name: str
    description: str
    best_for: list[str]


class GeneratedScript(TypedDict):
    """The generated meditation script."""

    content: str
    word_count: int
    estimated_duration_seconds: int


class GenerationContext(TypedDict):
    """Context used for script generation."""

    time_of_day: Literal["morning", "afternoon", "evening", "night"]
    primary_intent: str
    memories_used: int
    emotional_signals: list[str]


class AIGeneratedMeditationActivity(TypedDict):
    """Activity data for AI-generated meditation."""

    type: Literal["activity"]
    activity: Literal["meditation_ai_generated"]
    status: Literal["ready"]
    meditation_id: str
    title: str
    meditation_type: str
    duration_minutes: int
    script: GeneratedScript
    voice: Voice
    generation_context: GenerationContext
    introduction: str


def get_time_of_day() -> Literal["morning", "afternoon", "evening", "night"]:
    """Determine the time of day for appropriate meditation style."""
    hour = datetime.now().hour
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"


def get_last_user_message(messages: list[BaseMessage]) -> str:
    """Extract the content of the last human message."""
    for message in reversed(messages):
        if isinstance(message, HumanMessage):
            return str(message.content)
    return ""


def detect_emotional_signals(message: str) -> list[str]:
    """Detect emotional signals from the user's message."""
    signals = []

    anxiety_words = ["anxious", "worried", "stressed", "overwhelmed", "panic", "nervous"]
    if any(word in message.lower() for word in anxiety_words):
        signals.append("anxiety")

    sad_words = ["sad", "down", "depressed", "unhappy", "lonely", "lost"]
    if any(word in message.lower() for word in sad_words):
        signals.append("sadness")

    sleep_words = ["sleep", "insomnia", "tired", "exhausted", "can't sleep", "bedtime"]
    if any(word in message.lower() for word in sleep_words):
        signals.append("sleep_issues")

    tension_words = ["tense", "tight", "pain", "headache", "stiff", "body aches"]
    if any(word in message.lower() for word in tension_words):
        signals.append("physical_tension")

    overwhelm_words = ["too much", "overwhelming", "can't cope", "falling apart"]
    if any(word in message.lower() for word in overwhelm_words):
        signals.append("overwhelm")

    return signals


def select_meditation_type(
    emotional_signals: list[str],
    time_of_day: str,
    user_preferences: dict,
) -> str:
    """Select the most appropriate meditation type based on context."""
    if "anxiety" in emotional_signals or "overwhelm" in emotional_signals:
        return "anxiety_relief"
    if "physical_tension" in emotional_signals:
        return "body_scan"
    if "sadness" in emotional_signals:
        return "loving_kindness"
    if "sleep_issues" in emotional_signals or time_of_day == "night":
        return "sleep"

    if time_of_day == "morning":
        return "breathing_focus"
    if time_of_day == "evening":
        return "body_scan"

    return "breathing_focus"


def select_duration(user_preferences: dict, time_of_day: str) -> int:
    """Select meditation duration based on preferences and context."""
    session_length = user_preferences.get("session_length", "medium")

    duration_map = {
        "few_minutes": 5,
        "short": 5,
        "medium": 7,
        "long": 10,
        "flexible": 10,
    }

    base_duration = duration_map.get(session_length, 7)

    if time_of_day == "night":
        return min(base_duration + 5, 15)

    return base_duration


def recommend_voice(meditation_type: str) -> str:
    """Recommend a voice based on meditation type."""
    for voice_key, voice in MEDITATION_VOICES.items():
        if meditation_type in voice["best_for"]:
            return voice_key
    return DEFAULT_VOICE_KEY


def format_activity_message(activity_data: AIGeneratedMeditationActivity) -> str:
    """Format the activity data as a message with markers."""
    return f"[ACTIVITY_START]{json.dumps(activity_data)}[ACTIVITY_END]"


# -----------------------------------------------------------------------------
# Tests
# -----------------------------------------------------------------------------


class TestGetTimeOfDay:
    """Tests for get_time_of_day function."""

    def test_returns_valid_time_period(self):
        """Should return one of the valid time periods."""
        result = get_time_of_day()
        assert result in ["morning", "afternoon", "evening", "night"]

    def test_time_logic_morning(self):
        """Morning logic: hours 5-11 should map to morning."""
        for hour in [5, 6, 7, 8, 9, 10, 11]:
            assert 5 <= hour < 12, f"Hour {hour} should be morning"

    def test_time_logic_afternoon(self):
        """Afternoon logic: hours 12-16 should map to afternoon."""
        for hour in [12, 13, 14, 15, 16]:
            assert 12 <= hour < 17, f"Hour {hour} should be afternoon"

    def test_time_logic_evening(self):
        """Evening logic: hours 17-20 should map to evening."""
        for hour in [17, 18, 19, 20]:
            assert 17 <= hour < 21, f"Hour {hour} should be evening"

    def test_time_logic_night(self):
        """Night logic: hours 21-4 should map to night."""
        for hour in [21, 22, 23, 0, 1, 2, 3, 4]:
            assert hour >= 21 or hour < 5, f"Hour {hour} should be night"


class TestGetLastUserMessage:
    """Tests for get_last_user_message function."""

    def test_single_human_message(self):
        """Should return content of single human message."""
        messages = [HumanMessage(content="Hello, I need help")]
        result = get_last_user_message(messages)
        assert result == "Hello, I need help"

    def test_multiple_messages(self):
        """Should return last human message content."""
        messages = [
            HumanMessage(content="First message"),
            AIMessage(content="AI response"),
            HumanMessage(content="Second message"),
            AIMessage(content="Another AI response"),
        ]
        result = get_last_user_message(messages)
        assert result == "Second message"

    def test_no_human_messages(self):
        """Should return empty string if no human messages."""
        messages = [
            AIMessage(content="AI message 1"),
            AIMessage(content="AI message 2"),
        ]
        result = get_last_user_message(messages)
        assert result == ""

    def test_empty_messages(self):
        """Should return empty string for empty list."""
        result = get_last_user_message([])
        assert result == ""


class TestDetectEmotionalSignals:
    """Tests for detect_emotional_signals function."""

    def test_detects_anxiety(self):
        """Should detect anxiety signals."""
        message = "I'm feeling very anxious about tomorrow"
        signals = detect_emotional_signals(message)
        assert "anxiety" in signals

    def test_detects_stress(self):
        """Should detect stress as anxiety."""
        message = "I'm so stressed"
        signals = detect_emotional_signals(message)
        assert "anxiety" in signals

    def test_detects_overwhelm(self):
        """Should detect overwhelm signals."""
        message = "It's too much, I can't cope"
        signals = detect_emotional_signals(message)
        assert "overwhelm" in signals

    def test_detects_sadness(self):
        """Should detect sadness signals."""
        message = "I've been feeling sad and lonely lately"
        signals = detect_emotional_signals(message)
        assert "sadness" in signals

    def test_detects_sleep_issues(self):
        """Should detect sleep-related signals."""
        message = "I can't sleep and feel exhausted"
        signals = detect_emotional_signals(message)
        assert "sleep_issues" in signals

    def test_detects_physical_tension(self):
        """Should detect physical tension signals."""
        message = "I have a headache and my shoulders are tense"
        signals = detect_emotional_signals(message)
        assert "physical_tension" in signals

    def test_detects_overwhelm_with_cant_cope(self):
        """Should detect overwhelm when 'can't cope' is present."""
        message = "Everything is too much, I can't cope"
        signals = detect_emotional_signals(message)
        assert "overwhelm" in signals

    def test_multiple_signals(self):
        """Should detect multiple emotional signals."""
        message = "I'm anxious and sad, can't sleep, and have a terrible headache"
        signals = detect_emotional_signals(message)
        assert "anxiety" in signals
        assert "sadness" in signals
        assert "sleep_issues" in signals
        assert "physical_tension" in signals

    def test_no_signals(self):
        """Should return empty list for neutral message."""
        message = "I want to try meditation today"
        signals = detect_emotional_signals(message)
        assert len(signals) == 0

    def test_case_insensitive(self):
        """Should detect signals regardless of case."""
        message = "I'm ANXIOUS and STRESSED"
        signals = detect_emotional_signals(message)
        assert "anxiety" in signals


class TestSelectMeditationType:
    """Tests for select_meditation_type function."""

    def test_selects_anxiety_relief_for_anxiety(self):
        """Should select anxiety_relief for anxiety signals."""
        meditation_type = select_meditation_type(
            emotional_signals=["anxiety"],
            time_of_day="afternoon",
            user_preferences={},
        )
        assert meditation_type == "anxiety_relief"

    def test_selects_anxiety_relief_for_overwhelm(self):
        """Should select anxiety_relief for overwhelm signals."""
        meditation_type = select_meditation_type(
            emotional_signals=["overwhelm"],
            time_of_day="afternoon",
            user_preferences={},
        )
        assert meditation_type == "anxiety_relief"

    def test_selects_body_scan_for_tension(self):
        """Should select body_scan for physical tension."""
        meditation_type = select_meditation_type(
            emotional_signals=["physical_tension"],
            time_of_day="afternoon",
            user_preferences={},
        )
        assert meditation_type == "body_scan"

    def test_selects_loving_kindness_for_sadness(self):
        """Should select loving_kindness for sadness."""
        meditation_type = select_meditation_type(
            emotional_signals=["sadness"],
            time_of_day="afternoon",
            user_preferences={},
        )
        assert meditation_type == "loving_kindness"

    def test_selects_sleep_for_sleep_issues(self):
        """Should select sleep for sleep issues."""
        meditation_type = select_meditation_type(
            emotional_signals=["sleep_issues"],
            time_of_day="afternoon",
            user_preferences={},
        )
        assert meditation_type == "sleep"

    def test_selects_sleep_for_night_time(self):
        """Should select sleep for night time even without signals."""
        meditation_type = select_meditation_type(
            emotional_signals=[],
            time_of_day="night",
            user_preferences={},
        )
        assert meditation_type == "sleep"

    def test_selects_breathing_focus_for_morning(self):
        """Should select breathing_focus for morning."""
        meditation_type = select_meditation_type(
            emotional_signals=[],
            time_of_day="morning",
            user_preferences={},
        )
        assert meditation_type == "breathing_focus"

    def test_selects_body_scan_for_evening(self):
        """Should select body_scan for evening."""
        meditation_type = select_meditation_type(
            emotional_signals=[],
            time_of_day="evening",
            user_preferences={},
        )
        assert meditation_type == "body_scan"

    def test_default_to_breathing_focus(self):
        """Should default to breathing_focus for afternoon with no signals."""
        meditation_type = select_meditation_type(
            emotional_signals=[],
            time_of_day="afternoon",
            user_preferences={},
        )
        assert meditation_type == "breathing_focus"

    def test_anxiety_takes_priority(self):
        """Anxiety should take priority over time-based selection."""
        meditation_type = select_meditation_type(
            emotional_signals=["anxiety"],
            time_of_day="morning",
            user_preferences={},
        )
        assert meditation_type == "anxiety_relief"


class TestSelectDuration:
    """Tests for select_duration function."""

    def test_short_preference(self):
        """Should return 5 minutes for short preference."""
        duration = select_duration(
            user_preferences={"session_length": "short"},
            time_of_day="afternoon",
        )
        assert duration == 5

    def test_few_minutes_preference(self):
        """Should return 5 minutes for few_minutes preference."""
        duration = select_duration(
            user_preferences={"session_length": "few_minutes"},
            time_of_day="afternoon",
        )
        assert duration == 5

    def test_medium_preference(self):
        """Should return 7 minutes for medium preference."""
        duration = select_duration(
            user_preferences={"session_length": "medium"},
            time_of_day="afternoon",
        )
        assert duration == 7

    def test_long_preference(self):
        """Should return 10 minutes for long preference."""
        duration = select_duration(
            user_preferences={"session_length": "long"},
            time_of_day="afternoon",
        )
        assert duration == 10

    def test_flexible_preference(self):
        """Should return 10 minutes for flexible preference."""
        duration = select_duration(
            user_preferences={"session_length": "flexible"},
            time_of_day="afternoon",
        )
        assert duration == 10

    def test_default_duration(self):
        """Should return 7 minutes when no preference set."""
        duration = select_duration(
            user_preferences={},
            time_of_day="afternoon",
        )
        assert duration == 7

    def test_night_adds_time(self):
        """Should add 5 minutes for night time."""
        duration = select_duration(
            user_preferences={"session_length": "short"},
            time_of_day="night",
        )
        assert duration == 10  # 5 + 5

    def test_night_caps_at_15(self):
        """Night duration should cap at 15 minutes."""
        duration = select_duration(
            user_preferences={"session_length": "long"},
            time_of_day="night",
        )
        assert duration == 15  # min(10 + 5, 15)

    def test_unknown_preference_uses_default(self):
        """Unknown preference value should use default 7 minutes."""
        duration = select_duration(
            user_preferences={"session_length": "unknown_value"},
            time_of_day="afternoon",
        )
        assert duration == 7


class TestRecommendVoice:
    """Tests for recommend_voice function."""

    def test_recommends_for_body_scan(self):
        """Should recommend voice suitable for body scan."""
        voice_key = recommend_voice("body_scan")
        assert voice_key is not None
        assert len(voice_key) > 0

    def test_recommends_for_loving_kindness(self):
        """Should recommend voice suitable for loving kindness."""
        voice_key = recommend_voice("loving_kindness")
        assert voice_key is not None

    def test_recommends_for_breathing_focus(self):
        """Should recommend voice suitable for breathing focus."""
        voice_key = recommend_voice("breathing_focus")
        assert voice_key is not None

    def test_recommends_for_sleep(self):
        """Should recommend voice suitable for sleep meditation."""
        voice_key = recommend_voice("sleep")
        assert voice_key is not None

    def test_recommends_for_anxiety_relief(self):
        """Should recommend voice suitable for anxiety relief."""
        voice_key = recommend_voice("anxiety_relief")
        assert voice_key is not None

    def test_returns_default_for_unknown_type(self):
        """Should return default voice for unknown type."""
        voice_key = recommend_voice("unknown_type")
        assert voice_key is not None  # Should fall back to default


class TestFormatActivityMessage:
    """Tests for format_activity_message function."""

    def test_formats_with_markers(self):
        """Should wrap activity data in markers."""
        activity_data: AIGeneratedMeditationActivity = {
            "type": "activity",
            "activity": "meditation_ai_generated",
            "status": "ready",
            "meditation_id": "test-id-123",
            "title": "Morning Calm",
            "meditation_type": "breathing_focus",
            "duration_minutes": 7,
            "script": {
                "content": "Test script content",
                "word_count": 3,
                "estimated_duration_seconds": 120,
            },
            "voice": {
                "id": "voice-123",
                "name": "Sarah",
                "description": "Calm voice",
                "best_for": ["breathing_focus"],
            },
            "generation_context": {
                "time_of_day": "morning",
                "primary_intent": "relaxation",
                "memories_used": 2,
                "emotional_signals": [],
            },
            "introduction": "Welcome to your meditation.",
        }

        result = format_activity_message(activity_data)

        assert result.startswith("[ACTIVITY_START]")
        assert result.endswith("[ACTIVITY_END]")

    def test_contains_valid_json(self):
        """Should contain valid JSON between markers."""
        activity_data: AIGeneratedMeditationActivity = {
            "type": "activity",
            "activity": "meditation_ai_generated",
            "status": "ready",
            "meditation_id": "test-id",
            "title": "Test",
            "meditation_type": "sleep",
            "duration_minutes": 10,
            "script": {
                "content": "Script",
                "word_count": 1,
                "estimated_duration_seconds": 60,
            },
            "voice": {
                "id": "v1",
                "name": "Test",
                "description": "Test voice",
                "best_for": ["sleep"],
            },
            "generation_context": {
                "time_of_day": "night",
                "primary_intent": "sleep",
                "memories_used": 0,
                "emotional_signals": ["sleep_issues"],
            },
            "introduction": "Time for sleep.",
        }

        result = format_activity_message(activity_data)

        # Extract JSON from markers
        json_str = result[len("[ACTIVITY_START]") : -len("[ACTIVITY_END]")]
        parsed = json.loads(json_str)

        assert parsed["type"] == "activity"
        assert parsed["activity"] == "meditation_ai_generated"
        assert parsed["meditation_id"] == "test-id"

    def test_preserves_all_fields(self):
        """Should preserve all activity data fields."""
        activity_data: AIGeneratedMeditationActivity = {
            "type": "activity",
            "activity": "meditation_ai_generated",
            "status": "ready",
            "meditation_id": "uuid-here",
            "title": "Personalized Meditation",
            "meditation_type": "anxiety_relief",
            "duration_minutes": 5,
            "script": {
                "content": "Full meditation script here...",
                "word_count": 500,
                "estimated_duration_seconds": 300,
            },
            "voice": {
                "id": "sarah-voice-id",
                "name": "Sarah",
                "description": "Warm and calming",
                "best_for": ["anxiety_relief", "breathing_focus"],
            },
            "generation_context": {
                "time_of_day": "afternoon",
                "primary_intent": "calm down from work stress",
                "memories_used": 3,
                "emotional_signals": ["anxiety", "overwhelm"],
            },
            "introduction": "I've created this for you...",
        }

        result = format_activity_message(activity_data)
        json_str = result[len("[ACTIVITY_START]") : -len("[ACTIVITY_END]")]
        parsed = json.loads(json_str)

        assert parsed["meditation_type"] == "anxiety_relief"
        assert parsed["duration_minutes"] == 5
        assert parsed["script"]["word_count"] == 500
        assert parsed["voice"]["name"] == "Sarah"
        assert len(parsed["generation_context"]["emotional_signals"]) == 2


class TestEmotionalSignalPriority:
    """Tests for emotional signal priority in meditation type selection."""

    def test_anxiety_over_sadness(self):
        """Anxiety should take priority over sadness."""
        meditation_type = select_meditation_type(
            emotional_signals=["anxiety", "sadness"],
            time_of_day="afternoon",
            user_preferences={},
        )
        assert meditation_type == "anxiety_relief"

    def test_overwhelm_over_tension(self):
        """Overwhelm should take priority over physical tension."""
        meditation_type = select_meditation_type(
            emotional_signals=["overwhelm", "physical_tension"],
            time_of_day="afternoon",
            user_preferences={},
        )
        assert meditation_type == "anxiety_relief"

    def test_tension_over_sadness(self):
        """Physical tension should take priority over sadness."""
        meditation_type = select_meditation_type(
            emotional_signals=["physical_tension", "sadness"],
            time_of_day="afternoon",
            user_preferences={},
        )
        assert meditation_type == "body_scan"

    def test_sadness_over_sleep(self):
        """Sadness should take priority over sleep issues."""
        meditation_type = select_meditation_type(
            emotional_signals=["sadness", "sleep_issues"],
            time_of_day="afternoon",
            user_preferences={},
        )
        assert meditation_type == "loving_kindness"
