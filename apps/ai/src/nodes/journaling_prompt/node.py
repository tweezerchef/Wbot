"""
============================================================================
Journaling Prompt Node - PLACEHOLDER
============================================================================
This node will offer reflective journaling prompts.

Planned functionality:
1. Analyze conversation for relevant themes
2. Generate personalized prompts
3. Provide follow-up questions
4. Connect to user's stated goals

This is a stub for architecture validation.
============================================================================
"""

import logging

from langchain_core.messages import AIMessage

from src.graph.state import TherapyState

# Set up logging for this node
logger = logging.getLogger(__name__)


async def provide_journaling_prompt(state: TherapyState) -> dict:
    """
    Offers a journaling prompt based on conversation context.

    PLACEHOLDER - Logs and returns a stub message.

    Args:
        state: Current conversation state

    Returns:
        Dict with journaling prompt messages
    """
    # Log that this node was reached (for routing validation)
    logger.info("=== JOURNALING PROMPT NODE REACHED ===")
    logger.info(f"User context: {state.get('user_context', {})}")
    logger.info(f"Message count: {len(state.get('messages', []))}")

    # Also print to console for visibility
    print("\n" + "=" * 50)
    print("PLACEHOLDER: Journaling Prompt Node Activated")
    print("=" * 50)
    print(f"User: {state.get('user_context', {}).get('display_name', 'Unknown')}")
    print("This is where journaling prompts would be generated.")
    print("=" * 50 + "\n")

    # Return a placeholder message
    placeholder_message = AIMessage(
        content="[PLACEHOLDER] I would now offer you a journaling prompt. "
        "This feature is coming soon! For now, try writing about: "
        "'What's one thing you're grateful for today, and why?'"
    )

    return {"messages": [placeholder_message]}
