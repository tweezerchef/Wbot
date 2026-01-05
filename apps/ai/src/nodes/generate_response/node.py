"""
============================================================================
Generate Response Node
============================================================================
The primary node for generating AI responses in the wellness conversation.

This node:
1. Takes the current conversation state
2. Builds a personalized system prompt with user context and memories
3. Calls the LLM to generate a response
4. Returns the response to be added to the message history

The node is async to support LangGraph's streaming capabilities.
When deployed, tokens are streamed to the client as they're generated.
============================================================================
"""

from langchain_core.messages import AIMessage, SystemMessage

from src.graph.state import WellnessState
from src.llm.providers import create_resilient_llm
from src.logging_config import NodeLogger
from src.memory.store import Memory, format_memories_for_prompt
from src.prompts.wellness_system import WELLNESS_SYSTEM_PROMPT
from src.utils.user_context import format_user_context

# Set up logging for this node
logger = NodeLogger("generate_response")


async def generate_response(state: WellnessState) -> dict[str, list[object]]:
    """
    Generates an AI response based on conversation history.

    This is the main workhorse of the conversation graph. It:
    1. Creates an LLM instance (Claude or Gemini based on config)
    2. Formats the user's profile into context for the system prompt
    3. Combines system prompt with conversation history
    4. Generates and returns the AI response

    Args:
        state: Current conversation state containing:
               - messages: List of conversation messages (HumanMessage, AIMessage)
               - user_context: Dict with user profile and preferences

    Returns:
        Dict with a single key:
        - messages: List containing the new AIMessage

        Example:
        {
            "messages": [
                AIMessage(content="I hear that you're feeling stressed...")
            ]
        }

    State Update:
        The returned message is automatically appended to state.messages
        via the add_messages reducer defined in WellnessState.

    Streaming:
        This function is async and the LLM call (ainvoke) supports streaming.
        The self-hosted LangGraph server streams tokens to the client
        as they're generated, providing a real-time typing effect.

    Example:
        # In the graph, this node receives state like:
        state = {
            "messages": [
                HumanMessage(content="I've been really stressed at work lately")
            ],
            "user_context": {
                "display_name": "Alex",
                "preferences": {"primary_goal": "stress_anxiety"}
            }
        }

        # And returns:
        {
            "messages": [
                AIMessage(content="I'm sorry to hear you're dealing with work stress, Alex...")
            ]
        }
    """
    logger.node_start()

    # Create a resilient LLM instance with automatic fallback on rate limits
    # Default tier is STANDARD (Claude Haiku 4.5) for conversation quality
    llm = create_resilient_llm()

    # Extract user context from state
    # This comes from the auth module after token validation
    user_context = state.get("user_context", {})

    # Convert user context into readable text for the system prompt
    # This transforms structured preferences into natural language
    context_str = format_user_context(user_context)

    # Extract and format retrieved memories (if any)
    # These come from the retrieve_memories node that runs before this
    retrieved_memories = state.get("retrieved_memories", [])
    if retrieved_memories:
        logger.info("Using memories", count=len(retrieved_memories))
        # Convert dicts back to Memory objects for formatting
        memories = [
            Memory(
                id=m["id"],
                user_message=m["user_message"],
                ai_response=m["ai_response"],
                similarity=m["similarity"],
                created_at="",  # Not needed for formatting
                metadata={},
            )
            for m in retrieved_memories
        ]
        memory_context = format_memories_for_prompt(memories)
        # Append memory context to user context
        context_str = context_str + "\n\n" + memory_context if context_str else memory_context

    # Create the system message with personalized context
    # The WELLNESS_SYSTEM_PROMPT has a {user_context} placeholder
    system_message = SystemMessage(content=WELLNESS_SYSTEM_PROMPT.format(user_context=context_str))

    # Build the complete message list for the LLM
    # Structure: [SystemMessage, HumanMessage, AIMessage, HumanMessage, ...]
    messages = [system_message] + state["messages"]

    # Generate the response with error handling
    # The resilient LLM handles rate limit fallbacks automatically
    try:
        response = await llm.ainvoke(messages)
        logger.node_end()
        return {"messages": [response]}

    except Exception as e:
        # Log the error but return a graceful fallback message
        logger.error("Response generation failed", error=str(e))
        logger.node_end()

        # Return a helpful error message that maintains conversation quality
        fallback = AIMessage(
            content=(
                "I'm having a moment of difficulty connecting right now. "
                "Could you give me a moment and try again? "
                "I'm here to support you."
            )
        )
        return {"messages": [fallback]}
