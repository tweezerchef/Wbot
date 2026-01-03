"""
============================================================================
Wellness Conversation Graph
============================================================================
The main LangGraph graph definition for Wbot's wellness chatbot.

Graph Structure (With Activity Routing):
    START -> retrieve_memories -> detect_activity -> [routing decision]
        -> generate_response -> store_memory -> END
        -> breathing_exercise -> store_memory -> END
        (future: meditation_guidance, journaling_prompt)

    - retrieve_memories: Semantic search for relevant past conversations (~50ms)
    - detect_activity: LLM-based classification to detect activity needs
    - generate_response: Streams AI response to user in real-time
    - breathing_exercise: Interactive breathing exercise with HITL confirmation
    - store_memory: Stores conversation pair after streaming completes

This file defines the graph structure and compiles it for deployment.
The compiled `graph` is exported for use by LangGraph Deploy.
============================================================================
"""

from langgraph.graph import END, StateGraph

from src.graph.state import WellnessState
from src.nodes.breathing_exercise import run_breathing_exercise
from src.nodes.detect_activity import detect_activity_intent
from src.nodes.generate_response import generate_response
from src.nodes.retrieve_memories import retrieve_memories
from src.nodes.store_memory import store_memory_node


def route_activity(state: WellnessState) -> str:
    """
    Routing function for conditional edges based on detected activity.

    Examines the suggested_activity field set by detect_activity node
    and routes to the appropriate activity handler or normal response.

    Args:
        state: Current graph state with suggested_activity field

    Returns:
        Name of the node to route to
    """
    activity = state.get("suggested_activity")

    if activity == "breathing":
        return "breathing_exercise"
    # Future activity types:
    # elif activity == "meditation":
    #     return "meditation_guidance"
    # elif activity == "journaling":
    #     return "journaling_prompt"

    # Default: normal conversation response
    return "generate_response"


def build_graph() -> StateGraph:
    """
    Constructs the wellness conversation graph with activity routing.

    Implementation:
    1. Retrieves relevant memories from past conversations
    2. Detects if user needs a wellness activity
    3. Routes to activity handler OR generates normal response
    4. Stores the conversation pair for future retrieval

    Returns:
        A compiled StateGraph ready for execution by LangGraph Deploy.

    Graph Visualization:

        ┌─────────┐
        │  START  │
        └────┬────┘
             │
             ▼
    ┌─────────────────────┐
    │  retrieve_memories  │  ← Fast DB query (~50ms)
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │   detect_activity   │  ← LLM classification
    └──────────┬──────────┘
               │
        ┌──────┴──────┐
        │  suggested  │
        │  activity?  │
        └──────┬──────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│breathing│ │  ...  │ │generate│
│exercise │ │(future)│ │response│
└────┬────┘ └────┬───┘ └───┬────┘
     │           │         │
     └───────────┴─────────┘
               │
               ▼
    ┌─────────────────────┐
    │    store_memory     │
    └──────────┬──────────┘
               │
               ▼
         ┌─────────┐
         │   END   │
         └─────────┘
    """
    # Create the graph builder with our state type
    builder = StateGraph(WellnessState)

    # -------------------------------------------------------------------------
    # Add Nodes
    # -------------------------------------------------------------------------

    # Memory retrieval - searches for relevant past conversations
    builder.add_node("retrieve_memories", retrieve_memories)

    # Activity detection - classifies if user needs an activity
    builder.add_node("detect_activity", detect_activity_intent)

    # Main response generation - the core of the conversation
    builder.add_node("generate_response", generate_response)

    # Breathing exercise - interactive breathing with HITL
    builder.add_node("breathing_exercise", run_breathing_exercise)

    # Memory storage - persists the conversation for future retrieval
    builder.add_node("store_memory", store_memory_node)

    # -------------------------------------------------------------------------
    # Define Edges (Flow)
    # -------------------------------------------------------------------------

    # Entry point: first retrieve relevant memories
    builder.set_entry_point("retrieve_memories")

    # After memories, detect if activity is needed
    builder.add_edge("retrieve_memories", "detect_activity")

    # Conditional routing based on detected activity
    builder.add_conditional_edges(
        "detect_activity",
        route_activity,
        {
            "breathing_exercise": "breathing_exercise",
            "generate_response": "generate_response",
        },
    )

    # All response paths lead to memory storage
    builder.add_edge("generate_response", "store_memory")
    builder.add_edge("breathing_exercise", "store_memory")

    # After storing memory, end the turn
    builder.add_edge("store_memory", END)

    # -------------------------------------------------------------------------
    # Compile and Return
    # -------------------------------------------------------------------------

    return builder


# Compile the graph for LangGraph Deploy
# This is the object referenced in langgraph.json
graph = build_graph().compile()
