"""
Unit tests for parallel streaming pipeline.
"""

from src.tts.parallel_streaming import (
    PAUSE_PATTERN,
    SENTENCE_BOUNDARY_PATTERN,
    StreamingConfig,
    StreamingState,
    extract_sentences,
    is_sentence_complete,
)


class TestSentenceBoundaryPattern:
    """Tests for the sentence boundary regex pattern."""

    def test_matches_period_with_space(self):
        """Should match period followed by space."""
        text = "Hello world. This is a test."
        matches = SENTENCE_BOUNDARY_PATTERN.findall(text)
        assert len(matches) == 1

    def test_matches_exclamation_with_space(self):
        """Should match exclamation mark followed by space."""
        text = "Wow! That was great."
        matches = SENTENCE_BOUNDARY_PATTERN.findall(text)
        assert len(matches) == 1

    def test_matches_question_mark_with_space(self):
        """Should match question mark followed by space."""
        text = "How are you? I hope you're well."
        matches = SENTENCE_BOUNDARY_PATTERN.findall(text)
        assert len(matches) == 1

    def test_matches_paragraph_break(self):
        """Should match double newline (paragraph break)."""
        text = "First paragraph.\n\nSecond paragraph."
        matches = SENTENCE_BOUNDARY_PATTERN.findall(text)
        # The pattern finds '. ' or '\n\n' - here it finds '.\n\n' as one match
        # because the regex matches period+whitespace or paragraph break
        assert len(matches) >= 1

    def test_multiple_sentences(self):
        """Should find all sentence boundaries."""
        text = "First. Second! Third? Fourth."
        matches = SENTENCE_BOUNDARY_PATTERN.findall(text)
        assert len(matches) == 3  # Last period has no following space

    def test_no_match_without_space(self):
        """Should not match punctuation without following space."""
        text = "Hello."
        matches = SENTENCE_BOUNDARY_PATTERN.findall(text)
        assert len(matches) == 0


class TestPausePattern:
    """Tests for the pause marker regex pattern."""

    def test_matches_pause_marker(self):
        """Should match [PAUSE Xs] markers."""
        text = "Take a deep breath. [PAUSE 5s] Now exhale slowly."
        matches = PAUSE_PATTERN.findall(text)
        assert len(matches) == 1
        assert matches[0] == "[PAUSE 5s]"

    def test_matches_different_durations(self):
        """Should match various pause durations."""
        text = "[PAUSE 3s] [PAUSE 10s] [PAUSE 30s]"
        matches = PAUSE_PATTERN.findall(text)
        assert len(matches) == 3

    def test_no_match_without_digits(self):
        """Should not match [PAUSE] without duration."""
        text = "[PAUSE] Some text"
        matches = PAUSE_PATTERN.findall(text)
        assert len(matches) == 0

    def test_no_match_wrong_format(self):
        """Should not match malformed pause markers."""
        text = "[PAUSE5s] (PAUSE 5s) PAUSE 5s"
        matches = PAUSE_PATTERN.findall(text)
        assert len(matches) == 0


class TestIsSentenceComplete:
    """Tests for is_sentence_complete function."""

    def test_period_at_end(self):
        """Text ending with period is complete."""
        assert is_sentence_complete("This is a sentence.")

    def test_period_with_space(self):
        """Text ending with period and space is complete."""
        assert is_sentence_complete("This is a sentence. ")

    def test_exclamation_at_end(self):
        """Text ending with exclamation mark is complete."""
        assert is_sentence_complete("What an amazing day!")

    def test_question_at_end(self):
        """Text ending with question mark is complete."""
        assert is_sentence_complete("How are you feeling?")

    def test_paragraph_break(self):
        """Text with paragraph break is complete."""
        assert is_sentence_complete("First part\n\nSecond part")

    def test_pause_marker_with_content(self):
        """Text with pause marker and sufficient content is complete."""
        assert is_sentence_complete("Take a deep breath [PAUSE 5s]")

    def test_pause_marker_without_enough_content(self):
        """Pause marker with short content is not complete."""
        # Less than 20 chars
        assert not is_sentence_complete("[PAUSE 5s]")

    def test_incomplete_sentence(self):
        """Text without sentence ending is not complete."""
        assert not is_sentence_complete("This is not complete")

    def test_empty_string(self):
        """Empty string is not complete."""
        assert not is_sentence_complete("")

    def test_whitespace_only(self):
        """Whitespace-only string is not complete."""
        assert not is_sentence_complete("   \n  ")

    def test_multiple_sentences(self):
        """Multiple sentences should be detected as complete."""
        assert is_sentence_complete("First sentence. Second sentence.")


class TestExtractSentences:
    """Tests for extract_sentences function."""

    def test_extracts_single_sentence(self):
        """Should extract a single complete sentence."""
        text = "This is a sentence. And this continues"
        sentences, remaining = extract_sentences(text)
        assert sentences == "This is a sentence."
        assert remaining == "And this continues"

    def test_extracts_multiple_sentences(self):
        """Should extract all complete sentences."""
        text = "First sentence. Second sentence! Third continues"
        sentences, remaining = extract_sentences(text)
        assert "First sentence." in sentences
        assert "Second sentence!" in sentences
        assert remaining == "Third continues"

    def test_no_complete_sentence(self):
        """Should return empty string if no complete sentence."""
        text = "This text has no sentence ending"
        sentences, remaining = extract_sentences(text)
        assert sentences == ""
        assert remaining == text

    def test_all_complete(self):
        """Should handle when all text is complete sentences."""
        text = "First. Second. "
        sentences, _remaining = extract_sentences(text)
        assert "First" in sentences
        assert "Second" in sentences
        # Remaining may have trailing whitespace stripped

    def test_paragraph_break(self):
        """Should split on paragraph breaks."""
        text = "First paragraph\n\nSecond paragraph"
        sentences, remaining = extract_sentences(text)
        assert "First paragraph" in sentences
        assert "Second paragraph" in remaining or remaining == "Second paragraph"

    def test_empty_input(self):
        """Should handle empty input."""
        sentences, remaining = extract_sentences("")
        assert sentences == ""
        assert remaining == ""

    def test_preserves_punctuation(self):
        """Should preserve punctuation in extracted sentences."""
        text = "Hello! How are you? I'm fine. Thanks"
        sentences, _remaining = extract_sentences(text)
        assert "!" in sentences
        assert "?" in sentences
        assert "." in sentences


class TestStreamingConfig:
    """Tests for StreamingConfig dataclass."""

    def test_default_values(self):
        """Should have correct default values."""
        config = StreamingConfig(voice_id="test-voice-id")
        assert config.voice_id == "test-voice-id"
        assert config.model_id == "eleven_multilingual_v2"
        assert config.stability == 0.75
        assert config.similarity_boost == 0.75
        assert config.style == 0.5
        assert config.use_speaker_boost is True

    def test_custom_values(self):
        """Should accept custom values."""
        config = StreamingConfig(
            voice_id="custom-voice",
            model_id="eleven_monolingual_v1",
            stability=0.5,
            similarity_boost=0.8,
            style=0.3,
            use_speaker_boost=False,
        )
        assert config.voice_id == "custom-voice"
        assert config.model_id == "eleven_monolingual_v1"
        assert config.stability == 0.5
        assert config.similarity_boost == 0.8
        assert config.style == 0.3
        assert config.use_speaker_boost is False


class TestStreamingState:
    """Tests for StreamingState dataclass."""

    def test_default_values(self):
        """Should have correct default values."""
        state = StreamingState()
        assert state.sentence_buffer == ""
        assert state.audio_chunks == []
        assert state.total_script == ""
        assert state.sentences_sent == 0
        assert state.bytes_streamed == 0

    def test_mutable_list_independence(self):
        """Each instance should have independent lists."""
        state1 = StreamingState()
        state2 = StreamingState()

        state1.audio_chunks.append(b"chunk1")
        assert len(state1.audio_chunks) == 1
        assert len(state2.audio_chunks) == 0

    def test_state_mutation(self):
        """Should allow state mutation."""
        state = StreamingState()
        state.sentence_buffer = "New text"
        state.sentences_sent = 5
        state.bytes_streamed = 1024

        assert state.sentence_buffer == "New text"
        assert state.sentences_sent == 5
        assert state.bytes_streamed == 1024


class TestSentenceBufferingIntegration:
    """Integration tests for sentence buffering logic."""

    def test_buffering_flow(self):
        """Test the complete buffering flow with simulated tokens."""
        # Simulate Claude generating tokens
        tokens = [
            "Take ",
            "a ",
            "deep ",
            "breath. ",
            "Now ",
            "exhale ",
            "slowly.",
        ]

        buffer = ""
        sentences_collected = []

        for token in tokens:
            buffer += token

            if is_sentence_complete(buffer):
                sentences, remaining = extract_sentences(buffer)
                if sentences:
                    sentences_collected.append(sentences)
                buffer = remaining

        # Should have collected at least one sentence
        assert len(sentences_collected) >= 1
        assert "breath" in sentences_collected[0].lower()

    def test_long_text_buffering(self):
        """Test buffering with longer meditation text."""
        meditation_text = """
        Welcome to this meditation. Take a deep breath in.
        Feel your body begin to relax. Let go of any tension.

        Now focus on your breathing. In and out. Slow and steady.
        """

        # Split into tokens (simulating streaming)
        words = meditation_text.split()
        buffer = ""
        sentences_collected = []

        for word in words:
            buffer += word + " "

            if is_sentence_complete(buffer):
                sentences, remaining = extract_sentences(buffer)
                if sentences:
                    sentences_collected.append(sentences.strip())
                buffer = remaining

        # Should have collected multiple sentences
        assert len(sentences_collected) >= 3

    def test_flush_remaining(self):
        """Test that remaining buffer text gets flushed at end."""
        tokens = ["Final ", "incomplete ", "sentence"]
        buffer = "".join(tokens)

        # Before flush - no complete sentence
        sentences, remaining = extract_sentences(buffer)
        assert sentences == ""
        assert remaining == buffer

        # At end of stream, remaining should be sent
        final_text = remaining.strip()
        assert len(final_text) > 0
        assert "Final incomplete sentence" in final_text
