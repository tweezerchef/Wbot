"""
============================================================================
Generate Response Node
============================================================================
The primary node for generating AI responses in the therapy conversation.

This node:
1. Takes the current conversation state
2. Builds a personalized system prompt with user context
3. Calls the LLM to generate a response
4. Returns the response to be added to the message history

The node is async to support LangGraph's streaming capabilities.
When deployed, tokens are streamed to the client as they're generated.
============================================================================
"""

from langchain_core.messages import SystemMessage

from src.graph.state import TherapyState
from src.llm.providers import create_llm
from src.prompts.therapy_system import THERAPY_SYSTEM_PROMPT
from src.utils.user_context import format_user_context


async def generate_response(state: TherapyState) -> dict:
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
        via the add_messages reducer defined in TherapyState.

    Streaming:
        This function is async and the LLM call (ainvoke) supports streaming.
        When running in LangGraph Deploy, tokens are streamed to the client
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
    # Create the LLM instance
    # The provider (Claude/Gemini) is determined by LLM_PROVIDER env var
    llm = create_llm()

    # Extract user context from state
    # This comes from the auth module after token validation
    user_context = state.get("user_context", {})

    # Convert user context into readable text for the system prompt
    # This transforms structured preferences into natural language
    context_str = format_user_context(user_context)

    # Create the system message with personalized context
    # The THERAPY_SYSTEM_PROMPT has a {user_context} placeholder
    system_message = SystemMessage(
        content=THERAPY_SYSTEM_PROMPT.format(user_context=context_str)
    )

    # Build the complete message list for the LLM
    # Structure: [SystemMessage, HumanMessage, AIMessage, HumanMessage, ...]
    messages = [system_message] + state["messages"]

    # Generate the response
    # ainvoke is the async version, enabling streaming in LangGraph
    response = await llm.ainvoke(messages)

    # Return the update to be merged into state
    # The add_messages reducer handles appending to the messages list
    return {"messages": [response]}
