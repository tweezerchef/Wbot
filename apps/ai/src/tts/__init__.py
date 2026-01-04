"""TTS (Text-to-Speech) integration for custom meditation generation."""

from .elevenlabs import ElevenLabsTTS, generate_custom_meditation
from .parallel_streaming import parallel_stream_meditation, parallel_stream_with_caching
from .voices import (
    MEDITATION_VOICES,
    get_all_voices,
    get_default_voice,
    get_voice,
    recommend_voice_for_type,
    validate_voice_id,
)

__all__ = [
    "MEDITATION_VOICES",
    "ElevenLabsTTS",
    "generate_custom_meditation",
    "get_all_voices",
    "get_default_voice",
    "get_voice",
    "parallel_stream_meditation",
    "parallel_stream_with_caching",
    "recommend_voice_for_type",
    "validate_voice_id",
]
