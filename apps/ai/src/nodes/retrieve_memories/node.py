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
from langchain_core.runnables import RunnableConfig

from src.graph.state import WellnessState
from src.logging_config import NodeLogger
from src.memory.store import search_memories
from src.utils.auth_helpers import get_auth_user_field

# Set up logging for this node
logger = NodeLogger("retrieve_memories")


async def retrieve_memories(
    state: WellnessState, config: RunnableConfig
) -> dict[str, list[dict[str, str | float]]]:
    """
    Retrieves relevant memories based on the user's message.

    Performs semantic search against the memory store to find past
    conversations that may be relevant to the current discussion.
    Results are ordered by similarity.

    This node runs at START in parallel with inject_user_context and
    detect_activity. It gets user_id directly from the LangGraph auth
    config rather than waiting for inject_user_context to populate state.

    Args:
        state: Current conversation state with messages
        config: LangGraph config containing langgraph_auth_user

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
    logger.node_start()

    # Get user_id directly from LangGraph auth config
    # This allows memory retrieval to run at START in parallel with inject_user_context
    configurable = config.get("configurable", {})
    auth_user = configurable.get("langgraph_auth_user", {})
    user_id = get_auth_user_field(auth_user, "identity")

    if not user_id:
        # No user ID means no memories to search (unauthenticated request)
        logger.warning("No user_id in config - skipping memory retrieval")
        logger.node_end()
        return {"retrieved_memories": []}

    # Get the latest user message
    messages = state.get("messages", [])
    user_messages = [m for m in messages if isinstance(m, HumanMessage)]

    if not user_messages:
        # No user messages yet
        logger.node_end()
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

        if memory_dicts:
            logger.info("Found relevant memories", count=len(memory_dicts))

        logger.node_end()
        return {"retrieved_memories": memory_dicts}

    except Exception as e:
        # Log error but don't fail the conversation
        # User should still get a response even if memory retrieval fails
        logger.error("Memory search failed", error=str(e))
        logger.node_end()
        return {"retrieved_memories": []}
