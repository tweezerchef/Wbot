"""
============================================================================
Breathing Exercise Node - PLACEHOLDER
============================================================================
This node will guide users through breathing exercises.

Planned functionality:
1. Detect which breathing technique is appropriate
2. Generate step-by-step instructions
3. Output structured data for frontend visualization
4. Track exercise completion

This is a stub for architecture validation.
Full implementation will come in a future iteration.
============================================================================
"""

import logging

from langchain_core.messages import AIMessage

from src.graph.state import WellnessState

# Set up logging for this node
logger = logging.getLogger(__name__)


async def run_breathing_exercise(state: WellnessState) -> dict:
    """
    Guides the user through a breathing exercise.

    PLACEHOLDER - Logs and returns a stub message.

    Future implementation will:
    - Analyze context to choose appropriate technique
    - Generate personalized guidance
    - Output structured exercise data for frontend

    Args:
        state: Current conversation state

    Returns:
        Dict with messages containing exercise guidance
    """
    # Log that this node was reached (for routing validation)
    logger.info("=== BREATHING EXERCISE NODE REACHED ===")
    logger.info(f"User context: {state.get('user_context', {})}")
    logger.info(f"Message count: {len(state.get('messages', []))}")

    # Also print to console for visibility
    print("\n" + "=" * 50)
    print("PLACEHOLDER: Breathing Exercise Node Activated")
    print("=" * 50)
    print(f"User: {state.get('user_context', {}).get('display_name', 'Unknown')}")
    print("This is where breathing exercise guidance would be generated.")
    print("=" * 50 + "\n")

    # Return a placeholder message so the user sees something
    placeholder_message = AIMessage(
        content="[PLACEHOLDER] I would now guide you through a breathing exercise. "
        "This feature is coming soon! For now, try taking 3 slow, deep breaths on your own."
    )

    return {"messages": [placeholder_message]}
