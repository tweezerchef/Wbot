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


# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------


def get_last_user_message(messages: list[BaseMessage]) -> str:
    """Extract the content of the last human message."""
    for message in reversed(messages):
        if isinstance(message, HumanMessage):
            return str(message.content)
    return ""


async def select_technique_with_llm(state: WellnessState) -> BreathingTechnique:
    """
    Uses the LLM to analyze conversation context and select the most
    appropriate breathing technique.

    The LLM considers:
    - User's recent messages and emotional state
    - User preferences from their profile
    - The benefits of each technique
    """
    messages = state.get("messages", [])
    user_context = state.get("user_context", {})
    last_message = get_last_user_message(messages)

    # Build context for technique selection
    techniques_info = "\n".join(
        [
            f"- {t['name']}: {t['description']} Best for: {', '.join(t['best_for'])}"
            for t in BREATHING_TECHNIQUES.values()
        ]
    )

    selection_prompt = f"""You are helping select a breathing technique for a user.

Available techniques:
{techniques_info}

User's recent message: "{last_message}"
User preferences: {user_context.get("preferences", {})}

Based on the context, which technique would be most helpful?
Respond with ONLY the technique ID (one of: box, relaxing_478, coherent, deep_calm).
"""

    try:
        llm = create_llm(tier=ModelTier.FAST, temperature=0.3, max_tokens=50)
        response = await llm.ainvoke([HumanMessage(content=selection_prompt)])
        technique_id = str(response.content).strip().lower()

        # Validate and fallback
        if technique_id in BREATHING_TECHNIQUES:
            return BREATHING_TECHNIQUES[technique_id]
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

    Args:
        state: Current conversation state including messages and user context

    Returns:
        Dict with messages containing exercise guidance/configuration
    """
    logger.node_start()

    # Get user's display name for personalization
    user_context = state.get("user_context", {})
    user_name = user_context.get("display_name", "there")

    # Step 1: Select the most appropriate technique
    selected_technique = await select_technique_with_llm(state)
    logger.info("Selected technique", technique=selected_technique["name"])

    # Step 2: Use HITL interrupt to get user confirmation
    # This pauses the graph and waits for user input
    confirmation_data: BreathingConfirmation = {
        "type": "breathing_confirmation",
        "proposed_technique": selected_technique,
        "message": (
            f"I'd suggest {selected_technique['name']} for you right now. "
            f"{selected_technique['description']}"
        ),
        "available_techniques": list(BREATHING_TECHNIQUES.values()),
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
        if new_technique_id in BREATHING_TECHNIQUES:
            selected_technique = BREATHING_TECHNIQUES[new_technique_id]
            logger.info("User changed technique", new=selected_technique["name"])

    # Step 4: Generate personalized introduction
    introduction = (
        f"Let's take a moment to breathe together, {user_name}. "
        f"We'll practice {selected_technique['name']} - "
        f"{selected_technique['description'].split('.')[0].lower()}. "
        f"When you're ready, click Start and follow along with the breathing circle."
    )

    # Step 5: Return the exercise configuration
    exercise_message = format_exercise_message(selected_technique, introduction)

    logger.node_end()

    return {
        "messages": [AIMessage(content=exercise_message)],
        "exercise_technique": selected_technique["id"],
    }
