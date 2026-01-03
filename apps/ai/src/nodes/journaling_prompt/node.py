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

from langchain_core.messages import AIMessage

from src.graph.state import WellnessState
from src.logging_config import NodeLogger

# Set up logging for this node
logger = NodeLogger("journaling_prompt")


async def provide_journaling_prompt(state: WellnessState) -> dict:
    """
    Offers a journaling prompt based on conversation context.

    PLACEHOLDER - Logs and returns a stub message.

    Args:
        state: Current conversation state

    Returns:
        Dict with journaling prompt messages
    """
    logger.node_start()
    logger.info("PLACEHOLDER - Feature coming soon")

    placeholder_message = AIMessage(
        content="[PLACEHOLDER] I would now offer you a journaling prompt. "
        "This feature is coming soon! For now, try writing about: "
        "'What's one thing you're grateful for today, and why?'"
    )

    logger.node_end()
    return {"messages": [placeholder_message]}
