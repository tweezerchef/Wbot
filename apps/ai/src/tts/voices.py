"""
============================================================================
Meditation Voice Configuration
============================================================================
Curated list of ElevenLabs voices for meditation TTS generation.

These voices have been selected for:
- Calming, soothing qualities
- Clear pronunciation
- Appropriate pacing for meditation
============================================================================
"""

from typing import TypedDict


class MeditationVoice(TypedDict):
    """Configuration for a meditation voice."""

    id: str  # ElevenLabs voice ID
    name: str  # Display name
    description: str  # User-facing description
    best_for: list[str]  # Meditation types this voice suits
    preview_url: str | None  # URL to preview audio (optional)


# Curated voices for meditation
# These are production ElevenLabs voice IDs
MEDITATION_VOICES: dict[str, MeditationVoice] = {
    "sarah_calm": {
        "id": "EXAVITQu4vr4xnSDxMaL",
        "name": "Sarah",
        "description": "Warm, gentle female voice with a soothing pace",
        "best_for": ["body_scan", "loving_kindness", "sleep"],
        "preview_url": None,  # Will be populated with Supabase URL
    },
    "adam_deep": {
        "id": "pNInz6obpgDQGcFmaJgB",
        "name": "Adam",
        "description": "Deep, grounding male voice for focus and clarity",
        "best_for": ["breathing_focus", "anxiety_relief", "daily_mindfulness"],
        "preview_url": None,
    },
    "rachel_soft": {
        "id": "21m00Tcm4TlvDq8ikWAM",
        "name": "Rachel",
        "description": "Soft, calming female voice perfect for relaxation",
        "best_for": ["sleep", "body_scan", "anxiety_relief"],
        "preview_url": None,
    },
    "josh_warm": {
        "id": "TxGEqnHWrfWFTfGW9XjX",
        "name": "Josh",
        "description": "Warm, reassuring male voice",
        "best_for": ["daily_mindfulness", "breathing_focus", "loving_kindness"],
        "preview_url": None,
    },
    "bella_peaceful": {
        "id": "EXAVITQu4vr4xnSDxMaL",  # Using Sarah's ID as placeholder
        "name": "Bella",
        "description": "Peaceful, nurturing female voice",
        "best_for": ["loving_kindness", "sleep", "body_scan"],
        "preview_url": None,
    },
}

# Default voice if none specified
DEFAULT_VOICE_KEY = "sarah_calm"


def get_voice(voice_key: str) -> MeditationVoice | None:
    """Get a voice by its key."""
    return MEDITATION_VOICES.get(voice_key)


def get_voice_by_id(voice_id: str) -> MeditationVoice | None:
    """Get a voice by its ElevenLabs ID."""
    for voice in MEDITATION_VOICES.values():
        if voice["id"] == voice_id:
            return voice
    return None


def get_all_voices() -> list[MeditationVoice]:
    """Get all available voices."""
    return list(MEDITATION_VOICES.values())


def get_default_voice() -> MeditationVoice:
    """Get the default voice."""
    return MEDITATION_VOICES[DEFAULT_VOICE_KEY]


def recommend_voice_for_type(meditation_type: str) -> MeditationVoice:
    """
    Recommend a voice based on meditation type.

    Args:
        meditation_type: The type of meditation

    Returns:
        The recommended voice for that meditation type
    """
    for voice in MEDITATION_VOICES.values():
        if meditation_type in voice["best_for"]:
            return voice
    return get_default_voice()


def validate_voice_id(voice_id: str) -> bool:
    """Check if a voice ID is valid."""
    return any(v["id"] == voice_id for v in MEDITATION_VOICES.values())
