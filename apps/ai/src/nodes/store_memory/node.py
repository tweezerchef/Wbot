"""
============================================================================
Store Memory Node
============================================================================
Stores the conversation pair as a memory after generating a response.

This node:
1. Extracts the latest user message and AI response
2. Saves them to the messages table (for conversation history)
3. Stores them as a memory with an embedding (for semantic search)
4. Returns without modifying state (side-effect only)

Position in graph: Runs AFTER generate_response (after streaming completes)
Execution: Fire-and-forget (errors logged, don't block response delivery)
============================================================================
"""

from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import RunnableConfig

from src.graph.state import WellnessState
from src.logging_config import NodeLogger
from src.memory.store import generate_title_if_needed, save_messages, store_memory

# Set up logging for this node
logger = NodeLogger("store_memory")


async def store_memory_node(state: WellnessState, config: RunnableConfig) -> dict[str, object]:
    """
    Stores the latest conversation pair as a memory.

    Extracts the most recent user message + AI response pair from the
    conversation and:
    1. Saves to messages table (for conversation history retrieval)
    2. Stores with embedding (for semantic search)

    This is a side-effect node that doesn't modify state - it just
    persists the conversation to the database.

    Args:
        state: Current conversation state after response generation
        config: LangGraph config containing thread_id (conversation_id)

    Returns:
        Empty dict (no state changes, side-effect only)

    Note:
        - Does nothing if no user_id (unauthenticated)
        - Does nothing if no complete message pair found
        - Errors are logged but don't fail the conversation
    """
    logger.node_start()

    # Get user context for user_id
    user_context = state.get("user_context", {})
    user_id = user_context.get("user_id")

    if not user_id:
        # No user ID means can't store memory
        # This shouldn't happen if inject_user_context ran successfully
        logger.warning("No user_id - skipping memory storage (unauthenticated?)")
        logger.node_end()
        return {}

    # Get conversation_id from thread_id in config
    configurable = config.get("configurable", {})
    conversation_id = configurable.get("thread_id")

    # Log the context for diagnostics
    logger.info(
        "Processing message pair",
        user_id=user_id[:8] + "..." if user_id else "None",
        conversation_id=conversation_id[:8] + "..." if conversation_id else "None",
    )

    # Get the messages
    messages = state.get("messages", [])

    if len(messages) < 2:
        # Need at least 2 messages for a pair
        logger.warning("Not enough messages for a pair", message_count=len(messages))
        logger.node_end()
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
        logger.warning("No complete message pair found in state")
        logger.node_end()
        return {}

    # Log the message pair being saved
    logger.info(
        "Found message pair to save",
        user_msg_preview=user_message[:50] + "..." if len(user_message) > 50 else user_message,
        ai_msg_preview=ai_response[:50] + "..." if len(ai_response) > 50 else ai_response,
    )

    # Save to messages table (for conversation history)
    # Only if we have a valid conversation_id
    messages_saved = False
    if conversation_id:
        try:
            supabase_ok, cache_ok = await save_messages(
                conversation_id=conversation_id,
                user_message=user_message,
                ai_response=ai_response,
            )
            messages_saved = supabase_ok
            logger.info(
                "save_messages completed",
                supabase_success=supabase_ok,
                cache_success=cache_ok,
            )
            # Generate a title for the conversation if one doesn't exist
            # This ensures conversations have meaningful titles in history
            await generate_title_if_needed(conversation_id)
        except Exception as e:
            # Log the full error for debugging
            logger.error(
                "CRITICAL: Failed to save messages to Supabase",
                error=str(e),
                conversation_id=conversation_id[:8] + "..." if conversation_id else "None",
            )
            # Don't re-raise - user already has their response, we don't want to fail the graph
    else:
        logger.warning("No conversation_id - cannot save messages")

    # Store the memory with embedding (for semantic search)
    # Fire-and-forget pattern - errors logged but don't fail the conversation
    try:
        await store_memory(
            user_id=user_id,
            user_message=user_message,
            ai_response=ai_response,
            conversation_id=conversation_id,
            metadata={
                "source": "wellness_chat",
                "messages_saved": messages_saved,
            },
        )
        logger.info("Memory stored with embedding")
    except Exception as e:
        # Log but don't fail - user already has their response
        logger.error("Failed to store memory with embedding", error=str(e))

    logger.node_end()
    return {}
