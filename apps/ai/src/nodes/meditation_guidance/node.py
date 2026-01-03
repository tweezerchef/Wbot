"""
============================================================================
Meditation Guidance Node - PLACEHOLDER
============================================================================
This node will provide guided meditation content.

Planned functionality:
1. Duration based on user's session_length preference
2. Personalized meditation style
3. Structured output for timed frontend rendering

This is a stub for architecture validation.
============================================================================
"""

from langchain_core.messages import AIMessage

from src.graph.state import WellnessState
from src.logging_config import NodeLogger

# Set up logging for this node
logger = NodeLogger("meditation_guidance")


async def run_meditation_guidance(state: WellnessState) -> dict[str, list[AIMessage]]:
    """
    Provides guided meditation content.

    PLACEHOLDER - Logs and returns a stub message.

    Args:
        state: Current conversation state

    Returns:
        Dict with meditation guidance messages
    """
    logger.node_start()
    logger.info("PLACEHOLDER - Feature coming soon")

    placeholder_message = AIMessage(
        content="[PLACEHOLDER] I would now guide you through a meditation. "
        "This feature is coming soon! For now, try closing your eyes and "
        "focusing on your breath for a minute."
    )

    logger.node_end()
    return {"messages": [placeholder_message]}
