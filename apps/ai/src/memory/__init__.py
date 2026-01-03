"""
============================================================================
Memory Module
============================================================================
Provides semantic memory storage and retrieval for the wellness chatbot.

This module enables the AI to:
1. Store conversation pairs (user message + AI response) with embeddings
2. Search for semantically similar past conversations
3. Inject relevant memories into the system prompt for context

Components:
- embeddings.py: Generates vector embeddings using Gemini
- store.py: Handles storage and retrieval from Supabase

Usage:
    from src.memory import store_memory, search_memories, format_memories_for_prompt

    # Store a conversation pair
    await store_memory(user_id, user_message, ai_response)

    # Search for relevant memories
    memories = await search_memories(user_id, query)

    # Format for system prompt
    context = format_memories_for_prompt(memories)
============================================================================
"""

from src.memory.embeddings import format_memory_text, generate_embedding
from src.memory.store import (
    Memory,
    format_memories_for_prompt,
    search_memories,
    store_memory,
)

__all__ = [
    "Memory",
    "format_memories_for_prompt",
    "format_memory_text",
    "generate_embedding",
    "search_memories",
    "store_memory",
]
