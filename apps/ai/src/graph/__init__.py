"""
Graph module - LangGraph conversation graphs.

Note: The graph is NOT imported here to avoid circular imports with nodes.
Import directly from the wellness module:
    from src.graph.wellness import graph

For self-hosted deployments, the graph is accessed via langgraph.json pointing
to src.graph.wellness:graph (or use get_compiled_graph() for persistent checkpointing)
"""

__all__: list[str] = []
