"""TTS (Text-to-Speech) integration for meditation generation."""

from .openai_audio import (
    MeditationScript,
    OpenAIAudio,
    stream_meditation_audio,
    stream_meditation_with_caching,
)
from .voices import (
    MEDITATION_VOICES,
    VALID_VOICE_IDS,
    get_all_voices,
    get_default_voice,
    get_voice,
    get_voice_by_id,
    recommend_voice_for_type,
    validate_voice_id,
)

__all__ = [
    "MEDITATION_VOICES",
    "VALID_VOICE_IDS",
    "MeditationScript",
    "OpenAIAudio",
    "get_all_voices",
    "get_default_voice",
    "get_voice",
    "get_voice_by_id",
    "recommend_voice_for_type",
    "stream_meditation_audio",
    "stream_meditation_with_caching",
    "validate_voice_id",
]
