"""
============================================================================
Store Memory Node
============================================================================
Stores the conversation pair as a memory after generating a response.

This node runs AFTER generate_response to persist the conversation
for future semantic search retrieval.
============================================================================
"""

from src.nodes.store_memory.node import store_memory_node

__all__ = ["store_memory_node"]
