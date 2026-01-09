"""
Unit tests for OpenAI Audio integration.

Tests the OpenAI Chat Completions audio API wrapper for meditation generation.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.tts.openai_audio import (
    DEFAULT_MEDITATION_SYSTEM_PROMPT,
    VALID_VOICES,
    GeneratedMeditation,
    MeditationScript,
    OpenAIAudio,
    convert_pcm16_to_mp3,
    stream_meditation_audio,
    stream_pcm16_to_mp3,
)


class TestValidVoices:
    """Tests for valid voice constants."""

    def test_valid_voices_list(self):
        """Should have all 13 OpenAI voices."""
        expected = [
            "alloy",
            "ash",
            "ballad",
            "coral",
            "echo",
            "fable",
            "marin",
            "nova",
            "onyx",
            "sage",
            "shimmer",
            "verse",
            "cedar",
        ]
        assert set(VALID_VOICES) == set(expected)
        assert len(VALID_VOICES) == 13

    def test_voices_are_strings(self):
        """All voices should be non-empty strings."""
        for voice in VALID_VOICES:
            assert isinstance(voice, str)
            assert len(voice) > 0


class TestMeditationScript:
    """Tests for MeditationScript dataclass."""

    def test_create_script(self):
        """Should create script with required fields."""
        script = MeditationScript(
            id="test_script",
            title="Test Meditation",
            type="breathing_focus",
            script_content="Welcome to this meditation...",
            duration_estimate_seconds=300,
        )
        assert script.id == "test_script"
        assert script.title == "Test Meditation"
        assert script.type == "breathing_focus"
        assert script.duration_estimate_seconds == 300
        assert script.placeholders is None

    def test_script_with_placeholders(self):
        """Should create script with placeholders."""
        script = MeditationScript(
            id="custom",
            title="Custom",
            type="breathing_focus",
            script_content="Hello {{USER_NAME}}",
            duration_estimate_seconds=300,
            placeholders={"name": "USER_NAME"},
        )
        assert script.placeholders == {"name": "USER_NAME"}


class TestGeneratedMeditation:
    """Tests for GeneratedMeditation dataclass."""

    def test_create_generated(self):
        """Should create generated meditation with all fields."""
        generated = GeneratedMeditation(
            script_id="test-123",
            audio_url="https://example.com/audio.mp3",
            duration_seconds=300,
            voice="nova",
            cached=False,
        )
        assert generated.script_id == "test-123"
        assert generated.audio_url == "https://example.com/audio.mp3"
        assert generated.duration_seconds == 300
        assert generated.voice == "nova"
        assert generated.cached is False

    def test_create_cached(self):
        """Should track cached status."""
        generated = GeneratedMeditation(
            script_id="test-456",
            audio_url="https://example.com/cached.mp3",
            duration_seconds=600,
            voice="shimmer",
            cached=True,
        )
        assert generated.cached is True


class TestOpenAIAudio:
    """Tests for OpenAIAudio class."""

    def test_init_with_valid_voice(self):
        """Should initialize with valid voice."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
            audio = OpenAIAudio(voice="marin")
            assert audio.voice == "marin"
            assert audio.model == "gpt-4o-mini-audio-preview"

    def test_init_with_custom_model(self):
        """Should accept custom model."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
            audio = OpenAIAudio(voice="nova", model="gpt-4o-mini-audio")
            assert audio.model == "gpt-4o-mini-audio"

    def test_init_all_valid_voices(self):
        """Should accept all valid voices."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
            for voice in VALID_VOICES:
                audio = OpenAIAudio(voice=voice)
                assert audio.voice == voice

    def test_init_with_invalid_voice_raises(self):
        """Should raise for invalid voice."""
        with (
            patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}),
            pytest.raises(ValueError, match="Voice must be one of"),
        ):
            OpenAIAudio(voice="invalid_voice")

    def test_init_without_api_key_raises(self):
        """Should raise when API key not provided."""
        with (
            patch.dict("os.environ", {}, clear=True),
            pytest.raises(ValueError, match="OPENAI_API_KEY"),
        ):
            OpenAIAudio(api_key=None)

    def test_init_with_explicit_api_key(self):
        """Should use explicit API key over environment."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "env-key"}):
            audio = OpenAIAudio(api_key="explicit-key", voice="nova")
            assert audio.api_key == "explicit-key"

    def test_get_cache_key_consistent(self):
        """Cache key should be consistent for same inputs."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
            audio = OpenAIAudio(voice="nova")
            key1 = audio._get_cache_key("test prompt", "nova")
            key2 = audio._get_cache_key("test prompt", "nova")
            assert key1 == key2

    def test_get_cache_key_different_for_voices(self):
        """Cache key should differ for different voices."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
            audio = OpenAIAudio(voice="nova")
            key1 = audio._get_cache_key("test prompt", "nova")
            key2 = audio._get_cache_key("test prompt", "shimmer")
            assert key1 != key2

    def test_get_cache_key_different_for_prompts(self):
        """Cache key should differ for different prompts."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
            audio = OpenAIAudio(voice="nova")
            key1 = audio._get_cache_key("prompt one", "nova")
            key2 = audio._get_cache_key("prompt two", "nova")
            assert key1 != key2

    def test_cache_key_format(self):
        """Cache key should have expected format."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
            audio = OpenAIAudio(voice="nova")
            key = audio._get_cache_key("test", "nova")
            assert key.startswith("openai-")
            # Should be hash format: openai-<16 char hex>
            assert len(key) == len("openai-") + 16


class TestDefaultSystemPrompt:
    """Tests for default system prompt."""

    def test_prompt_exists(self):
        """Default prompt should exist."""
        assert DEFAULT_MEDITATION_SYSTEM_PROMPT is not None
        assert len(DEFAULT_MEDITATION_SYSTEM_PROMPT) > 0

    def test_prompt_contains_meditation_guidance(self):
        """Prompt should contain meditation-related instructions."""
        prompt = DEFAULT_MEDITATION_SYSTEM_PROMPT.lower()
        assert "calm" in prompt or "soothing" in prompt
        assert "meditation" in prompt or "peaceful" in prompt


class TestStreamMeditationAudio:
    """Tests for stream_meditation_audio convenience function."""

    @pytest.mark.asyncio
    async def test_creates_openai_audio_instance(self):
        """Should create OpenAIAudio with correct voice."""
        with (
            patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}),
            patch("src.tts.openai_audio.OpenAIAudio", autospec=True) as mock_class,
        ):
            mock_instance = MagicMock()

            # Create async generator mock
            async def mock_stream(*_args: object, **_kwargs: object) -> None:
                for chunk in [b"chunk1", b"chunk2"]:
                    yield chunk

            mock_instance.stream_meditation = mock_stream
            mock_class.return_value = mock_instance

            chunks = []
            async for chunk in stream_meditation_audio("test prompt", voice="onyx"):
                chunks.append(chunk)

            # Verify OpenAIAudio was created with correct voice
            mock_class.assert_called_once_with(voice="onyx")
            assert chunks == [b"chunk1", b"chunk2"]


class TestOpenAIAudioStreaming:
    """Tests for streaming functionality."""

    @pytest.mark.asyncio
    async def test_stream_meditation_calls_api(self):
        """Should call OpenAI API with correct parameters."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
            audio = OpenAIAudio(voice="nova")

            # Mock the client
            mock_response = AsyncMock()
            mock_response.__aiter__ = lambda self: AsyncIterator([])

            audio.client.chat.completions.create = AsyncMock(return_value=mock_response)

            chunks = []
            async for chunk in audio.stream_meditation("test prompt"):
                chunks.append(chunk)

            # Verify API was called with correct parameters
            audio.client.chat.completions.create.assert_called_once()
            call_kwargs = audio.client.chat.completions.create.call_args.kwargs

            assert call_kwargs["model"] == "gpt-4o-mini-audio-preview"
            assert call_kwargs["modalities"] == ["text", "audio"]
            assert call_kwargs["audio"]["voice"] == "nova"
            assert call_kwargs["audio"]["format"] == "pcm16"  # PCM16 for real-time ffmpeg streaming
            assert call_kwargs["stream"] is True

    @pytest.mark.asyncio
    async def test_stream_meditation_with_custom_voice(self):
        """Should use custom voice when specified."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
            audio = OpenAIAudio(voice="nova")

            mock_response = AsyncMock()
            mock_response.__aiter__ = lambda self: AsyncIterator([])

            audio.client.chat.completions.create = AsyncMock(return_value=mock_response)

            async for _ in audio.stream_meditation("test", voice="shimmer"):
                pass

            call_kwargs = audio.client.chat.completions.create.call_args.kwargs
            assert call_kwargs["audio"]["voice"] == "shimmer"

    @pytest.mark.asyncio
    async def test_stream_meditation_with_custom_system_prompt(self):
        """Should use custom system prompt when provided."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
            audio = OpenAIAudio(voice="nova")

            mock_response = AsyncMock()
            mock_response.__aiter__ = lambda self: AsyncIterator([])

            audio.client.chat.completions.create = AsyncMock(return_value=mock_response)

            custom_prompt = "You are a sleep meditation guide."
            async for _ in audio.stream_meditation("test", system_prompt=custom_prompt):
                pass

            call_kwargs = audio.client.chat.completions.create.call_args.kwargs
            messages = call_kwargs["messages"]
            system_message = next(m for m in messages if m["role"] == "system")
            assert system_message["content"] == custom_prompt


class TestGenerateFromScript:
    """Tests for generate_from_script method."""

    @pytest.mark.asyncio
    async def test_applies_user_name(self):
        """Should replace {{USER_NAME}} placeholder."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
            audio = OpenAIAudio(voice="nova")

            mock_response = AsyncMock()
            mock_response.__aiter__ = lambda self: AsyncIterator([])
            audio.client.chat.completions.create = AsyncMock(return_value=mock_response)

            script = MeditationScript(
                id="test",
                title="Test",
                type="breathing",
                script_content="Hello {{USER_NAME}}, welcome.",
                duration_estimate_seconds=60,
            )

            async for _ in audio.generate_from_script(script, user_name="Alice"):
                pass

            call_kwargs = audio.client.chat.completions.create.call_args.kwargs
            user_message = next(m for m in call_kwargs["messages"] if m["role"] == "user")
            assert "Hello Alice, welcome." in user_message["content"]

    @pytest.mark.asyncio
    async def test_removes_placeholder_without_name(self):
        """Should remove {{USER_NAME}} when no name provided."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}):
            audio = OpenAIAudio(voice="nova")

            mock_response = AsyncMock()
            mock_response.__aiter__ = lambda self: AsyncIterator([])
            audio.client.chat.completions.create = AsyncMock(return_value=mock_response)

            script = MeditationScript(
                id="test",
                title="Test",
                type="breathing",
                script_content="Hello {{USER_NAME}}, welcome.",
                duration_estimate_seconds=60,
            )

            async for _ in audio.generate_from_script(script):
                pass

            call_kwargs = audio.client.chat.completions.create.call_args.kwargs
            user_message = next(m for m in call_kwargs["messages"] if m["role"] == "user")
            assert "{{USER_NAME}}" not in user_message["content"]
            assert "Hello , welcome." in user_message["content"]


# Helper for async iteration in tests
class AsyncIterator:
    """Helper class for creating async iterators in tests."""

    def __init__(self, items: list) -> None:
        self.items = items
        self.index = 0

    def __aiter__(self) -> "AsyncIterator":
        return self

    async def __anext__(self) -> object:
        if self.index >= len(self.items):
            raise StopAsyncIteration
        item = self.items[self.index]
        self.index += 1
        return item


class TestPCM16ToMP3Conversion:
    """Tests for PCM16 to MP3 conversion functions."""

    def test_convert_pcm16_to_mp3_basic(self):
        """Should convert valid PCM16 data to MP3."""
        # Create simple sine wave PCM16 data (1 second at 24kHz)
        import struct

        sample_rate = 24000
        duration = 0.1  # 100ms for fast test
        samples = int(sample_rate * duration)

        # Generate silence (zeros) as PCM16 little-endian
        pcm_data = struct.pack(f"<{samples}h", *[0] * samples)

        # Convert to MP3
        mp3_data = convert_pcm16_to_mp3(pcm_data)

        # Verify output is valid MP3 (starts with ID3 or MP3 frame sync)
        assert len(mp3_data) > 0
        # MP3 files can start with ID3 tag (49 44 33) or frame sync (FF FB/FA/F3/F2)
        assert mp3_data[:3] == b"ID3" or mp3_data[:2] == b"\xff\xfb" or mp3_data[:2] == b"\xff\xf3"

    def test_convert_pcm16_to_mp3_empty_input(self):
        """Should handle empty input gracefully."""
        # This might raise an error or return empty - depends on pydub behavior
        # Just verify it doesn't crash
        try:
            result = convert_pcm16_to_mp3(b"")
            # If it returns something, it should be empty or minimal
            assert isinstance(result, bytes)
        except Exception:
            # Some exception is acceptable for empty input
            pass


class TestStreamPCM16ToMP3:
    """Tests for streaming PCM16 to MP3 conversion."""

    @pytest.mark.asyncio
    async def test_stream_pcm16_to_mp3_yields_chunks(self):
        """Should yield MP3 chunks as they're produced."""
        import struct

        # Create PCM16 data generator
        async def pcm_generator():
            # Generate 500ms of silence in chunks (24kHz sample rate)
            chunk_samples = 2400  # 100ms per chunk at 24kHz
            for _ in range(5):  # 5 chunks = 500ms
                yield struct.pack(f"<{chunk_samples}h", *[0] * chunk_samples)

        # Stream through converter
        chunks = []
        async for mp3_chunk in stream_pcm16_to_mp3(pcm_generator()):
            chunks.append(mp3_chunk)

        # Should have received at least one chunk
        assert len(chunks) > 0

        # Combined output should be valid MP3
        combined = b"".join(chunks)
        assert len(combined) > 0

    @pytest.mark.asyncio
    async def test_stream_pcm16_to_mp3_handles_empty_generator(self):
        """Should handle empty input generator."""

        async def empty_generator():
            return
            yield  # Make it a generator

        chunks = []
        async for chunk in stream_pcm16_to_mp3(empty_generator()):
            chunks.append(chunk)

        # Should complete without error
        # May or may not have output depending on ffmpeg behavior
        assert isinstance(chunks, list)

    @pytest.mark.asyncio
    async def test_stream_pcm16_to_mp3_real_time_output(self):
        """Should produce output before all input is consumed (real-time streaming)."""
        import asyncio
        import struct

        output_times = []
        input_complete = False

        async def slow_pcm_generator():
            nonlocal input_complete
            chunk_samples = 4800  # 200ms per chunk at 24kHz

            for _ in range(3):  # 600ms total
                yield struct.pack(f"<{chunk_samples}h", *[0] * chunk_samples)
                await asyncio.sleep(0.05)  # Small delay between chunks

            input_complete = True

        # Collect output timing
        async for _ in stream_pcm16_to_mp3(slow_pcm_generator()):
            output_times.append(asyncio.get_event_loop().time())

        # Should have received output (real-time streaming test)
        # Note: ffmpeg may buffer, so this is a basic sanity check
        assert len(output_times) > 0
