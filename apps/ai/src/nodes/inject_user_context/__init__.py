"""
Inject User Context Node

Reads authenticated user info from LangGraph config and populates
user_context in graph state for downstream nodes.
"""

from .node import inject_user_context

__all__ = ["inject_user_context"]
