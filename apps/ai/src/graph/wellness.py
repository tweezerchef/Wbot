"""
============================================================================
Wellness Conversation Graph
============================================================================
The main LangGraph graph definition for Wbot's wellness chatbot.

Graph Structure (Current - With Memory):
    START -> retrieve_memories -> generate_response -> store_memory -> END

    - retrieve_memories: Semantic search for relevant past conversations (~50ms)
    - generate_response: Streams AI response to user in real-time
    - store_memory: Stores conversation pair after streaming completes

Graph Structure (Future - With Activities):
    START -> retrieve_memories -> detect_activity -> [routing decision]
        -> generate_response -> store_memory -> END
        -> breathing_exercise -> store_memory -> END
        -> meditation_guidance -> store_memory -> END
        -> journaling_prompt -> store_memory -> END

This file defines the graph structure and compiles it for deployment.
The compiled `graph` is exported for use by LangGraph Deploy.
============================================================================
"""

from langgraph.graph import END, StateGraph

from src.graph.state import WellnessState
from src.nodes.generate_response import generate_response
from src.nodes.retrieve_memories import retrieve_memories
from src.nodes.store_memory import store_memory_node


def build_graph() -> StateGraph:
    """
    Constructs the wellness conversation graph with memory support.

    Current implementation:
    1. Retrieves relevant memories from past conversations
    2. Generates AI response with memory context
    3. Stores the conversation pair for future retrieval

    Future implementation will include:
    - Activity detection routing
    - Conditional branching to activity nodes
    - Activity completion handling

    Returns:
        A compiled StateGraph ready for execution by LangGraph Deploy.

    Graph Visualization (current):

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
    │  generate_response  │  ← Streams tokens to user
    └──────────┬──────────┘
               │
               ▼
    ┌─────────────────────┐
    │    store_memory     │  ← After stream completes
    └──────────┬──────────┘
               │
               ▼
         ┌─────────┐
         │   END   │
         └─────────┘
    """
    # Create the graph builder with our state type
    # WellnessState defines the shape of data flowing through the graph
    builder = StateGraph(WellnessState)

    # -------------------------------------------------------------------------
    # Add Nodes
    # -------------------------------------------------------------------------
    # Each node is a function that processes state and returns updates

    # Memory retrieval - searches for relevant past conversations
    builder.add_node("retrieve_memories", retrieve_memories)

    # Main response generation - the core of the conversation
    builder.add_node("generate_response", generate_response)

    # Memory storage - persists the conversation for future retrieval
    builder.add_node("store_memory", store_memory_node)

    # -------------------------------------------------------------------------
    # Define Edges (Flow)
    # -------------------------------------------------------------------------
    # Edges connect nodes and define the execution order

    # Entry point: first retrieve relevant memories
    builder.set_entry_point("retrieve_memories")

    # After retrieving memories, generate the response
    builder.add_edge("retrieve_memories", "generate_response")

    # After generating response (streaming complete), store the memory
    builder.add_edge("generate_response", "store_memory")

    # After storing memory, end the turn
    builder.add_edge("store_memory", END)

    # -------------------------------------------------------------------------
    # Compile and Return
    # -------------------------------------------------------------------------
    # Compilation creates an executable graph with checkpointing support

    return builder


# Compile the graph for LangGraph Deploy
# This is the object referenced in langgraph.json
graph = build_graph().compile()


# =============================================================================
# Future Graph Structure (for reference)
# =============================================================================
# When activity routing is implemented, the graph will look like this:
#
# def build_graph_with_activities() -> StateGraph:
#     builder = StateGraph(WellnessState)
#
#     # Add all nodes
#     builder.add_node("detect_activity", detect_activity_intent)
#     builder.add_node("generate_response", generate_response)
#     builder.add_node("breathing_exercise", run_breathing_exercise)
#     builder.add_node("meditation_guidance", run_meditation_guidance)
#     builder.add_node("journaling_prompt", provide_journaling_prompt)
#
#     # Entry: first detect if user wants an activity
#     builder.set_entry_point("detect_activity")
#
#     # Conditional routing based on detected activity
#     def route_activity(state: WellnessState) -> str:
#         activity = state.get("suggested_activity")
#         if activity == "breathing":
#             return "breathing_exercise"
#         elif activity == "meditation":
#             return "meditation_guidance"
#         elif activity == "journaling":
#             return "journaling_prompt"
#         else:
#             return "generate_response"
#
#     builder.add_conditional_edges(
#         "detect_activity",
#         route_activity,
#         {
#             "breathing_exercise": "breathing_exercise",
#             "meditation_guidance": "meditation_guidance",
#             "journaling_prompt": "journaling_prompt",
#             "generate_response": "generate_response",
#         }
#     )
#
#     # All nodes end after completing
#     builder.add_edge("generate_response", END)
#     builder.add_edge("breathing_exercise", END)
#     builder.add_edge("meditation_guidance", END)
#     builder.add_edge("journaling_prompt", END)
#
#     return builder
