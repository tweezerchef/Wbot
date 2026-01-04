"""
============================================================================
Breathing Exercise Node
============================================================================
Guides users through interactive breathing exercises with HITL confirmation.

This node implements the human-in-the-loop pattern:
1. Analyzes conversation context to select appropriate technique
2. Uses interrupt() to pause and present technique to user
3. User confirms, modifies, or declines the exercise
4. Returns structured exercise data for frontend rendering

Supported techniques:
- Box Breathing (4-4-4-4): Stress relief, focus
- 4-7-8 Relaxing Breath: Anxiety, sleep
- Coherent Breathing (6-0-6-0): Heart rate variability
- Deep Calm (5-2-7-2): Deep relaxation
============================================================================
"""

import json
from typing import Literal, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langgraph.types import interrupt

from src.graph.state import WellnessState
from src.llm.providers import ModelTier, create_llm
from src.logging_config import NodeLogger

# Import safety validation functions
from .safety import check_wim_hof_safety, get_user_wim_hof_session_count

# Set up logging for this node
logger = NodeLogger("breathing_exercise")


# -----------------------------------------------------------------------------
# Type Definitions
# -----------------------------------------------------------------------------


class BreathingTechnique(TypedDict):
    """Configuration for a breathing exercise technique."""

    id: str
    name: str
    durations: list[int]
    description: str
    recommended_cycles: int
    best_for: list[str]


class TechniquePhaseData(TypedDict):
    """Phase data for breathing technique in activity format."""

    id: str
    name: str
    durations: list[int]
    phases: list[Literal["inhale", "holdIn", "exhale", "holdOut"]]
    description: str
    cycles: int


class ActivityData(TypedDict):
    """Activity data structure for frontend parsing."""

    type: Literal["activity"]
    activity: Literal["breathing"]
    status: Literal["ready"]
    technique: TechniquePhaseData
    introduction: str


class BreathingConfirmation(TypedDict):
    """HITL interrupt data for breathing confirmation."""

    type: Literal["breathing_confirmation"]
    proposed_technique: BreathingTechnique
    message: str
    available_techniques: list[BreathingTechnique]
    options: list[Literal["start", "change_technique", "not_now"]]


class UserResponse(TypedDict, total=False):
    """User's response to breathing confirmation."""

    decision: Literal["start", "change_technique", "not_now"]
    technique_id: str


class WimHofTechnique(TypedDict):
    """Configuration for Wim Hof Method breathing exercise."""

    id: Literal["wim_hof"]
    name: str
    type: Literal["wim_hof"]  # Discriminator for union types
    description: str
    best_for: list[str]

    # Round structure
    rounds: int  # Total number of rounds (default: 3)
    breaths_per_round: int  # Rapid breaths per round (default: 30)
    breath_tempo_ms: int  # Milliseconds per breath for auto-pace (default: 1500)

    # Retention phase
    retention_target_seconds: int  # Suggested hold time (default: 90)

    # Recovery
    recovery_pause_seconds: int  # Rest between rounds (default: 15)
    inhale_hold_seconds: int  # Hold after recovery breath (default: 15)


class WimHofActivityData(TypedDict):
    """Activity data for Wim Hof exercises sent to frontend."""

    type: Literal["activity"]
    activity: Literal["breathing_wim_hof"]  # New activity type
    status: Literal["ready"]
    technique: WimHofTechnique
    introduction: str
    is_first_time: bool  # For displaying tutorial on first session


# -----------------------------------------------------------------------------
# Breathing Technique Configurations
# -----------------------------------------------------------------------------
# Each technique defines its timing pattern [inhale, holdIn, exhale, holdOut]
# and metadata for display and selection.

BREATHING_TECHNIQUES: dict[str, BreathingTechnique] = {
    "box": {
        "id": "box",
        "name": "Box Breathing",
        "durations": [4, 4, 4, 4],
        "description": "Equal 4-second cycles for stress relief and improved focus. Used by Navy SEALs for calm under pressure.",
        "recommended_cycles": 4,
        "best_for": ["stress", "focus", "anxiety", "overwhelm"],
    },
    "relaxing_478": {
        "id": "relaxing_478",
        "name": "4-7-8 Relaxing Breath",
        "durations": [4, 7, 8, 0],
        "description": "Dr. Andrew Weil's calming breath pattern. Excellent for anxiety relief and better sleep.",
        "recommended_cycles": 4,
        "best_for": ["anxiety", "sleep", "panic", "racing thoughts"],
    },
    "coherent": {
        "id": "coherent",
        "name": "Coherent Breathing",
        "durations": [6, 0, 6, 0],
        "description": "Balanced breathing at 5 breaths per minute. Optimizes heart rate variability for calm and resilience.",
        "recommended_cycles": 6,
        "best_for": ["balance", "calm", "resilience", "general wellness"],
    },
    "deep_calm": {
        "id": "deep_calm",
        "name": "Deep Calm",
        "durations": [5, 2, 7, 2],
        "description": "Extended exhale pattern activates the parasympathetic nervous system for deep relaxation.",
        "recommended_cycles": 5,
        "best_for": ["deep relaxation", "tension release", "evening wind-down"],
    },
}

# Wim Hof Method technique configuration
WIM_HOF_TECHNIQUE: WimHofTechnique = {
    "id": "wim_hof",
    "name": "Wim Hof Method",
    "type": "wim_hof",
    "description": "Rapid breathing followed by breath retention. Boosts energy and resilience.",
    "best_for": ["energy boost", "immune support", "stress relief", "mental clarity"],
    "rounds": 3,
    "breaths_per_round": 30,
    "breath_tempo_ms": 1500,  # 1.5 seconds per breath
    "retention_target_seconds": 90,  # 1:30 target
    "recovery_pause_seconds": 15,
    "inhale_hold_seconds": 15,
}

# Union type for all techniques (continuous + Wim Hof)
BreathingTechniqueUnion = BreathingTechnique | WimHofTechnique

# Combined techniques dictionary
ALL_BREATHING_TECHNIQUES: dict[str, BreathingTechniqueUnion] = {
    **BREATHING_TECHNIQUES,  # Existing 4 continuous techniques
    "wim_hof": WIM_HOF_TECHNIQUE,
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


async def get_safe_techniques_for_user(state: WellnessState) -> list[BreathingTechniqueUnion]:
    """
    Return techniques that are safe for this user.

    Performs safety checks for advanced techniques like Wim Hof.
    Always includes the 4 continuous breathing techniques.

    Args:
        state: Current conversation state with user context

    Returns:
        List of techniques that are safe for this user
    """
    # Always include continuous techniques (these are safe for everyone)
    safe_techniques: list[BreathingTechniqueUnion] = list(BREATHING_TECHNIQUES.values())

    # Check if Wim Hof is safe for this user
    safety_check = await check_wim_hof_safety(state)

    if safety_check["safe"]:
        safe_techniques.append(WIM_HOF_TECHNIQUE)

    return safe_techniques


async def select_technique_with_llm(state: WellnessState) -> BreathingTechniqueUnion:
    """
    Uses the LLM to analyze conversation context and select the most
    appropriate breathing technique.

    The LLM considers:
    - User's recent messages and emotional state
    - User preferences from their profile
    - The benefits of each technique
    - Safety constraints (e.g., Wim Hof requires experience)
    """
    messages = state.get("messages", [])
    user_context = state.get("user_context", {})
    last_message = get_last_user_message(messages)

    # Get available techniques (may exclude Wim Hof if unsafe)
    available_techniques = await get_safe_techniques_for_user(state)

    # Build context for technique selection
    techniques_info = "\n".join(
        [
            f"- {t['id']}: {t['name']} - {t['description']} (Best for: {', '.join(t['best_for'])})"
            for t in available_techniques
        ]
    )

    # Get list of valid IDs for validation
    valid_ids = {t["id"] for t in available_techniques}

    selection_prompt = f"""You are helping select a breathing technique for a user.

Available techniques:
{techniques_info}

User's recent message: "{last_message}"
User preferences: {user_context.get("preferences", {})}

IMPORTANT:
- Wim Hof: ONLY for energy boost, immune support, or explicit request. Advanced technique.
- For anxiety/sleep: prefer 4-7-8 or deep_calm
- For focus: prefer box or coherent
- When uncertain: default to box breathing

Respond with ONLY the technique ID (one of: {", ".join(valid_ids)}).
"""

    try:
        llm = create_llm(tier=ModelTier.FAST, temperature=0.3, max_tokens=20)
        response = await llm.ainvoke([HumanMessage(content=selection_prompt)])
        technique_id = str(response.content).strip().lower()

        # Validate and return if found
        if technique_id in valid_ids:
            return next(t for t in available_techniques if t["id"] == technique_id)
    except Exception as e:
        logger.warning(f"LLM technique selection failed: {e}")

    # Default to box breathing if selection fails
    return BREATHING_TECHNIQUES["box"]


def format_exercise_message(technique: BreathingTechnique, introduction: str) -> str:
    """
    Formats the exercise configuration as a message with activity markers.

    The frontend parses content between [ACTIVITY_START] and [ACTIVITY_END]
    markers to render the interactive breathing exercise component.
    """
    activity_data: ActivityData = {
        "type": "activity",
        "activity": "breathing",
        "status": "ready",
        "technique": {
            "id": technique["id"],
            "name": technique["name"],
            "durations": technique["durations"],
            "phases": ["inhale", "holdIn", "exhale", "holdOut"],
            "description": technique["description"],
            "cycles": technique["recommended_cycles"],
        },
        "introduction": introduction,
    }

    # Format with markers for frontend parsing
    return f"[ACTIVITY_START]{json.dumps(activity_data)}[ACTIVITY_END]"


def format_wim_hof_exercise(
    technique: WimHofTechnique, introduction: str, is_first_time: bool
) -> str:
    """
    Formats Wim Hof exercise configuration for frontend parsing.

    Args:
        technique: Wim Hof technique configuration
        introduction: Personalized introduction text
        is_first_time: Whether this is user's first Wim Hof session

    Returns:
        JSON-encoded activity data wrapped in markers
    """
    activity_data: WimHofActivityData = {
        "type": "activity",
        "activity": "breathing_wim_hof",
        "status": "ready",
        "technique": technique,
        "introduction": introduction,
        "is_first_time": is_first_time,
    }

    return f"[ACTIVITY_START]{json.dumps(activity_data)}[ACTIVITY_END]"


def generate_introduction(
    technique: BreathingTechniqueUnion, user_name: str, is_first_time: bool = False
) -> str:
    """
    Generate personalized introduction based on technique type and user experience.

    Args:
        technique: The selected breathing technique
        user_name: User's display name for personalization
        is_first_time: Whether this is user's first time with this technique

    Returns:
        Personalized introduction text
    """
    # Check if this is a Wim Hof technique
    if technique.get("type") == "wim_hof":
        if is_first_time:
            return f"""Welcome to the Wim Hof Method, {user_name}! This is an energizing technique that combines rapid breathing with breath retention.

**What to expect:**
- 3 rounds of 30 rapid breaths each
- Hold your breath after exhaling (as long as comfortable)
- Recovery breath between rounds

**Safety:** You may feel tingling or slight lightheadedness - this is normal. If you feel dizzy, slow down or stop. Always practice sitting or lying down.

Ready to boost your energy? Click Start when comfortable."""
        else:
            return f"""Time for Wim Hof breathing, {user_name}! Let's energize with 3 rounds of powerful breathing and retention. Click Start when ready."""

    # Existing continuous breathing introduction
    return (
        f"Let's take a moment to breathe together, {user_name}. "
        f"We'll practice {technique['name']} - "
        f"{technique['description'].split('.')[0].lower()}. "
        f"When you're ready, click Start and follow along with the breathing circle."
    )


# -----------------------------------------------------------------------------
# Main Node Function
# -----------------------------------------------------------------------------


async def run_breathing_exercise(state: WellnessState) -> dict[str, list[AIMessage] | str]:
    """
    Guides the user through a breathing exercise with HITL confirmation.

    Flow:
    1. Analyze conversation context to select appropriate technique
    2. Use interrupt() to present technique and get user confirmation
    3. Handle user's decision (start, change technique, or decline)
    4. Return exercise configuration for frontend rendering

    Supports both continuous breathing (box, 4-7-8, etc.) and Wim Hof Method.
    Applies safety checks for advanced techniques.

    Args:
        state: Current conversation state including messages and user context

    Returns:
        Dict with messages containing exercise guidance/configuration
    """
    logger.node_start()

    # Get user context for personalization and safety checks
    user_context = state.get("user_context", {})
    user_name = user_context.get("display_name", "there")
    user_id = user_context.get("id")

    # Step 1: Select the most appropriate technique (with safety filtering)
    selected_technique = await select_technique_with_llm(state)
    logger.info("Selected technique", technique=selected_technique["name"])

    # Check if first time for Wim Hof (for tutorial display)
    is_first_time = False
    if selected_technique["id"] == "wim_hof":
        session_count = await get_user_wim_hof_session_count(user_id)
        is_first_time = session_count == 0
        logger.info("Wim Hof first time check", is_first=is_first_time, sessions=session_count)

    # Step 2: Use HITL interrupt to get user confirmation
    # Get safe techniques for the confirmation options
    available_techniques = await get_safe_techniques_for_user(state)

    confirmation_data: BreathingConfirmation = {
        "type": "breathing_confirmation",
        "proposed_technique": selected_technique,
        "message": f"I'd suggest {selected_technique['name']} for you right now.",
        "available_techniques": available_techniques,
        "options": ["start", "change_technique", "not_now"],
    }
    user_response: UserResponse = interrupt(confirmation_data)

    # Step 3: Handle user's decision
    decision = user_response.get("decision", "start")

    if decision == "not_now":
        logger.info("User declined")
        logger.node_end()
        return {
            "messages": [
                AIMessage(
                    content=(
                        f"No problem, {user_name}! Whenever you feel ready for a breathing "
                        "exercise, just let me know. I'm here to support you."
                    )
                )
            ]
        }

    if decision == "change_technique":
        # User selected a different technique
        new_technique_id = user_response.get("technique_id", "box")

        # Re-validate safety if switching TO Wim Hof
        if new_technique_id == "wim_hof":
            safety_check = await check_wim_hof_safety(state)
            if not safety_check["safe"]:
                logger.warning("Blocked manual Wim Hof selection", reason=safety_check["reason"])
                logger.node_end()
                return {"messages": [AIMessage(content=safety_check["message"])]}
            # Check first-time status for new selection
            session_count = await get_user_wim_hof_session_count(user_id)
            is_first_time = session_count == 0

        # Update selected technique
        if new_technique_id in ALL_BREATHING_TECHNIQUES:
            selected_technique = ALL_BREATHING_TECHNIQUES[new_technique_id]
            logger.info("User changed technique", new=selected_technique["name"])

    # Step 4: Generate personalized introduction
    introduction = generate_introduction(selected_technique, user_name, is_first_time)

    # Step 5: Format exercise message based on technique type
    if selected_technique.get("type") == "wim_hof":
        exercise_message = format_wim_hof_exercise(selected_technique, introduction, is_first_time)
    else:
        exercise_message = format_exercise_message(selected_technique, introduction)

    logger.node_end()

    return {
        "messages": [AIMessage(content=exercise_message)],
        "exercise_technique": selected_technique["id"],
    }
