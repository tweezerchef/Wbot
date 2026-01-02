"""
============================================================================
Wellness Conversation Graph
============================================================================
The main LangGraph graph definition for Wbot's wellness chatbot.

Graph Structure (Current - Simple):
    START -> generate_response -> END

Graph Structure (Future - With Activities):
    START -> detect_activity -> [routing decision]
        -> generate_response -> END
        -> breathing_exercise -> END
        -> meditation_guidance -> END
        -> journaling_prompt -> END

This file defines the graph structure and compiles it for deployment.
The compiled `graph` is exported for use by LangGraph Deploy.
============================================================================
"""

from langgraph.graph import END, StateGraph

from src.graph.state import WellnessState
from src.nodes.generate_response import generate_response


def build_graph() -> StateGraph:
    """
    Constructs the wellness conversation graph.

    Current implementation is simple:
    - Receives user message
    - Generates AI response
    - Returns

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
    │  generate_response  │
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

    # Main response generation - the core of the conversation
    builder.add_node("generate_response", generate_response)

    # -------------------------------------------------------------------------
    # Define Edges (Flow)
    # -------------------------------------------------------------------------
    # Edges connect nodes and define the execution order

    # Entry point: when a message arrives, go to generate_response
    builder.set_entry_point("generate_response")

    # After generating a response, end the turn
    builder.add_edge("generate_response", END)

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
