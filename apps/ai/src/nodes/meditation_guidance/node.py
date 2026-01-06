"""
============================================================================
Meditation Guidance Node
============================================================================
Guides users through guided meditation sessions with HITL confirmation.

This node implements the human-in-the-loop pattern:
1. Analyzes conversation context to select appropriate meditation track
2. Uses interrupt() to pause and present track to user
3. User confirms, modifies, or declines the meditation
4. Returns structured activity data for frontend rendering

Supported meditation types:
- Body Scan: Progressive relaxation, tension release
- Breathing Focus: Mindfulness on breath (different from breathing exercises)
- Loving Kindness: Compassion cultivation
- Anxiety Relief: Working with difficult emotions
- Daily Mindfulness: Quick check-ins
- Sleep: Relaxation for bedtime

Audio Source: UCLA Mindful Awareness Research Center (MARC)
License: CC BY-NC-ND 4.0
============================================================================
"""

import json
import os
from typing import Literal, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langgraph.types import interrupt

from src.graph.state import WellnessState
from src.llm.providers import ModelTier, create_resilient_llm
from src.logging_config import NodeLogger

# Set up logging for this node
logger = NodeLogger("meditation_guidance")


# -----------------------------------------------------------------------------
# Type Definitions
# -----------------------------------------------------------------------------


class MeditationTrack(TypedDict):
    """Configuration for a guided meditation track."""

    id: str
    name: str
    type: Literal[
        "body_scan",
        "loving_kindness",
        "breathing_focus",
        "sleep",
        "anxiety_relief",
        "daily_mindfulness",
    ]
    durationSeconds: int
    durationPreset: Literal["short", "medium", "long"]
    description: str
    audioUrl: str
    narrator: str
    language: str
    bestFor: list[str]
    attribution: str


class ActivityData(TypedDict):
    """Activity data structure for frontend parsing."""

    type: Literal["activity"]
    activity: Literal["meditation"]
    status: Literal["ready"]
    track: MeditationTrack
    introduction: str


class MeditationConfirmation(TypedDict):
    """HITL interrupt data for meditation confirmation."""

    type: Literal["meditation_confirmation"]
    proposed_track: MeditationTrack
    message: str
    available_tracks: list[MeditationTrack]
    options: list[Literal["start", "change_track", "not_now"]]


class UserResponse(TypedDict, total=False):
    """User's response to meditation confirmation."""

    decision: Literal["start", "change_track", "not_now"]
    track_id: str


# -----------------------------------------------------------------------------
# Meditation Track Configurations
# -----------------------------------------------------------------------------
# Audio files are hosted on Supabase Storage.
# All tracks are from UCLA MARC under CC BY-NC-ND 4.0 license.

# Get Supabase URL from environment for audio file URLs
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
AUDIO_BASE_URL = f"{SUPABASE_URL}/storage/v1/object/public/meditation-audio"

UCLA_ATTRIBUTION = (
    "Meditation by Diana Winston, UCLA Mindful Awareness Research Center (MARC). "
    "Licensed under CC BY-NC-ND 4.0."
)

MEDITATION_TRACKS: dict[str, MeditationTrack] = {
    # -------------------------------------------------------------------------
    # Body Scan Meditations
    # -------------------------------------------------------------------------
    "body_scan_short": {
        "id": "body_scan_short",
        "name": "Body Scan (Short)",
        "type": "body_scan",
        "durationSeconds": 180,  # 3 minutes
        "durationPreset": "short",
        "description": (
            "A quick body scan to release tension and reconnect with "
            "physical sensations. Perfect for a brief mindfulness break."
        ),
        "audioUrl": f"{AUDIO_BASE_URL}/body-scan-3min-en.mp3",
        "narrator": "Diana Winston",
        "language": "en",
        "bestFor": ["tension release", "quick break", "body awareness"],
        "attribution": UCLA_ATTRIBUTION,
    },
    "body_scan_medium": {
        "id": "body_scan_medium",
        "name": "Body Scan",
        "type": "body_scan",
        "durationSeconds": 540,  # 9 minutes
        "durationPreset": "medium",
        "description": (
            "A thorough body scan meditation moving from head to toe, "
            "releasing tension and cultivating awareness of physical sensations."
        ),
        "audioUrl": f"{AUDIO_BASE_URL}/body-scan-9min-en.mp3",
        "narrator": "Diana Winston",
        "language": "en",
        "bestFor": ["deep relaxation", "stress relief", "sleep preparation"],
        "attribution": UCLA_ATTRIBUTION,
    },
    # -------------------------------------------------------------------------
    # Breathing Focus Meditations
    # -------------------------------------------------------------------------
    "breathing_focus": {
        "id": "breathing_focus",
        "name": "Breathing Meditation",
        "type": "breathing_focus",
        "durationSeconds": 300,  # 5 minutes
        "durationPreset": "short",
        "description": (
            "A gentle meditation focusing on the breath as an anchor for attention. "
            "Ideal for beginners and daily practice."
        ),
        "audioUrl": f"{AUDIO_BASE_URL}/breathing-5min-en.mp3",
        "narrator": "Diana Winston",
        "language": "en",
        "bestFor": ["focus", "calm", "beginners", "daily practice"],
        "attribution": UCLA_ATTRIBUTION,
    },
    # -------------------------------------------------------------------------
    # Loving Kindness (Metta) Meditations
    # -------------------------------------------------------------------------
    "loving_kindness": {
        "id": "loving_kindness",
        "name": "Loving Kindness",
        "type": "loving_kindness",
        "durationSeconds": 540,  # 9 minutes
        "durationPreset": "medium",
        "description": (
            "Cultivate compassion for yourself and others through this "
            "loving kindness (metta) meditation. Opens the heart and reduces negative emotions."
        ),
        "audioUrl": f"{AUDIO_BASE_URL}/loving-kindness-9min-en.mp3",
        "narrator": "Diana Winston",
        "language": "en",
        "bestFor": ["self-compassion", "emotional healing", "relationship issues"],
        "attribution": UCLA_ATTRIBUTION,
    },
    "loving_kindness_extended": {
        "id": "loving_kindness_extended",
        "name": "Loving Kindness (Extended)",
        "type": "loving_kindness",
        "durationSeconds": 780,  # 13 minutes
        "durationPreset": "long",
        "description": (
            "An extended loving kindness meditation that deepens compassion practice. "
            "Includes visualizations for self, loved ones, neutral people, and all beings."
        ),
        "audioUrl": f"{AUDIO_BASE_URL}/loving-kindness-13min-en.mp3",
        "narrator": "Diana Winston",
        "language": "en",
        "bestFor": ["self-compassion", "emotional healing", "deep practice", "relationships"],
        "attribution": UCLA_ATTRIBUTION,
    },
    # -------------------------------------------------------------------------
    # Anxiety Relief / Working with Difficulties
    # -------------------------------------------------------------------------
    "anxiety_relief": {
        "id": "anxiety_relief",
        "name": "Working with Difficulties",
        "type": "anxiety_relief",
        "durationSeconds": 420,  # 7 minutes
        "durationPreset": "medium",
        "description": (
            "A meditation for working with difficult emotions and anxiety. "
            "Learn to meet challenges with mindfulness and self-compassion."
        ),
        "audioUrl": f"{AUDIO_BASE_URL}/working-with-difficulties-7min-en.mp3",
        "narrator": "Diana Winston",
        "language": "en",
        "bestFor": ["anxiety", "difficult emotions", "stress", "overwhelm"],
        "attribution": UCLA_ATTRIBUTION,
    },
    # -------------------------------------------------------------------------
    # Sleep Meditations
    # -------------------------------------------------------------------------
    "sleep_meditation": {
        "id": "sleep_meditation",
        "name": "Sleep Meditation",
        "type": "sleep",
        "durationSeconds": 780,  # 13 minutes
        "durationPreset": "long",
        "description": (
            "A soothing meditation designed to help you relax and prepare for restful sleep. "
            "Guides you through progressive relaxation and peaceful imagery."
        ),
        "audioUrl": f"{AUDIO_BASE_URL}/sleep-meditation-13min-en.mp3",
        "narrator": "Diana Winston",
        "language": "en",
        "bestFor": ["sleep", "insomnia", "bedtime", "relaxation"],
        "attribution": UCLA_ATTRIBUTION,
    },
    # -------------------------------------------------------------------------
    # Daily Mindfulness (Short)
    # -------------------------------------------------------------------------
    "daily_mindfulness": {
        "id": "daily_mindfulness",
        "name": "Daily Mindfulness",
        "type": "daily_mindfulness",
        "durationSeconds": 180,  # 3 minutes
        "durationPreset": "short",
        "description": (
            "A quick daily mindfulness practice to center yourself. "
            "Perfect for starting your day or taking a mindful pause."
        ),
        "audioUrl": f"{AUDIO_BASE_URL}/daily-mindfulness-3min-en.mp3",
        "narrator": "Diana Winston",
        "language": "en",
        "bestFor": ["daily practice", "morning routine", "quick break", "focus"],
        "attribution": UCLA_ATTRIBUTION,
    },
    # -------------------------------------------------------------------------
    # Complete Relaxation
    # -------------------------------------------------------------------------
    "complete_relaxation": {
        "id": "complete_relaxation",
        "name": "Complete Relaxation",
        "type": "body_scan",
        "durationSeconds": 900,  # 15 minutes
        "durationPreset": "long",
        "description": (
            "A comprehensive relaxation meditation that guides you through deep muscle "
            "relaxation and calming breath work. Ideal for unwinding after a long day."
        ),
        "audioUrl": f"{AUDIO_BASE_URL}/complete-relaxation-15min-en.mp3",
        "narrator": "Diana Winston",
        "language": "en",
        "bestFor": ["deep relaxation", "stress relief", "tension release", "evening"],
        "attribution": UCLA_ATTRIBUTION,
    },
    # -------------------------------------------------------------------------
    # Spanish Language Tracks
    # -------------------------------------------------------------------------
    "breathing_focus_es": {
        "id": "breathing_focus_es",
        "name": "Meditación de Respiración",
        "type": "breathing_focus",
        "durationSeconds": 300,  # 5 minutes
        "durationPreset": "short",
        "description": (
            "Una meditación suave enfocada en la respiración como ancla para la atención. "
            "Ideal para principiantes y práctica diaria."
        ),
        "audioUrl": f"{AUDIO_BASE_URL}/breathing-5min-es.mp3",
        "narrator": "Diana Winston",
        "language": "es",
        "bestFor": ["focus", "calm", "beginners", "spanish"],
        "attribution": UCLA_ATTRIBUTION,
    },
    "body_scan_short_es": {
        "id": "body_scan_short_es",
        "name": "Exploración Corporal",
        "type": "body_scan",
        "durationSeconds": 180,  # 3 minutes
        "durationPreset": "short",
        "description": (
            "Un breve escaneo corporal para liberar tensión y reconectar con las "
            "sensaciones físicas. Perfecto para una pausa consciente."
        ),
        "audioUrl": f"{AUDIO_BASE_URL}/body-scan-3min-es.mp3",
        "narrator": "Diana Winston",
        "language": "es",
        "bestFor": ["tension release", "quick break", "spanish"],
        "attribution": UCLA_ATTRIBUTION,
    },
}


# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------


def get_last_user_message(messages: list[BaseMessage]) -> str:
    """Extract the content of the last human message."""
    for message in reversed(messages):
        if isinstance(message, HumanMessage):
            return str(message.content)
    return ""


def get_user_duration_preference(user_context: dict) -> str:
    """Get user's preferred meditation duration from preferences."""
    preferences = user_context.get("preferences", {})
    session_length = preferences.get("session_length", "medium")
    return session_length  # Returns "short", "medium", or "long"


async def select_track_with_llm(state: WellnessState) -> MeditationTrack:
    """
    Uses the LLM to analyze conversation context and select the most
    appropriate meditation track.

    The LLM considers:
    - User's recent messages and emotional state
    - User preferences (duration preference)
    - The benefits of each track
    """
    messages = state.get("messages", [])
    user_context = state.get("user_context", {})
    last_message = get_last_user_message(messages)
    duration_pref = get_user_duration_preference(user_context)

    # Build context for track selection
    tracks_info = "\n".join(
        [
            f"- {t['id']}: {t['name']} ({t['durationSeconds'] // 60} min, {t['durationPreset']}) "
            f"- {t['description'][:100]}... Best for: {', '.join(t['bestFor'])}"
            for t in MEDITATION_TRACKS.values()
        ]
    )

    # Get list of valid IDs for validation
    valid_ids = set(MEDITATION_TRACKS.keys())

    selection_prompt = f"""You are helping select a guided meditation track for a user.

Available tracks:
{tracks_info}

User's recent message: "{last_message}"
User's duration preference: {duration_pref}
User preferences: {user_context.get("preferences", {})}

Selection guidelines:
- For anxiety/stress/overwhelm: prefer anxiety_relief
- For physical tension: prefer body_scan_short, body_scan_medium, or complete_relaxation
- For self-criticism/loneliness: prefer loving_kindness or loving_kindness_extended
- For general mindfulness/focus: prefer breathing_focus or daily_mindfulness
- For sleep/bedtime: prefer sleep_meditation
- For quick breaks: prefer daily_mindfulness or body_scan_short
- For deep relaxation: prefer complete_relaxation or loving_kindness_extended
- If user speaks Spanish: consider breathing_focus_es or body_scan_short_es
- Match duration preference when possible ({duration_pref})
- When uncertain: default to breathing_focus (good for everyone)

Respond with ONLY the track ID (one of: {", ".join(valid_ids)}).
"""

    try:
        # Use resilient LLM with automatic fallback on rate limits
        llm = create_resilient_llm(tier=ModelTier.FAST, temperature=0.3, max_tokens=20)
        response = await llm.ainvoke([HumanMessage(content=selection_prompt)])
        track_id = str(response.content).strip().lower()

        # Validate and return if found
        if track_id in valid_ids:
            return MEDITATION_TRACKS[track_id]
    except Exception as e:
        logger.warning("LLM track selection failed", error=str(e))

    # Default to breathing_focus if selection fails
    return MEDITATION_TRACKS["breathing_focus"]


def format_meditation_message(track: MeditationTrack, introduction: str) -> str:
    """
    Formats the meditation configuration as a message with activity markers.

    The frontend parses content between [ACTIVITY_START] and [ACTIVITY_END]
    markers to render the GuidedMeditation component.
    """
    activity_data: ActivityData = {
        "type": "activity",
        "activity": "meditation",
        "status": "ready",
        "track": track,
        "introduction": introduction,
    }

    # Format with markers for frontend parsing
    return f"[ACTIVITY_START]{json.dumps(activity_data)}[ACTIVITY_END]"


def generate_introduction(track: MeditationTrack, user_name: str) -> str:
    """
    Generate personalized introduction based on track type and user name.
    """
    duration_minutes = track["durationSeconds"] // 60

    base_intros = {
        "body_scan": (
            f"Let's take {duration_minutes} minutes to scan through your body, {user_name}. "
            "Find a comfortable position, either sitting or lying down. "
            "This meditation will help you release any tension you're holding."
        ),
        "breathing_focus": (
            f"Time for a {duration_minutes}-minute breathing meditation, {user_name}. "
            "Settle into a comfortable position and let's use the breath as an anchor "
            "to bring you into the present moment."
        ),
        "loving_kindness": (
            f"Let's practice loving kindness together, {user_name}. "
            f"This {duration_minutes}-minute meditation will help you cultivate compassion "
            "for yourself and others."
        ),
        "anxiety_relief": (
            f"I've chosen a {duration_minutes}-minute meditation for working with "
            f"difficult emotions, {user_name}. This practice will help you meet whatever "
            "you're experiencing with mindfulness and self-compassion."
        ),
        "sleep": (
            f"Time to wind down, {user_name}. "
            f"This {duration_minutes}-minute meditation will help prepare your mind "
            "and body for restful sleep."
        ),
        "daily_mindfulness": (
            f"Let's take a mindful pause, {user_name}. "
            f"This quick {duration_minutes}-minute meditation is perfect for checking in "
            "with yourself during a busy day."
        ),
    }

    return base_intros.get(
        track["type"],
        f"Ready for a {duration_minutes}-minute {track['name']} meditation, {user_name}? "
        "Find a comfortable position and let's begin.",
    )


# -----------------------------------------------------------------------------
# Main Node Function
# -----------------------------------------------------------------------------


async def run_meditation_guidance(state: WellnessState) -> dict[str, list[AIMessage]]:
    """
    Guides the user through a meditation with HITL confirmation.

    Flow:
    1. Analyze conversation context to select appropriate track
    2. Use interrupt() to present track and get user confirmation
    3. Handle user's decision (start, change track, or decline)
    4. Return activity configuration for frontend rendering

    Args:
        state: Current conversation state including messages and user context

    Returns:
        Dict with messages containing meditation activity data
    """
    logger.node_start()

    # Get user context for personalization
    user_context = state.get("user_context", {})
    user_name = user_context.get("display_name", "there")

    # Step 1: Select the most appropriate track
    selected_track = await select_track_with_llm(state)
    logger.info("Selected track", track=selected_track["name"])

    # Step 2: Use HITL interrupt to get user confirmation
    available_tracks = list(MEDITATION_TRACKS.values())

    confirmation_data: MeditationConfirmation = {
        "type": "meditation_confirmation",
        "proposed_track": selected_track,
        "message": f"I'd suggest a {selected_track['name']} meditation for you.",
        "available_tracks": available_tracks,
        "options": ["start", "change_track", "not_now"],
    }
    user_response: UserResponse = interrupt(confirmation_data)

    # Step 3: Handle user's decision
    decision = user_response.get("decision", "start")

    if decision == "not_now":
        logger.info("User declined meditation")
        logger.node_end()
        return {
            "messages": [
                AIMessage(
                    content=(
                        f"No problem, {user_name}! Whenever you feel ready for a "
                        "guided meditation, just let me know. I'm here to support you."
                    )
                )
            ]
        }

    if decision == "change_track":
        # User selected a different track
        new_track_id = user_response.get("track_id", "breathing_focus")

        if new_track_id in MEDITATION_TRACKS:
            selected_track = MEDITATION_TRACKS[new_track_id]
            logger.info("User changed track", new_track=selected_track["name"])

    # Step 4: Generate personalized introduction
    introduction = generate_introduction(selected_track, user_name)

    # Step 5: Format activity message for frontend
    meditation_message = format_meditation_message(selected_track, introduction)

    logger.node_end()

    return {
        "messages": [AIMessage(content=meditation_message)],
    }
