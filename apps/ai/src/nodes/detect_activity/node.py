"""
============================================================================
Detect Activity Intent Node
============================================================================
Analyzes conversation to detect when wellness activities would be helpful.

Uses LLM with structured output for reliable classification:
- Detects explicit activity requests ("Can we do a breathing exercise?")
- Identifies implicit signals ("I'm feeling so anxious", "I can't sleep")
- Returns suggested activity type for graph routing

Classification outputs:
- breathing: User needs calming, stress relief, anxiety help
- meditation: User seeks focus, mindfulness, presence
- journaling: User wants to express/process feelings
- None: Normal conversation, no activity needed
============================================================================
"""

from typing import Literal

from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field

from src.graph.state import WellnessState
from src.llm.providers import ModelTier, create_llm
from src.logging_config import NodeLogger

# Set up logging for this node
logger = NodeLogger("detect_activity")


# -----------------------------------------------------------------------------
# Structured Output Schema
# -----------------------------------------------------------------------------


class ActivityDetection(BaseModel):
    """
    Structured output for activity detection.

    Using Pydantic model with LangChain's with_structured_output()
    ensures reliable, typed responses from the LLM.
    """

    detected_activity: Literal["breathing", "meditation", "journaling"] | None = Field(
        default=None,
        description="The type of wellness activity detected, or None if normal conversation",
    )

    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence score from 0 to 1. Higher means more certain the activity is appropriate.",
    )

    reasoning: str = Field(
        description="Brief explanation of why this activity was detected or why no activity is needed",
    )


# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------


def get_last_user_message(messages: list) -> str:
    """Extract the content of the last human message."""
    for message in reversed(messages):
        if isinstance(message, HumanMessage):
            return str(message.content)
    return ""


def get_recent_context(messages: list, count: int = 3) -> str:
    """Get a summary of recent conversation for context."""
    recent = []
    for msg in messages[-count * 2 :]:  # Last few exchanges
        role = "User" if isinstance(msg, HumanMessage) else "Assistant"
        content = str(msg.content)[:200]  # Truncate for efficiency
        recent.append(f"{role}: {content}")
    return "\n".join(recent)


# -----------------------------------------------------------------------------
# Detection Prompt
# -----------------------------------------------------------------------------

DETECTION_PROMPT = """You are an activity detection system for a wellness chatbot.

Analyze the user's message and recent conversation to determine if a wellness activity would be helpful.

DETECTION RULES:
- BREATHING: Detect when user mentions stress, anxiety, panic, overwhelm, can't calm down,
  tense, nervous, racing heart, need to relax, breathing help, or similar distress signals.
  Also detect explicit requests for breathing exercises.

- MEDITATION: Detect when user mentions trouble focusing, scattered thoughts, wanting
  mindfulness, need to be present, seeking clarity, or explicit meditation requests.

- JOURNALING: Detect when user wants to write down feelings, process emotions, reflect
  on experiences, express themselves, or explicit journaling requests.

- None: Normal conversation, casual chat, questions, or when no activity seems appropriate.
  Be conservative - only suggest activities when clearly appropriate.

IMPORTANT:
- Be conservative with detection. Only suggest activities when there's clear indication.
- Confidence should be HIGH (0.8+) only for explicit requests or strong signals.
- Confidence should be MEDIUM (0.5-0.7) for implicit signals that suggest an activity.
- If unsure, return None with low confidence.

Recent conversation:
{context}

Current user message:
"{message}"

Analyze this and determine if a wellness activity would help."""


# -----------------------------------------------------------------------------
# Main Node Function
# -----------------------------------------------------------------------------


async def detect_activity_intent(state: WellnessState) -> dict:
    """
    Analyzes conversation to detect if an activity would be helpful.

    Uses LLM with structured output for reliable classification.
    Only routes to activities when confidence is above threshold (0.7).

    Args:
        state: Current conversation state including messages

    Returns:
        Dict with suggested_activity (or None if no activity detected)
    """
    logger.node_start()

    messages = state.get("messages", [])
    if not messages:
        return {"suggested_activity": None}

    # Get the user's message and recent context
    last_message = get_last_user_message(messages)
    context = get_recent_context(messages)

    # Create structured LLM
    try:
        llm = create_llm(tier=ModelTier.FAST, temperature=0.2, max_tokens=200)
        structured_llm = llm.with_structured_output(ActivityDetection)

        # Format the detection prompt
        prompt = DETECTION_PROMPT.format(context=context, message=last_message)

        # Run detection
        result: ActivityDetection = await structured_llm.ainvoke([HumanMessage(content=prompt)])

        # Only route if confidence is high enough
        confidence_threshold = 0.7
        if result.confidence >= confidence_threshold and result.detected_activity:
            logger.info(
                "Activity detected → routing",
                activity=result.detected_activity,
                confidence=f"{result.confidence:.0%}",
            )
            logger.node_end()
            return {"suggested_activity": result.detected_activity}

        logger.info("No activity needed → conversation")
        logger.node_end()
        return {"suggested_activity": None}

    except Exception as e:
        logger.error("Detection failed", error=str(e))
        logger.node_end()
        return {"suggested_activity": None}
