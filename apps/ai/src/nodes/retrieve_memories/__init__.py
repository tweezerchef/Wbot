"""
============================================================================
Retrieve Memories Node
============================================================================
Searches for relevant past conversations before generating a response.

This node runs BEFORE generate_response to provide context from past
conversations that may be relevant to the current discussion.
============================================================================
"""

from src.nodes.retrieve_memories.node import retrieve_memories

__all__ = ["retrieve_memories"]
