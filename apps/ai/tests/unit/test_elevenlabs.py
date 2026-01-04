"""
Unit tests for ElevenLabs TTS integration - testing pure functions and initialization.
"""

from unittest.mock import patch

import pytest

from src.tts.elevenlabs import (
    ElevenLabsTTS,
    MeditationScript,
)


class TestMeditationScript:
    """Tests for MeditationScript dataclass."""

    def test_create_script(self):
        script = MeditationScript(
            id="test_script",
            title="Test Meditation",
            type="breathing_focus",
            script_content="Welcome to this meditation...",
            duration_estimate_seconds=300,
        )
        assert script.id == "test_script"
        assert script.title == "Test Meditation"
        assert script.duration_estimate_seconds == 300
        assert script.placeholders is None

    def test_script_with_placeholders(self):
        script = MeditationScript(
            id="custom",
            title="Custom",
            type="breathing_focus",
            script_content="Hello {{USER_NAME}}",
            duration_estimate_seconds=300,
            placeholders={"name": "USER_NAME"},
        )
        assert script.placeholders == {"name": "USER_NAME"}


class TestElevenLabsTTS:
    """Tests for ElevenLabsTTS class."""

    def test_init_with_api_key(self):
        tts = ElevenLabsTTS(api_key="test-key")
        assert tts.api_key == "test-key"

    def test_init_without_api_key_raises(self):
        with (
            patch.dict("os.environ", {}, clear=True),
            pytest.raises(ValueError, match="ELEVENLABS_API_KEY"),
        ):
            ElevenLabsTTS(api_key=None)

    def test_get_cache_key_consistent(self):
        tts = ElevenLabsTTS(api_key="test-key")
        script = MeditationScript(
            id="test",
            title="Test",
            type="breathing_focus",
            script_content="Hello world",
            duration_estimate_seconds=60,
        )
        key1 = tts._get_cache_key(script, "voice1")
        key2 = tts._get_cache_key(script, "voice1")
        assert key1 == key2

    def test_get_cache_key_different_for_different_voices(self):
        tts = ElevenLabsTTS(api_key="test-key")
        script = MeditationScript(
            id="test",
            title="Test",
            type="breathing_focus",
            script_content="Hello world",
            duration_estimate_seconds=60,
        )
        key1 = tts._get_cache_key(script, "voice1")
        key2 = tts._get_cache_key(script, "voice2")
        assert key1 != key2

    def test_render_script_basic(self):
        tts = ElevenLabsTTS(api_key="test-key")
        script = MeditationScript(
            id="test",
            title="Test",
            type="breathing_focus",
            script_content="Hello world",
            duration_estimate_seconds=60,
        )
        rendered = tts._render_script(script)
        assert rendered == "Hello world"

    def test_render_script_with_name(self):
        tts = ElevenLabsTTS(api_key="test-key")
        script = MeditationScript(
            id="test",
            title="Test",
            type="breathing_focus",
            script_content="Hello {{USER_NAME}}, welcome.",
            duration_estimate_seconds=60,
        )
        rendered = tts._render_script(script, user_name="Alice")
        assert rendered == "Hello Alice, welcome."

    def test_render_script_with_goal(self):
        tts = ElevenLabsTTS(api_key="test-key")
        script = MeditationScript(
            id="test",
            title="Test",
            type="breathing_focus",
            script_content="Focus on {{USER_GOAL}} today.",
            duration_estimate_seconds=60,
        )
        rendered = tts._render_script(script, user_goal="reducing stress")
        assert rendered == "Focus on reducing stress today."

    def test_render_script_default_goal(self):
        tts = ElevenLabsTTS(api_key="test-key")
        script = MeditationScript(
            id="test",
            title="Test",
            type="breathing_focus",
            script_content="Focus on {{USER_GOAL}}.",
            duration_estimate_seconds=60,
        )
        rendered = tts._render_script(script)
        assert rendered == "Focus on finding peace."
