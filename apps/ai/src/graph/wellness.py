"""
============================================================================
Wellness Conversation Graph
============================================================================
The main LangGraph graph definition for Wbot's wellness chatbot.

Graph Structure (Non-Blocking Parallel Execution):
    START -> [parallel paths]
        Path 1: retrieve_memories -> [memory-dependent nodes only]
        Path 2: inject_user_context -> prepare_routing (barrier)
        Path 3: detect_activity -----^

    Routing (from barrier):
        -> breathing_exercise (immediate, no memory wait) -> store_memory -> END
        -> generate_response (waits for memories) -> store_memory -> END
        -> generate_meditation_script (waits for memories) -> store_memory -> END

    Key Design:
    - retrieve_memories runs independently from START (non-blocking)
    - Only memory-dependent nodes wait for retrieve_memories
    - breathing_exercise routes immediately (doesn't use memories)

    Parallel Nodes (run simultaneously from START):
    - retrieve_memories: Semantic search (~50ms), feeds to memory-dependent nodes
    - inject_user_context: Injects auth user info into state
    - detect_activity: LLM-based activity classification

    Activity Nodes:
    - generate_response: Waits for memories, streams AI response
    - breathing_exercise: Routes immediately, no memory dependency
    - generate_meditation_script: Waits for memories, personalized meditation
    - store_memory: Stores conversation pair
    - analyze_profile: Analyzes conversation, updates wellness profile (post-response)

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

    if activity == "breathing":
        return "breathing_exercise"
    elif activity == "meditation":
        return "generate_meditation_script"
    # Future activity types:
    # elif activity == "journaling":
    #     return "journaling_prompt"

    # Default: normal conversation response
    return "generate_response"


async def prepare_routing(state: WellnessState) -> dict:
    """
    Barrier node for routing decision synchronization.

    Ensures inject_user_context and detect_activity complete before routing.
    retrieve_memories is NOT part of this barrier - it runs independently
    and feeds directly to memory-dependent nodes (generate_response, meditation).

    This node does not modify state - it only serves as a synchronization point.
    """
    return {}


def build_graph() -> StateGraph:
    """
    Constructs the wellness conversation graph with non-blocking parallel execution.

    Implementation (Non-Blocking Parallel Pattern):
    1. Fan-out from START: Three parallel paths
       - retrieve_memories: Independent path to memory-dependent nodes
       - inject_user_context + detect_activity: Routing path to barrier
    2. Barrier: Only routing-relevant nodes converge (NOT retrieve_memories)
    3. Conditional routing to activity handlers
       - breathing_exercise: Routes immediately (no memory wait)
       - generate_response/meditation: Wait for memories
    4. Store conversation pair

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
           │                └────────┬────────┘
           │                         ▼
           │             ┌───────────────────────┐
           │             │    prepare_routing    │ ← Barrier (NO memory wait)
           │             └──────────┬────────────┘
           │                        │ routing
           │         ┌──────────────┼──────────────┐
           │         │              │              │
           │         ▼              │              ▼
           │    ┌────────┐          │        ┌────────────┐
           │    │breathing│          │        │  generate  │◄──┐
           │    │exercise │          │        │  response  │   │
           │    └────┬────┘          │        └─────┬──────┘   │
           │         │               │              │          │
           │         │               ▼              │          │
           │         │        ┌────────────┐        │          │
           │         │        │ meditation │◄───────┼──────────┤
           │         │        │   script   │        │          │
           │         │        └─────┬──────┘        │          │
           │         │              │               │          │
           └─────────┼──────────────┼───────────────┘          │
                     │              │         (memory edges)───┘
                     └──────────────┴────────────┘
                                    │
                                    ▼
                     ┌─────────────────────┐
                     │    store_memory     │
                     └──────────┬──────────┘
                                │
                                ▼
                     ┌─────────────────────┐
                     │   analyze_profile   │  ← Zero latency (post-response)
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

    # Memory storage - persists the conversation for future retrieval
    builder.add_node("store_memory", store_memory_node)

    # Profile analysis - analyzes conversation and updates user wellness profile
    # Runs AFTER store_memory (zero latency impact on user experience)
    builder.add_node("analyze_profile", analyze_profile)

    # Barrier node for parallel branch convergence
    builder.add_node("prepare_routing", prepare_routing)

    # -------------------------------------------------------------------------
    # Define Edges (Flow) - Non-Blocking Parallel Execution Pattern
    # -------------------------------------------------------------------------

    # Fan-out from START: Three parallel paths
    # - retrieve_memories: Independent path, feeds directly to memory-dependent nodes
    # - inject_user_context + detect_activity: Routing path, converge at barrier
    builder.add_edge(START, "retrieve_memories")
    builder.add_edge(START, "inject_user_context")
    builder.add_edge(START, "detect_activity")

    # Routing convergence - only routing-relevant nodes wait at barrier
    # Memory retrieval is NOT part of this barrier (non-blocking)
    builder.add_edge("inject_user_context", "prepare_routing")
    builder.add_edge("detect_activity", "prepare_routing")

    # Conditional routing based on detected activity (from barrier node)
    builder.add_conditional_edges(
        "prepare_routing",
        route_activity,
        {
            "breathing_exercise": "breathing_exercise",
            "generate_meditation_script": "generate_meditation_script",
            "generate_response": "generate_response",
        },
    )

    # Memory-dependent nodes wait for BOTH routing AND memory retrieval
    # These edges create a join: node waits for all incoming edges
    # breathing_exercise does NOT have this edge - it routes immediately
    builder.add_edge("retrieve_memories", "generate_response")
    builder.add_edge("retrieve_memories", "generate_meditation_script")

    # All response paths lead to memory storage
    builder.add_edge("generate_response", "store_memory")
    builder.add_edge("breathing_exercise", "store_memory")
    builder.add_edge("generate_meditation_script", "store_memory")

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
