"""
Unit tests for meditation voice configuration.
"""

from src.tts.voices import (
    DEFAULT_VOICE_KEY,
    MEDITATION_VOICES,
    get_all_voices,
    get_default_voice,
    get_voice,
    get_voice_by_id,
    recommend_voice_for_type,
    validate_voice_id,
)


class TestVoiceConfiguration:
    """Tests for voice configuration constants."""

    def test_default_voice_exists(self):
        """Default voice key should exist in MEDITATION_VOICES."""
        assert DEFAULT_VOICE_KEY in MEDITATION_VOICES

    def test_all_voices_have_required_fields(self):
        """All voices should have required fields."""
        required_fields = {"id", "name", "description", "best_for", "preview_url"}
        for key, voice in MEDITATION_VOICES.items():
            for field in required_fields:
                assert field in voice, f"Voice {key} missing field {field}"

    def test_all_voices_have_valid_best_for(self):
        """All voices should have at least one meditation type in best_for."""
        for key, voice in MEDITATION_VOICES.items():
            assert len(voice["best_for"]) > 0, f"Voice {key} has empty best_for"
            assert all(isinstance(t, str) for t in voice["best_for"]), (
                f"Voice {key} has non-string best_for entries"
            )

    def test_voice_ids_are_strings(self):
        """All voice IDs should be non-empty strings."""
        for key, voice in MEDITATION_VOICES.items():
            assert isinstance(voice["id"], str), f"Voice {key} id is not a string"
            assert len(voice["id"]) > 0, f"Voice {key} has empty id"

    def test_minimum_voice_count(self):
        """Should have at least 3 voices available."""
        assert len(MEDITATION_VOICES) >= 3


class TestGetVoice:
    """Tests for get_voice function."""

    def test_get_existing_voice(self):
        """Should return voice for valid key."""
        voice = get_voice("sarah_calm")
        assert voice is not None
        assert voice["name"] == "Sarah"

    def test_get_nonexistent_voice(self):
        """Should return None for invalid key."""
        voice = get_voice("nonexistent_voice")
        assert voice is None

    def test_get_voice_returns_dict(self):
        """Returned voice should be a dict with expected structure."""
        voice = get_voice("sarah_calm")
        assert isinstance(voice, dict)
        assert "id" in voice
        assert "name" in voice
        assert "description" in voice
        assert "best_for" in voice


class TestGetVoiceById:
    """Tests for get_voice_by_id function."""

    def test_get_voice_by_valid_id(self):
        """Should return voice for valid ElevenLabs ID."""
        # Get the ID of a known voice
        sarah = MEDITATION_VOICES["sarah_calm"]
        voice = get_voice_by_id(sarah["id"])
        assert voice is not None
        assert voice["name"] == "Sarah"

    def test_get_voice_by_invalid_id(self):
        """Should return None for invalid ID."""
        voice = get_voice_by_id("invalid-id-12345")
        assert voice is None


class TestGetAllVoices:
    """Tests for get_all_voices function."""

    def test_returns_list(self):
        """Should return a list."""
        voices = get_all_voices()
        assert isinstance(voices, list)

    def test_returns_all_voices(self):
        """Should return all configured voices."""
        voices = get_all_voices()
        assert len(voices) == len(MEDITATION_VOICES)

    def test_each_voice_is_complete(self):
        """Each voice in the list should have all required fields."""
        voices = get_all_voices()
        for voice in voices:
            assert "id" in voice
            assert "name" in voice
            assert "description" in voice
            assert "best_for" in voice


class TestGetDefaultVoice:
    """Tests for get_default_voice function."""

    def test_returns_voice(self):
        """Should return a voice dict."""
        voice = get_default_voice()
        assert isinstance(voice, dict)

    def test_returns_correct_default(self):
        """Should return the configured default voice."""
        voice = get_default_voice()
        expected = MEDITATION_VOICES[DEFAULT_VOICE_KEY]
        assert voice == expected


class TestRecommendVoiceForType:
    """Tests for recommend_voice_for_type function."""

    def test_recommends_for_body_scan(self):
        """Should recommend a voice with body_scan in best_for."""
        voice = recommend_voice_for_type("body_scan")
        assert voice is not None
        assert "body_scan" in voice["best_for"]

    def test_recommends_for_loving_kindness(self):
        """Should recommend a voice for loving kindness meditation."""
        voice = recommend_voice_for_type("loving_kindness")
        assert voice is not None
        assert "loving_kindness" in voice["best_for"]

    def test_recommends_for_breathing_focus(self):
        """Should recommend a voice for breathing focus."""
        voice = recommend_voice_for_type("breathing_focus")
        assert voice is not None
        assert "breathing_focus" in voice["best_for"]

    def test_recommends_for_sleep(self):
        """Should recommend a voice for sleep meditation."""
        voice = recommend_voice_for_type("sleep")
        assert voice is not None
        assert "sleep" in voice["best_for"]

    def test_recommends_for_anxiety_relief(self):
        """Should recommend a voice for anxiety relief."""
        voice = recommend_voice_for_type("anxiety_relief")
        assert voice is not None
        assert "anxiety_relief" in voice["best_for"]

    def test_returns_default_for_unknown_type(self):
        """Should return default voice for unknown meditation type."""
        voice = recommend_voice_for_type("unknown_type")
        default = get_default_voice()
        assert voice == default


class TestValidateVoiceId:
    """Tests for validate_voice_id function."""

    def test_validates_existing_id(self):
        """Should return True for valid voice ID."""
        sarah = MEDITATION_VOICES["sarah_calm"]
        assert validate_voice_id(sarah["id"]) is True

    def test_invalidates_nonexistent_id(self):
        """Should return False for invalid voice ID."""
        assert validate_voice_id("invalid-id-12345") is False

    def test_invalidates_empty_id(self):
        """Should return False for empty string."""
        assert validate_voice_id("") is False
