"""
============================================================================
Detect Activity Intent Node - PLACEHOLDER
============================================================================
This node will analyze conversations to detect activity opportunities.

Planned functionality:
1. Use LLM to classify user intent
2. Detect explicit activity requests
3. Identify when activities would be helpful
4. Route to appropriate activity node

This is a stub for architecture validation.
============================================================================
"""

import logging

from src.graph.state import TherapyState

# Set up logging for this node
logger = logging.getLogger(__name__)


async def detect_activity_intent(state: TherapyState) -> dict:
    """
    Analyzes conversation to detect if an activity would be helpful.

    PLACEHOLDER - Logs and returns None (no activity detected).

    Future implementation will use the LLM to determine:
    - Is the user explicitly asking for an activity?
    - Would an activity be appropriate given the conversation?
    - Which activity type would be most helpful?

    Args:
        state: Current conversation state

    Returns:
        Dict with:
        - suggested_activity: "breathing" | "meditation" | "journaling" | None
    """
    # Log that this node was reached
    logger.info("=== DETECT ACTIVITY NODE REACHED ===")

    # Get the last message to analyze
    messages = state.get("messages", [])
    last_message = messages[-1].content if messages else "No messages"

    logger.info(f"Analyzing message: {last_message[:100]}...")

    # Print to console for visibility
    print("\n" + "=" * 50)
    print("PLACEHOLDER: Detect Activity Node Activated")
    print("=" * 50)
    print(f"Last message: {last_message[:100]}...")
    print("Activity detection would happen here.")
    print("Returning: None (no activity detected)")
    print("=" * 50 + "\n")

    # TODO: Implement activity detection using LLM classification
    # For now, always return None (proceed to normal response)
    return {"suggested_activity": None}
