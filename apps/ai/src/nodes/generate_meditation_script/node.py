"""
============================================================================
Generate Meditation Script Node
============================================================================
Generates personalized meditation scripts using OpenAI's Chat Completions
with audio output (gpt-4o-mini-audio-preview).

This node creates fully customized meditation scripts based on:
- User's memories and past conversations
- User profile and preferences
- Current conversation context
- Time of day and mood signals

Flow:
1. Extract context from state (memories, user_context, messages)
2. Detect meditation type and emotional signals
3. Use interrupt() for voice selection (HITL)
4. Generate meditation text + audio with OpenAI (single API call)
5. Cache audio to Supabase Storage
6. Save to user_generated_meditations table
7. Return activity data with audio_url for frontend playback

Activity Type: meditation_ai_generated
============================================================================
"""

import json
import uuid
from datetime import datetime
from typing import Literal, NotRequired, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langgraph.types import interrupt

from src.auth import get_supabase_client
from src.graph.state import WellnessState
from src.logging_config import NodeLogger
from src.nodes.generate_meditation_script.prompts import (
    OPENAI_MEDITATION_SYSTEM_PROMPT,
    build_spoken_meditation_prompt,
)
from src.tts.openai_audio import generate_meditation_with_caching
from src.tts.voices import (
    DEFAULT_VOICE_KEY,
    MEDITATION_VOICES,
    get_all_voices,
    get_voice,
)

# Set up logging
logger = NodeLogger("generate_meditation_script")


# -----------------------------------------------------------------------------
# Type Definitions
# -----------------------------------------------------------------------------


class Voice(TypedDict):
    """A meditation voice option."""

    id: str
    name: str
    description: str
    best_for: list[str]


class GeneratedScript(TypedDict):
    """The generated meditation script."""

    content: str
    word_count: int
    estimated_duration_seconds: int


class GenerationContext(TypedDict):
    """Context used for script generation (stored for debugging/replay)."""

    time_of_day: Literal["morning", "afternoon", "evening", "night"]
    primary_intent: str
    memories_used: int
    emotional_signals: list[str]


class AIGeneratedMeditationActivity(TypedDict):
    """Activity data for AI-generated meditation."""

    type: Literal["activity"]
    activity: Literal["meditation_ai_generated"]
    status: Literal["ready"]
    meditation_id: str
    title: str
    meditation_type: str
    duration_minutes: int
    script: GeneratedScript
    voice: Voice
    generation_context: GenerationContext
    introduction: str
    audio_url: NotRequired[str]  # Pre-generated audio URL (skips frontend streaming)


class VoiceSelectionConfirmation(TypedDict):
    """HITL interrupt data for voice selection."""

    type: Literal["voice_selection"]
    message: str
    available_voices: list[Voice]
    recommended_voice: str
    meditation_preview: str
    duration_minutes: int


class UserVoiceResponse(TypedDict, total=False):
    """User's response to voice selection."""

    voice_id: str
    decision: Literal["confirm", "cancel"]


# Voice configuration is imported from src.tts.voices


# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------


def get_time_of_day() -> Literal["morning", "afternoon", "evening", "night"]:
    """Determine the time of day for appropriate meditation style."""
    hour = datetime.now().hour
    if 5 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"


def get_last_user_message(messages: list[BaseMessage]) -> str:
    """Extract the content of the last human message."""
    for message in reversed(messages):
        if isinstance(message, HumanMessage):
            return str(message.content)
    return ""


def detect_emotional_signals(message: str) -> list[str]:
    """
    Detect emotional signals from the user's message.

    Returns list of detected emotions/states.
    """
    signals = []

    # Anxiety/stress signals
    anxiety_words = ["anxious", "worried", "stressed", "overwhelmed", "panic", "nervous"]
    if any(word in message.lower() for word in anxiety_words):
        signals.append("anxiety")

    # Sadness signals
    sad_words = ["sad", "down", "depressed", "unhappy", "lonely", "lost"]
    if any(word in message.lower() for word in sad_words):
        signals.append("sadness")

    # Sleep signals
    sleep_words = ["sleep", "insomnia", "tired", "exhausted", "can't sleep", "bedtime"]
    if any(word in message.lower() for word in sleep_words):
        signals.append("sleep_issues")

    # Tension signals
    tension_words = ["tense", "tight", "pain", "headache", "stiff", "body aches"]
    if any(word in message.lower() for word in tension_words):
        signals.append("physical_tension")

    # Overwhelm signals
    overwhelm_words = ["too much", "overwhelming", "can't cope", "falling apart"]
    if any(word in message.lower() for word in overwhelm_words):
        signals.append("overwhelm")

    return signals


def select_meditation_type(
    emotional_signals: list[str],
    time_of_day: str,
    user_preferences: dict,
) -> str:
    """
    Select the most appropriate meditation type based on context.

    Args:
        emotional_signals: Detected emotional states
        time_of_day: morning, afternoon, evening, or night
        user_preferences: User's preference dict from profile

    Returns:
        Meditation type string
    """
    # Priority 1: Address emotional needs
    if "anxiety" in emotional_signals or "overwhelm" in emotional_signals:
        return "anxiety_relief"
    if "physical_tension" in emotional_signals:
        return "body_scan"
    if "sadness" in emotional_signals:
        return "loving_kindness"
    if "sleep_issues" in emotional_signals or time_of_day == "night":
        return "sleep"

    # Priority 2: Time of day defaults
    if time_of_day == "morning":
        return "breathing_focus"
    if time_of_day == "evening":
        return "body_scan"

    # Default
    return "breathing_focus"


def select_duration(user_preferences: dict, time_of_day: str) -> int:
    """
    Select meditation duration based on preferences and context.

    Args:
        user_preferences: User's preference dict
        time_of_day: Time of day

    Returns:
        Duration in minutes (5, 7, 10, or 15)
    """
    session_length = user_preferences.get("session_length", "medium")

    duration_map = {
        "few_minutes": 5,
        "short": 5,
        "medium": 7,
        "long": 10,
        "flexible": 10,
    }

    base_duration = duration_map.get(session_length, 7)

    # Night meditations tend to be longer
    if time_of_day == "night":
        return min(base_duration + 5, 15)

    return base_duration


def recommend_voice(meditation_type: str) -> str:
    """Recommend a voice based on meditation type."""
    for voice_key, voice in MEDITATION_VOICES.items():
        if meditation_type in voice["best_for"]:
            return voice_key
    return DEFAULT_VOICE_KEY


def format_activity_message(activity_data: AIGeneratedMeditationActivity) -> str:
    """
    Format the activity data as a message with markers for frontend parsing.
    """
    return f"[ACTIVITY_START]{json.dumps(activity_data)}[ACTIVITY_END]"


# -----------------------------------------------------------------------------
# Main Node Function
# -----------------------------------------------------------------------------


async def run_generate_meditation_script(
    state: WellnessState,
) -> dict[str, list[AIMessage]]:
    """
    Generates a personalized meditation using OpenAI Chat Completions with audio.

    Flow:
    1. Extract context (memories, user profile, messages)
    2. Detect emotional signals and select meditation type
    3. Use interrupt() for HITL voice selection
    4. Generate meditation text + audio with OpenAI (single API call)
    5. Cache audio to Supabase Storage
    6. Save to user_generated_meditations table
    7. Return activity data with audio_url for frontend playback

    Args:
        state: Current conversation state

    Returns:
        Dict with messages containing meditation activity data
    """
    logger.node_start()

    # Extract context from state
    user_context = state.get("user_context", {})
    messages = state.get("messages", [])
    memories = state.get("retrieved_memories", [])
    user_preferences = user_context.get("preferences", {})

    # User info
    user_name = user_context.get("display_name")
    primary_goal = user_preferences.get("primary_goal")
    user_message = get_last_user_message(messages)

    # Determine context
    time_of_day = get_time_of_day()
    emotional_signals = detect_emotional_signals(user_message)
    meditation_type = select_meditation_type(emotional_signals, time_of_day, user_preferences)
    duration_minutes = select_duration(user_preferences, time_of_day)

    logger.info(
        "Context analyzed",
        meditation_type=meditation_type,
        duration=duration_minutes,
        time_of_day=time_of_day,
        emotional_signals=emotional_signals,
    )

    # Step 1: HITL - Voice Selection
    recommended_voice_key = recommend_voice(meditation_type)
    available_voices = get_all_voices()

    voice_confirmation: VoiceSelectionConfirmation = {
        "type": "voice_selection",
        "message": (
            f"I'll create a personalized {duration_minutes}-minute "
            f"{meditation_type.replace('_', ' ')} meditation for you. "
            f"Which voice would you like?"
        ),
        "available_voices": available_voices,
        "recommended_voice": recommended_voice_key,
        "meditation_preview": (
            f"This meditation will be tailored to help you with "
            f"{', '.join(emotional_signals) if emotional_signals else 'finding calm'}."
        ),
        "duration_minutes": duration_minutes,
    }

    # Pause for user voice selection
    user_response: UserVoiceResponse = interrupt(voice_confirmation)

    # Handle user cancellation
    if user_response.get("decision") == "cancel":
        logger.info("User cancelled meditation")
        logger.node_end()
        return {
            "messages": [
                AIMessage(
                    content=(
                        f"No problem{', ' + user_name if user_name else ''}! "
                        "Whenever you're ready for a personalized meditation, just let me know."
                    )
                )
            ]
        }

    # Get selected voice
    selected_voice_key = user_response.get("voice_id", recommended_voice_key)
    selected_voice = get_voice(selected_voice_key)
    if not selected_voice:
        selected_voice = get_voice(DEFAULT_VOICE_KEY)

    logger.info("Voice selected", voice=selected_voice["name"])

    # Generate meditation ID for this session
    meditation_id = str(uuid.uuid4())
    user_id = user_context.get("user_id", "anonymous")

    # Step 2: Generate meditation text + audio with OpenAI (single API call)
    meditation_prompt = build_spoken_meditation_prompt(
        meditation_type=meditation_type,
        duration_minutes=duration_minutes,
        user_name=user_name,
        primary_goal=primary_goal,
        time_of_day=time_of_day,
        user_request=user_message,
        memories=memories,
        emotional_signals=emotional_signals if emotional_signals else None,
    )

    try:
        # Generate both text and audio in one call, cache audio to storage
        audio_result = await generate_meditation_with_caching(
            prompt=meditation_prompt,
            meditation_id=meditation_id,
            user_id=user_id,
            voice=selected_voice_key,
            system_prompt=OPENAI_MEDITATION_SYSTEM_PROMPT,
        )
        script_content = audio_result.text_content
        audio_url = audio_result.audio_url

        logger.info(
            "Meditation generated with audio",
            meditation_id=meditation_id,
            audio_url=audio_url,
            text_length=len(script_content),
        )
    except Exception as e:
        logger.error("Meditation generation failed", error=str(e))
        logger.node_end()
        return {
            "messages": [
                AIMessage(
                    content=(
                        "I'm sorry, I had trouble creating your meditation right now. "
                        "Would you like to try a pre-recorded meditation instead?"
                    )
                )
            ]
        }

    # Step 3: Generate Title (simple format, no separate LLM call)
    type_name = meditation_type.replace("_", " ").title()
    title = f"{user_name}'s {type_name}" if user_name else f"Your {type_name}"

    # Step 4: Build Activity Data
    word_count = len(script_content.split())
    # Estimate ~120 words per minute for meditation pace
    estimated_duration = audio_result.duration_estimate_seconds

    generation_context: GenerationContext = {
        "time_of_day": time_of_day,
        "primary_intent": user_message[:100] if user_message else "general relaxation",
        "memories_used": len(memories),
        "emotional_signals": emotional_signals,
    }

    script_data: GeneratedScript = {
        "content": script_content,
        "word_count": word_count,
        "estimated_duration_seconds": estimated_duration,
    }

    # Generate personalized introduction
    intro_parts = []
    if user_name:
        intro_parts.append(f"I've created this meditation just for you, {user_name}.")
    else:
        intro_parts.append("I've created a personalized meditation for you.")

    if emotional_signals:
        signal_text = ", ".join(emotional_signals).replace("_", " ")
        intro_parts.append(f"It's designed to help with {signal_text}.")

    intro_parts.append(
        f"{selected_voice['name']} will guide you through this {duration_minutes}-minute practice."
    )

    introduction = " ".join(intro_parts)

    activity_data: AIGeneratedMeditationActivity = {
        "type": "activity",
        "activity": "meditation_ai_generated",
        "status": "ready",
        "meditation_id": meditation_id,
        "title": title,
        "meditation_type": meditation_type,
        "duration_minutes": duration_minutes,
        "script": script_data,
        "voice": selected_voice,
        "generation_context": generation_context,
        "introduction": introduction,
    }

    # Add audio_url if available (allows frontend to skip streaming endpoint)
    if audio_url:
        activity_data["audio_url"] = audio_url

    # Step 5: Save to user_generated_meditations table for replay
    try:
        supabase = await get_supabase_client()
        await (
            supabase.table("user_generated_meditations")
            .insert(
                {
                    "id": meditation_id,
                    "user_id": user_id,
                    "title": title,
                    "meditation_type": meditation_type,
                    "script_content": script_content,
                    "duration_seconds": estimated_duration,
                    "generation_context": generation_context,
                    "voice_id": selected_voice_key,
                    "voice_name": selected_voice["name"],
                    "audio_url": audio_url,
                    "status": "ready",
                }
            )
            .execute()
        )

        logger.info(
            "Meditation saved to database",
            meditation_id=meditation_id,
        )
    except Exception as e:
        # Don't fail the whole flow if DB save fails
        logger.warning("Failed to save meditation to database", error=str(e))

    # Format message with activity markers
    activity_message = format_activity_message(activity_data)

    logger.info(
        "Meditation generated",
        meditation_id=meditation_id,
        title=title,
        word_count=word_count,
        audio_url=audio_url,
    )
    logger.node_end()

    return {
        "messages": [AIMessage(content=activity_message)],
    }
