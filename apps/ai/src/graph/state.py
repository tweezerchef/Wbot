"""
============================================================================
Graph State Definitions
============================================================================
Defines the state schema for LangGraph conversations.

State in LangGraph:
- Persists across conversation turns automatically
- Can be checkpointed for conversation history
- Uses reducers (like add_messages) for smart updates

The state type determines what data flows through the graph
and is saved between requests.
============================================================================
"""

from typing import Annotated, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages


class TherapyState(TypedDict):
    """
    State for the therapy conversation graph.

    This TypedDict defines the shape of data that flows through the graph.
    Each field can have a reducer (via Annotated) that controls how
    updates are applied.

    Attributes:
        messages: The conversation history.
                  Uses the add_messages reducer which:
                  - Appends new messages (doesn't replace)
                  - Handles message deduplication by ID
                  - Supports message deletion by ID

        user_context: Information about the user from authentication.
                      Includes their profile preferences from onboarding.
                      Used to personalize AI responses.

    Example state:
        {
            "messages": [
                HumanMessage(content="I've been feeling stressed lately"),
                AIMessage(content="I'm sorry to hear that...")
            ],
            "user_context": {
                "user_id": "uuid",
                "display_name": "Alex",
                "preferences": {
                    "primary_goal": "stress_anxiety",
                    "communication_style": "warm"
                }
            }
        }
    """

    # Conversation messages with automatic append behavior
    # The add_messages reducer handles appending and deduplication
    messages: Annotated[list[BaseMessage], add_messages]

    # User context from authentication (not reduced, just replaced)
    user_context: dict
