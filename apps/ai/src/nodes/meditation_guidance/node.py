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

import logging

from langchain_core.messages import AIMessage

from src.graph.state import TherapyState

# Set up logging for this node
logger = logging.getLogger(__name__)


async def run_meditation_guidance(state: TherapyState) -> dict:
    """
    Provides guided meditation content.

    PLACEHOLDER - Logs and returns a stub message.

    Args:
        state: Current conversation state

    Returns:
        Dict with meditation guidance messages
    """
    # Log that this node was reached (for routing validation)
    logger.info("=== MEDITATION GUIDANCE NODE REACHED ===")
    logger.info(f"User context: {state.get('user_context', {})}")
    logger.info(f"Message count: {len(state.get('messages', []))}")

    # Also print to console for visibility
    print("\n" + "=" * 50)
    print("PLACEHOLDER: Meditation Guidance Node Activated")
    print("=" * 50)
    print(f"User: {state.get('user_context', {}).get('display_name', 'Unknown')}")
    print("This is where meditation guidance would be generated.")
    print("=" * 50 + "\n")

    # Return a placeholder message
    placeholder_message = AIMessage(
        content="[PLACEHOLDER] I would now guide you through a meditation. "
        "This feature is coming soon! For now, try closing your eyes and "
        "focusing on your breath for a minute."
    )

    return {"messages": [placeholder_message]}
