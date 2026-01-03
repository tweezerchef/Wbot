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

from typing import Annotated, Literal, NotRequired, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

# Activity types that can be suggested/routed to
ActivityType = Literal["breathing", "meditation", "journaling"]


class WellnessState(TypedDict):
    """
    State for the wellness conversation graph.

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

    # Retrieved memories from semantic search (set by retrieve_memories node)
    # Each memory is a dict with: id, user_message, ai_response, similarity
    # Used by generate_response to inject relevant context into the prompt
    # NotRequired because it's only populated during graph execution
    retrieved_memories: NotRequired[list[dict]]

    # -------------------------------------------------------------------------
    # Activity Routing State
    # -------------------------------------------------------------------------
    # These fields support the activity detection and routing system.
    # When detect_activity identifies an activity opportunity, it sets
    # suggested_activity, which triggers conditional routing in the graph.

    # Activity suggested by detect_activity node for conditional routing
    # None means no activity detected, proceed with normal response
    suggested_activity: NotRequired[ActivityType | None]

    # Tracks whether an exercise was completed (for follow-up messages)
    exercise_completed: NotRequired[bool]

    # The technique ID if a breathing exercise was performed
    exercise_technique: NotRequired[str]
