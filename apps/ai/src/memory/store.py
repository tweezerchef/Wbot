"""
============================================================================
Memory Store Module
============================================================================
Handles storage and retrieval of conversation memories in Supabase.

This module provides:
1. Storing new memories with embeddings
2. Searching for relevant past conversations via semantic similarity
3. Formatting memories for injection into system prompts

Security:
- Uses Supabase service role for backend operations (bypasses RLS)
- User isolation enforced via user_id filtering in all queries
- RLS provides additional protection for direct database access
============================================================================
"""

import os
from dataclasses import dataclass

from supabase import Client, create_client

from src.memory.cache import cache_embedding, get_cached_embedding
from src.memory.embeddings import format_memory_text, generate_embedding


@dataclass
class Memory:
    """
    Represents a stored conversation memory.

    Attributes:
        id: Unique identifier
        user_message: The user's original message
        ai_response: The AI's response
        similarity: How similar this memory is to the query (0-1)
        created_at: When the memory was created (ISO format)
        metadata: Additional context (topics, emotional tone, etc.)
    """

    id: str
    user_message: str
    ai_response: str
    similarity: float
    created_at: str
    metadata: dict[str, object]


def get_supabase_client() -> Client:
    """
    Creates a Supabase client for memory operations.

    Uses the service role key to bypass RLS for backend operations.
    User isolation is enforced via user_id filtering in queries.

    Returns:
        Supabase Client instance.

    Raises:
        ValueError: If required environment variables are not set.
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")

    if not url or not key:
        raise ValueError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY are required for memory store. "
            "Set these in your .env file."
        )

    return create_client(url, key)


async def store_memory(
    user_id: str,
    user_message: str,
    ai_response: str,
    conversation_id: str | None = None,
    metadata: dict[str, object] | None = None,
) -> str:
    """
    Stores a conversation pair as a memory with its embedding.

    This function:
    1. Formats the conversation pair into combined text
    2. Generates an embedding using Gemini
    3. Stores everything in the memories table

    Args:
        user_id: The user who owns this memory
        user_message: The user's message
        ai_response: The AI's response
        conversation_id: Optional link to the source conversation
        metadata: Additional context to store (topics, emotions, etc.)

    Returns:
        The ID of the created memory.

    Example:
        >>> memory_id = await store_memory(
        ...     user_id="uuid",
        ...     user_message="I've been stressed at work",
        ...     ai_response="I hear that work has been challenging...",
        ...     metadata={"topics": ["work", "stress"]}
        ... )
    """
    # Format and embed the conversation
    combined_text = format_memory_text(user_message, ai_response)
    embedding = await generate_embedding(combined_text)

    # Prepare the record
    record = {
        "user_id": user_id,
        "user_message": user_message,
        "ai_response": ai_response,
        "combined_text": combined_text,
        "embedding": embedding,  # Will be serialized as JSON array
        "conversation_id": conversation_id,
        "metadata": metadata or {},
    }

    # Insert into Supabase
    supabase = get_supabase_client()
    result = supabase.table("memories").insert(record).execute()

    return result.data[0]["id"]


def save_messages(
    conversation_id: str,
    user_message: str,
    ai_response: str,
) -> None:
    """
    Saves user and AI messages to the messages table.

    This persists the raw conversation for history retrieval and display.
    Called after each AI response to maintain full conversation history.

    Args:
        conversation_id: The conversation this message belongs to
        user_message: The user's message content
        ai_response: The AI's response content

    Note:
        Uses synchronous Supabase client since this is a fire-and-forget operation.
        Errors are logged but don't fail the conversation flow.
    """
    try:
        supabase = get_supabase_client()

        # Insert both messages in a single batch
        messages = [
            {
                "conversation_id": conversation_id,
                "role": "user",
                "content": user_message,
            },
            {
                "conversation_id": conversation_id,
                "role": "assistant",
                "content": ai_response,
            },
        ]

        supabase.table("messages").insert(messages).execute()
    except Exception as e:
        # Fire-and-forget: log but don't raise
        print(f"[memory] Failed to save messages: {e}")


async def search_memories(
    user_id: str,
    query: str,
    limit: int = 5,
    similarity_threshold: float = 0.5,
) -> list[Memory]:
    """
    Searches for memories similar to the given query.

    Uses cosine similarity on embeddings to find relevant past conversations.
    Results are ordered by similarity, with recency as a tiebreaker.

    Args:
        user_id: The user whose memories to search
        query: The text to search for (usually the current user message)
        limit: Maximum number of memories to return (default 5)
        similarity_threshold: Minimum similarity score 0-1 (default 0.5)

    Returns:
        List of Memory objects ordered by relevance.

    Example:
        >>> memories = await search_memories(
        ...     user_id="uuid",
        ...     query="I'm feeling anxious about my presentation"
        ... )
        >>> for m in memories:
        ...     print(f"{m.similarity:.2f}: {m.user_message[:50]}...")
    """
    # Try to get cached embedding first, fall back to generating
    query_embedding = await get_cached_embedding(user_id, query)
    if query_embedding is None:
        query_embedding = await generate_embedding(query)
        await cache_embedding(user_id, query, query_embedding)

    # Call the Supabase RPC function
    supabase = get_supabase_client()
    result = supabase.rpc(
        "search_memories",
        {
            "p_user_id": user_id,
            "p_embedding": query_embedding,
            "p_limit": limit,
            "p_similarity_threshold": similarity_threshold,
        },
    ).execute()

    # Convert to Memory objects
    return [
        Memory(
            id=row["id"],
            user_message=row["user_message"],
            ai_response=row["ai_response"],
            similarity=row["similarity"],
            created_at=row["created_at"],
            metadata=row.get("metadata") or {},
        )
        for row in result.data
    ]


def format_memories_for_prompt(memories: list[Memory], max_chars: int = 2000) -> str:
    """
    Formats retrieved memories for inclusion in the system prompt.

    Creates a readable summary of past conversations that helps
    the AI maintain continuity and reference shared history.

    Args:
        memories: List of Memory objects to format
        max_chars: Maximum total characters to include (prevents prompt bloat)

    Returns:
        Formatted string for the system prompt, or empty string if no memories.

    Example:
        >>> memories = await search_memories(user_id, query)
        >>> context = format_memories_for_prompt(memories)
        >>> # Include in system prompt
    """
    if not memories:
        return ""

    lines = ["## Relevant Past Conversations\n"]
    lines.append(
        "The following are excerpts from previous conversations with this user "
        "that may be relevant to the current discussion:\n"
    )

    total_chars = sum(len(line) for line in lines)

    for i, memory in enumerate(memories, 1):
        # Format this memory
        memory_lines = [
            f"### Memory {i} (Relevance: {memory.similarity:.0%})",
            f"**User said:** {memory.user_message}",
        ]

        # Truncate long AI responses
        ai_response = memory.ai_response
        if len(ai_response) > 300:
            ai_response = ai_response[:300] + "..."
        memory_lines.append(f"**You responded:** {ai_response}")
        memory_lines.append("")

        memory_text = "\n".join(memory_lines)

        # Check if adding this would exceed max_chars
        if total_chars + len(memory_text) > max_chars:
            break

        lines.extend(memory_lines)
        total_chars += len(memory_text)

    lines.append(
        "Use this context naturally - don't explicitly mention 'our previous "
        "conversations' unless it's relevant and helpful.\n"
    )

    return "\n".join(lines)


def generate_title_if_needed(conversation_id: str) -> str | None:
    """
    Generates a title for a conversation if one doesn't exist.

    Calls the database RPC function to auto-generate a title from the
    first user message. Truncates to 50 characters with ellipsis.

    This should be called after the first message pair is saved to ensure
    the conversation has a meaningful title for display in history.

    Args:
        conversation_id: The conversation UUID to generate title for

    Returns:
        The generated title, or None if already exists or no messages yet

    Example:
        >>> title = generate_title_if_needed("uuid-here")
        >>> print(title)  # "I've been feeling stressed about..."
    """
    if not conversation_id:
        return None

    try:
        supabase = get_supabase_client()
        result = supabase.rpc(
            "generate_conversation_title",
            {"p_conversation_id": conversation_id},
        ).execute()

        return result.data
    except Exception as e:
        # Log but don't fail - title is not critical
        print(f"[store] Error generating title: {e}")
        return None
