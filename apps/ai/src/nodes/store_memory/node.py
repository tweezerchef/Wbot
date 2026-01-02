"""
============================================================================
Store Memory Node
============================================================================
Stores the conversation pair as a memory after generating a response.

This node:
1. Extracts the latest user message and AI response
2. Stores them as a memory with an embedding
3. Returns without modifying state (side-effect only)

Position in graph: Runs AFTER generate_response (after streaming completes)
Execution: Fire-and-forget (errors logged, don't block response delivery)
============================================================================
"""

from langchain_core.messages import AIMessage, HumanMessage

from src.graph.state import WellnessState
from src.memory.store import store_memory


async def store_memory_node(state: WellnessState) -> dict:
    """
    Stores the latest conversation pair as a memory.

    Extracts the most recent user message + AI response pair from the
    conversation and stores it with an embedding for future retrieval.

    This is a side-effect node that doesn't modify state - it just
    persists the conversation to the memory store.

    Args:
        state: Current conversation state after response generation

    Returns:
        Empty dict (no state changes, side-effect only)

    Note:
        - Does nothing if no user_id (unauthenticated)
        - Does nothing if no complete message pair found
        - Errors are logged but don't fail the conversation
    """
    # Get user context for user_id
    user_context = state.get("user_context", {})
    user_id = user_context.get("user_id")

    if not user_id:
        # No user ID means can't store memory
        return {}

    # Get the messages
    messages = state.get("messages", [])

    if len(messages) < 2:
        # Need at least 2 messages for a pair
        return {}

    # Find the latest user message and AI response pair
    # Messages are in order, so we look for: [..., HumanMessage, AIMessage]
    user_message = None
    ai_response = None

    # Walk backwards through messages to find the most recent pair
    for i in range(len(messages) - 1, 0, -1):
        if isinstance(messages[i], AIMessage) and isinstance(messages[i - 1], HumanMessage):
            user_message = messages[i - 1].content
            ai_response = messages[i].content
            break

    if not user_message or not ai_response:
        # No complete pair found
        return {}

    # Store the memory (fire-and-forget pattern)
    # Errors are logged but don't fail the conversation
    try:
        await store_memory(
            user_id=user_id,
            user_message=user_message,
            ai_response=ai_response,
            # Could extract conversation_id from state if available
            conversation_id=None,
            metadata={
                "source": "wellness_chat",
            },
        )
    except Exception as e:
        # Log but don't fail - user already has their response
        print(f"[store_memory] Error storing memory: {e}")

    return {}
