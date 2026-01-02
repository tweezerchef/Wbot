"""
============================================================================
Retrieve Memories Node
============================================================================
Searches for relevant past conversations before generating a response.

This node:
1. Takes the user's latest message
2. Performs semantic search against the memory store
3. Returns retrieved memories for use in response generation

Position in graph: Runs BEFORE generate_response
Latency: ~50-100ms (embedding generation + DB query)
============================================================================
"""

from langchain_core.messages import HumanMessage

from src.graph.state import WellnessState
from src.memory.store import search_memories


async def retrieve_memories(state: WellnessState) -> dict:
    """
    Retrieves relevant memories based on the user's message.

    Performs semantic search against the memory store to find past
    conversations that may be relevant to the current discussion.
    Results are ordered by similarity.

    Args:
        state: Current conversation state with messages and user context

    Returns:
        Dict with retrieved_memories field to merge into state.
        Each memory contains:
        - id: Memory ID
        - user_message: What the user said
        - ai_response: What the AI responded
        - similarity: Relevance score (0-1)

    Note:
        - Returns empty list if no user_id (unauthenticated)
        - Returns empty list if no user messages yet
        - Errors are logged but don't fail the conversation
    """
    # Get user context for user_id
    user_context = state.get("user_context", {})
    user_id = user_context.get("user_id")

    if not user_id:
        # No user ID means no memories to search (unauthenticated)
        return {"retrieved_memories": []}

    # Get the latest user message
    messages = state.get("messages", [])
    user_messages = [m for m in messages if isinstance(m, HumanMessage)]

    if not user_messages:
        # No user messages yet
        return {"retrieved_memories": []}

    latest_message = user_messages[-1].content

    # Search for relevant memories
    try:
        memories = await search_memories(
            user_id=user_id,
            query=latest_message,
            limit=3,  # Top 3 most relevant memories
            similarity_threshold=0.5,  # Only include reasonably similar matches
        )

        # Convert to dicts for state storage (Pydantic-safe)
        memory_dicts = [
            {
                "id": m.id,
                "user_message": m.user_message,
                "ai_response": m.ai_response,
                "similarity": m.similarity,
            }
            for m in memories
        ]

        return {"retrieved_memories": memory_dicts}

    except Exception as e:
        # Log error but don't fail the conversation
        # User should still get a response even if memory retrieval fails
        print(f"[retrieve_memories] Error searching memories: {e}")
        return {"retrieved_memories": []}
