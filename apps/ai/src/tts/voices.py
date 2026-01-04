"""
============================================================================
OpenAI Audio Voices for Meditation
============================================================================
Configuration for OpenAI TTS voices used in meditation generation.

OpenAI provides 13 voices for audio output:
- alloy: Neutral, balanced
- ash: Warm, conversational
- ballad: Melodic, soothing
- coral: Calm, professional
- echo: Clear, articulate male
- fable: Warm, expressive storytelling
- marin: Warm, calm (recommended for quality)
- nova: Warm, calm female
- onyx: Deep, grounding male
- sage: Gentle, wise
- shimmer: Soft, expressive female
- verse: Poetic, contemplative
- cedar: Deep, grounding (recommended for quality)
============================================================================
"""

from typing import TypedDict


class MeditationVoice(TypedDict):
    """Configuration for a meditation voice."""

    id: str  # OpenAI voice ID (same as key)
    name: str  # Display name
    description: str  # User-facing description
    best_for: list[str]  # Meditation types this voice suits
    preview_url: str | None  # URL to preview audio (optional)


# OpenAI TTS voices configured for meditation
MEDITATION_VOICES: dict[str, MeditationVoice] = {
    "nova": {
        "id": "nova",
        "name": "Nova",
        "description": "Warm, calm female voice ideal for meditation",
        "best_for": ["body_scan", "loving_kindness", "sleep", "anxiety_relief"],
        "preview_url": None,
    },
    "shimmer": {
        "id": "shimmer",
        "name": "Shimmer",
        "description": "Soft, expressive female voice for relaxation",
        "best_for": ["sleep", "anxiety_relief", "loving_kindness"],
        "preview_url": None,
    },
    "onyx": {
        "id": "onyx",
        "name": "Onyx",
        "description": "Deep, grounding male voice for focus",
        "best_for": ["breathing_focus", "daily_mindfulness", "body_scan"],
        "preview_url": None,
    },
    "alloy": {
        "id": "alloy",
        "name": "Alloy",
        "description": "Neutral, balanced voice for all meditation types",
        "best_for": ["daily_mindfulness", "breathing_focus"],
        "preview_url": None,
    },
    "echo": {
        "id": "echo",
        "name": "Echo",
        "description": "Clear, articulate male voice",
        "best_for": ["breathing_focus", "daily_mindfulness"],
        "preview_url": None,
    },
    "fable": {
        "id": "fable",
        "name": "Fable",
        "description": "Warm, expressive storytelling voice",
        "best_for": ["loving_kindness", "body_scan", "sleep"],
        "preview_url": None,
    },
    # New voices added for gpt-4o-mini-audio-preview
    "ash": {
        "id": "ash",
        "name": "Ash",
        "description": "Warm, conversational voice",
        "best_for": ["daily_mindfulness", "breathing_focus"],
        "preview_url": None,
    },
    "ballad": {
        "id": "ballad",
        "name": "Ballad",
        "description": "Melodic, soothing voice for deep relaxation",
        "best_for": ["sleep", "loving_kindness", "body_scan"],
        "preview_url": None,
    },
    "coral": {
        "id": "coral",
        "name": "Coral",
        "description": "Calm, professional voice",
        "best_for": ["daily_mindfulness", "breathing_focus"],
        "preview_url": None,
    },
    "sage": {
        "id": "sage",
        "name": "Sage",
        "description": "Gentle, wise voice for reflective practices",
        "best_for": ["loving_kindness", "body_scan", "anxiety_relief"],
        "preview_url": None,
    },
    "verse": {
        "id": "verse",
        "name": "Verse",
        "description": "Poetic, contemplative voice",
        "best_for": ["loving_kindness", "sleep"],
        "preview_url": None,
    },
    "marin": {
        "id": "marin",
        "name": "Marin",
        "description": "Warm, calm voice with excellent clarity (recommended)",
        "best_for": ["body_scan", "loving_kindness", "sleep", "anxiety_relief"],
        "preview_url": None,
    },
    "cedar": {
        "id": "cedar",
        "name": "Cedar",
        "description": "Deep, grounding voice with natural warmth (recommended)",
        "best_for": ["breathing_focus", "body_scan", "daily_mindfulness", "anxiety_relief"],
        "preview_url": None,
    },
}

# All valid OpenAI voice IDs
VALID_VOICE_IDS = list(MEDITATION_VOICES.keys())

# Default voice for meditation (marin recommended by OpenAI for quality)
DEFAULT_VOICE_KEY = "marin"


def get_voice(voice_key: str) -> MeditationVoice | None:
    """Get a voice by its key."""
    return MEDITATION_VOICES.get(voice_key)


def get_voice_by_id(voice_id: str) -> MeditationVoice | None:
    """
    Get a voice by its ID.

    For OpenAI, the voice ID is the same as the key.
    """
    return MEDITATION_VOICES.get(voice_id)


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
    return voice_id in VALID_VOICE_IDS
