"""
Unit tests for meditation recommendation engine - pure function tests.
"""



class TestScoreFunctions:
    """Tests for scoring functions."""

    def test_score_by_duration_exact_match(self):
        from src.nodes.meditation_guidance.recommendation import score_by_duration
        track = {"durationPreset": "short", "type": "breathing_focus"}
        assert score_by_duration(track, "short") == 1.0

    def test_score_by_duration_no_preference(self):
        from src.nodes.meditation_guidance.recommendation import score_by_duration
        track = {"durationPreset": "short", "type": "breathing_focus"}
        assert score_by_duration(track, None) == 0.5

    def test_score_by_duration_mismatch(self):
        from src.nodes.meditation_guidance.recommendation import score_by_duration
        track = {"durationPreset": "short", "type": "breathing_focus"}
        assert score_by_duration(track, "long") == 0.2

    def test_score_by_language_exact_match(self):
        from src.nodes.meditation_guidance.recommendation import score_by_language
        track = {"language": "es", "type": "breathing_focus"}
        assert score_by_language(track, "es") == 1.0

    def test_score_by_language_english_default(self):
        from src.nodes.meditation_guidance.recommendation import score_by_language
        track = {"language": "en", "type": "breathing_focus"}
        assert score_by_language(track, None) == 1.0

    def test_score_by_language_non_english_no_pref(self):
        from src.nodes.meditation_guidance.recommendation import score_by_language
        track = {"language": "zh", "type": "breathing_focus"}
        assert score_by_language(track, None) == 0.3

    def test_score_by_emotional_state_anxiety(self):
        from src.nodes.meditation_guidance.recommendation import score_by_emotional_state
        track = {"type": "anxiety_relief"}
        text = "I feel so anxious and worried"
        score = score_by_emotional_state(track, text)
        assert score > 0.5

    def test_score_by_emotional_state_no_match(self):
        from src.nodes.meditation_guidance.recommendation import score_by_emotional_state
        track = {"type": "anxiety_relief"}
        text = "Hello, how are you?"
        assert score_by_emotional_state(track, text) == 0.0

    def test_score_by_emotional_state_empty(self):
        from src.nodes.meditation_guidance.recommendation import score_by_emotional_state
        track = {"type": "breathing_focus"}
        assert score_by_emotional_state(track, "") == 0.0

    def test_score_by_time_of_day_morning(self):
        from src.nodes.meditation_guidance.recommendation import score_by_time_of_day
        track = {"type": "breathing_focus"}
        assert score_by_time_of_day(track, "morning") == 1.3

    def test_score_by_time_of_day_night_sleep(self):
        from src.nodes.meditation_guidance.recommendation import score_by_time_of_day
        track = {"type": "sleep"}
        assert score_by_time_of_day(track, "night") == 1.8


class TestLanguageDetection:
    """Tests for language detection."""

    def test_explicit_preference(self):
        from src.nodes.meditation_guidance.recommendation import detect_language_from_context
        ctx = {"preferences": {"language": "es"}}
        assert detect_language_from_context(ctx, "") == "es"

    def test_locale_detection(self):
        from src.nodes.meditation_guidance.recommendation import detect_language_from_context
        ctx = {"locale": "zh-CN"}
        assert detect_language_from_context(ctx, "") == "zh"

    def test_spanish_in_text(self):
        from src.nodes.meditation_guidance.recommendation import detect_language_from_context
        ctx = {}
        text = "Hola, necesito ayuda"
        assert detect_language_from_context(ctx, text) == "es"

    def test_no_detection(self):
        from src.nodes.meditation_guidance.recommendation import detect_language_from_context
        ctx = {}
        text = "Hello, I need help"
        assert detect_language_from_context(ctx, text) is None
