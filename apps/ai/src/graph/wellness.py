"""
============================================================================
Wellness Conversation Graph
============================================================================
The main LangGraph graph definition for Wbot's wellness chatbot.

Graph Structure (Parallel Execution with Barrier):
    START -> [three parallel paths]
        - retrieve_memories: Semantic memory search (~50-100ms)
        - inject_user_context: User profile injection
        - detect_activity: LLM-based activity classification (~200ms)

    All paths converge at prepare_routing barrier, then:
        -> breathing_exercise -> store_memory -> analyze_profile -> END
        -> generate_response -> store_memory -> analyze_profile -> END
        -> generate_meditation_script -> store_memory -> analyze_profile -> END

    Key Design:
    - All parallel paths converge at barrier before routing
    - Conditional routing sends to exactly ONE activity node
    - Memories are available in state for any node that needs them
    - detect_activity is the slowest path (~200ms), so memory retrieval
      adds no additional latency to the barrier

    Parallel Nodes (run simultaneously from START):
    - retrieve_memories: Semantic search, stores results in state
    - inject_user_context: Injects auth user info into state
    - detect_activity: LLM-based activity classification

    Activity Nodes (only ONE runs per request):
    - generate_response: Streams AI response with memory context
    - breathing_exercise: Interactive breathing with HITL
    - generate_meditation_script: Personalized meditation with voice selection
    - store_memory: Stores conversation pair
    - analyze_profile: Updates wellness profile (post-response, zero latency impact)

This file defines the graph structure and compiles it for self-hosted deployment.
The compiled `graph` is exported for use by the LangGraph server.
============================================================================
"""

from langgraph.graph import END, START, StateGraph
from langgraph.graph.state import CompiledStateGraph

from src.checkpointer import get_checkpointer, setup_checkpointer
from src.graph.state import WellnessState

# Import directly from node modules to avoid circular imports
# (src/nodes/__init__.py -> src/nodes/generate_response -> src/graph/state -> src/graph/__init__.py -> wellness.py)
from src.nodes.analyze_profile.node import analyze_profile
from src.nodes.breathing_exercise.node import run_breathing_exercise
from src.nodes.detect_activity.node import detect_activity_intent
from src.nodes.generate_meditation_script.node import run_generate_meditation_script
from src.nodes.generate_response.node import generate_response
from src.nodes.inject_user_context.node import inject_user_context
from src.nodes.journaling_prompt.node import provide_journaling_prompt
from src.nodes.retrieve_memories.node import retrieve_memories
from src.nodes.store_memory.node import store_memory_node


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

    # Route to the appropriate activity node
    activity_routes = {
        "breathing": "breathing_exercise",
        "meditation": "generate_meditation_script",
        "journaling": "journaling_prompt",
    }

    return activity_routes.get(activity, "generate_response")


async def prepare_routing(state: WellnessState) -> dict:
    """
    Barrier node for routing decision synchronization.

    Ensures all three parallel paths complete before routing:
    - retrieve_memories: Semantic memory search (available in state)
    - inject_user_context: User profile and preferences
    - detect_activity: Activity classification for routing decision

    This node does not modify state - it only serves as a synchronization point.
    After this barrier, conditional routing sends to exactly ONE activity node.
    """
    return {}


def build_graph() -> StateGraph:
    """
    Constructs the wellness conversation graph with parallel execution and barrier.

    Implementation:
    1. Fan-out from START: Three parallel paths run simultaneously
    2. All paths converge at prepare_routing barrier
    3. Conditional routing sends to exactly ONE activity node
    4. Store conversation pair and analyze profile

    Returns:
        A StateGraph builder for the self-hosted LangGraph server.

    Graph Visualization:

                        ┌─────────┐
                        │  START  │
                        └────┬────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ▼                 ▼                 ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │  retrieve   │  │   inject    │  │   detect    │
    │  memories   │  │user_context │  │  activity   │
    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
           │                │                 │
           └────────────────┼─────────────────┘
                            ▼
                ┌───────────────────────┐
                │    prepare_routing    │ ← All paths converge here
                └──────────┬────────────┘
                           │ conditional routing
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
       ┌────────┐    ┌────────────┐  ┌────────────┐
       │breathing│    │  generate  │  │ meditation │
       │exercise │    │  response  │  │   script   │
       └────┬────┘    └─────┬──────┘  └─────┬──────┘
            │               │               │
            └───────────────┼───────────────┘
                            ▼
                 ┌─────────────────────┐
                 │    store_memory     │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   analyze_profile   │  ← Post-response (zero latency impact)
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

    # User context injection - reads auth info and populates user_context
    # This MUST run first so all downstream nodes have access to user info
    builder.add_node("inject_user_context", inject_user_context)

    # Memory retrieval - searches for relevant past conversations
    builder.add_node("retrieve_memories", retrieve_memories)

    # Activity detection - classifies if user needs an activity
    builder.add_node("detect_activity", detect_activity_intent)

    # Main response generation - the core of the conversation
    builder.add_node("generate_response", generate_response)

    # Breathing exercise - interactive breathing with HITL
    builder.add_node("breathing_exercise", run_breathing_exercise)

    # AI-generated meditation script - personalized meditation with voice selection HITL
    builder.add_node("generate_meditation_script", run_generate_meditation_script)

    # Journaling prompts - reflective writing with HITL confirmation
    builder.add_node("journaling_prompt", provide_journaling_prompt)

    # Memory storage - persists the conversation for future retrieval
    builder.add_node("store_memory", store_memory_node)

    # Profile analysis - analyzes conversation and updates user wellness profile
    # Runs AFTER store_memory (zero latency impact on user experience)
    builder.add_node("analyze_profile", analyze_profile)

    # Barrier node for parallel branch convergence
    builder.add_node("prepare_routing", prepare_routing)

    # -------------------------------------------------------------------------
    # Define Edges (Flow) - Parallel Execution with Barrier Pattern
    # -------------------------------------------------------------------------

    # Fan-out from START: Three parallel paths run simultaneously
    builder.add_edge(START, "retrieve_memories")
    builder.add_edge(START, "inject_user_context")
    builder.add_edge(START, "detect_activity")

    # All parallel paths converge at routing barrier
    # This ensures memories are in state before any activity node runs
    builder.add_edge("retrieve_memories", "prepare_routing")
    builder.add_edge("inject_user_context", "prepare_routing")
    builder.add_edge("detect_activity", "prepare_routing")

    # Conditional routing based on detected activity (from barrier node)
    builder.add_conditional_edges(
        "prepare_routing",
        route_activity,
        {
            "breathing_exercise": "breathing_exercise",
            "generate_meditation_script": "generate_meditation_script",
            "journaling_prompt": "journaling_prompt",
            "generate_response": "generate_response",
        },
    )

    # All activity paths lead to memory storage
    builder.add_edge("generate_response", "store_memory")
    builder.add_edge("breathing_exercise", "store_memory")
    builder.add_edge("generate_meditation_script", "store_memory")
    builder.add_edge("journaling_prompt", "store_memory")

    # After storing memory, analyze the conversation for profile updates
    # This runs after the response is streamed (zero latency impact)
    builder.add_edge("store_memory", "analyze_profile")

    # After profile analysis, end the turn
    builder.add_edge("analyze_profile", END)

    # -------------------------------------------------------------------------
    # Compile and Return
    # -------------------------------------------------------------------------

    return builder


# Compile the graph (stateless version for simple use cases)
# For self-hosted deployments with persistence, use get_compiled_graph() instead
graph = build_graph().compile()


# ============================================================================
# Self-Hosted Graph with PostgreSQL Checkpointing
# ============================================================================
# For self-hosted deployments, use get_compiled_graph() to get a graph
# with persistent state stored in your own Supabase PostgreSQL instance.
# ============================================================================

# Cached compiled graph with checkpointer (lazy initialization)
_compiled_graph_with_checkpointer = None


async def get_compiled_graph() -> "CompiledStateGraph":
    """
    Gets the compiled graph with PostgreSQL checkpointer for self-hosted deployments.

    This function:
    1. Ensures checkpoint tables are initialized (idempotent)
    2. Gets the singleton checkpointer instance
    3. Compiles the graph with the checkpointer

    Use this instead of the `graph` export when self-hosting LangGraph
    and you want conversation state persisted to your Supabase instance.

    Returns:
        Compiled graph with PostgreSQL checkpointing enabled.

    Example:
        # In your server startup
        graph = await get_compiled_graph()

        # Run with automatic state persistence
        result = await graph.ainvoke(
            {"messages": [HumanMessage(content="Hello")]},
            config={"configurable": {"thread_id": "conversation-uuid"}}
        )
    """
    global _compiled_graph_with_checkpointer

    if _compiled_graph_with_checkpointer is None:
        # Ensure checkpoint tables exist (idempotent)
        await setup_checkpointer()

        # Get the checkpointer singleton
        checkpointer = await get_checkpointer()

        # Build and compile with checkpointer
        _compiled_graph_with_checkpointer = build_graph().compile(checkpointer=checkpointer)

    return _compiled_graph_with_checkpointer
