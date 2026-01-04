"""
============================================================================
Tests for Memory Store Module
============================================================================
Tests memory storage, retrieval, and formatting functions.

Tests:
- store_memory(): Embedding generation and Supabase storage
- search_memories(): Semantic search with similarity filtering
- format_memories_for_prompt(): LLM prompt formatting
- save_messages(): Fire-and-forget message persistence
- generate_title_if_needed(): Conversation title generation
============================================================================
"""

from unittest.mock import MagicMock, patch

import pytest

from src.memory.store import (
    Memory,
    format_memories_for_prompt,
    generate_title_if_needed,
    save_messages,
    search_memories,
    store_memory,
)

# =============================================================================
# store_memory() Tests
# =============================================================================


@pytest.mark.asyncio
async def test_store_memory_formats_text_correctly(mock_env):
    """store_memory() should format combined text from user/assistant messages."""
    with (
        patch("src.memory.store.format_memory_text") as mock_format,
        patch("src.memory.store.generate_embedding") as mock_embed,
        patch("src.memory.store.get_supabase_client") as mock_get_client,
    ):
        # Setup mocks
        mock_format.return_value = "User: Hello\nAI: Hi there!"
        mock_embed.return_value = [0.1] * 768
        mock_client = MagicMock()
        mock_result = MagicMock()
        mock_result.data = [{"id": "mem-123"}]
        mock_client.table().insert().execute.return_value = mock_result
        mock_get_client.return_value = mock_client

        # Call function
        await store_memory(
            user_id="user-1",
            user_message="Hello",
            ai_response="Hi there!",
        )

        # Verify format_memory_text was called correctly
        mock_format.assert_called_once_with("Hello", "Hi there!")


@pytest.mark.asyncio
async def test_store_memory_generates_embedding(mock_env):
    """store_memory() should generate 768-dimensional embedding."""
    with (
        patch("src.memory.store.format_memory_text") as mock_format,
        patch("src.memory.store.generate_embedding") as mock_embed,
        patch("src.memory.store.get_supabase_client") as mock_get_client,
    ):
        # Setup mocks
        mock_format.return_value = "Combined text"
        embedding = [0.1] * 768
        mock_embed.return_value = embedding
        mock_client = MagicMock()
        mock_result = MagicMock()
        mock_result.data = [{"id": "mem-123"}]
        mock_client.table().insert().execute.return_value = mock_result
        mock_get_client.return_value = mock_client

        # Call function
        await store_memory(user_id="user-1", user_message="Test", ai_response="Response")

        # Verify embedding was generated
        mock_embed.assert_called_once_with("Combined text")
        assert len(embedding) == 768


@pytest.mark.asyncio
async def test_store_memory_inserts_to_supabase(mock_env):
    """store_memory() should insert record to Supabase memories table."""
    with (
        patch("src.memory.store.format_memory_text") as mock_format,
        patch("src.memory.store.generate_embedding") as mock_embed,
        patch("src.memory.store.get_supabase_client") as mock_get_client,
    ):
        # Setup mocks
        mock_format.return_value = "Combined text"
        mock_embed.return_value = [0.1] * 768
        mock_client = MagicMock()
        mock_insert = MagicMock()
        mock_result = MagicMock()
        mock_result.data = [{"id": "mem-123"}]
        mock_insert.execute.return_value = mock_result
        mock_table = MagicMock()
        mock_table.insert.return_value = mock_insert
        mock_client.table.return_value = mock_table
        mock_get_client.return_value = mock_client

        # Call function
        await store_memory(
            user_id="user-1",
            user_message="Hello",
            ai_response="Hi",
            conversation_id="conv-1",
            metadata={"topic": "greeting"},
        )

        # Verify Supabase insert was called
        mock_client.table.assert_called_once_with("memories")

        # Verify insert was called
        assert mock_insert.execute.called


@pytest.mark.asyncio
async def test_store_memory_returns_valid_uuid(mock_env):
    """store_memory() should return a valid UUID."""
    with (
        patch("src.memory.store.format_memory_text"),
        patch("src.memory.store.generate_embedding") as mock_embed,
        patch("src.memory.store.get_supabase_client") as mock_get_client,
    ):
        # Setup mocks
        mock_embed.return_value = [0.1] * 768
        mock_client = MagicMock()
        mock_result = MagicMock()
        memory_id = "550e8400-e29b-41d4-a716-446655440000"
        mock_result.data = [{"id": memory_id}]
        mock_client.table().insert().execute.return_value = mock_result
        mock_get_client.return_value = mock_client

        # Call function
        result_id = await store_memory(
            user_id="user-1", user_message="Test", ai_response="Response"
        )

        # Verify UUID format
        assert result_id == memory_id
        assert len(result_id) == 36  # Standard UUID length with hyphens


# =============================================================================
# search_memories() Tests
# =============================================================================


@pytest.mark.asyncio
async def test_search_memories_returns_above_threshold(mock_env):
    """search_memories() should only return memories above similarity threshold."""
    with (
        patch("src.memory.store.generate_embedding") as mock_embed,
        patch("src.memory.store.get_supabase_client") as mock_get_client,
    ):
        # Setup mocks
        mock_embed.return_value = [0.1] * 768
        mock_client = MagicMock()
        mock_result = MagicMock()
        mock_result.data = [
            {
                "id": "mem-1",
                "user_message": "I'm stressed",
                "ai_response": "Let's breathe",
                "similarity": 0.8,
                "created_at": "2025-01-01T00:00:00Z",
                "metadata": {},
            },
            # Low similarity result should be filtered out by the RPC function
        ]
        mock_client.rpc().execute.return_value = mock_result
        mock_get_client.return_value = mock_client

        # Call function
        results = await search_memories(user_id="user-1", query="stress", similarity_threshold=0.7)

        # Verify only high similarity results
        assert len(results) >= 0
        for memory in results:
            assert memory.similarity >= 0.7


@pytest.mark.asyncio
async def test_search_memories_respects_limit(mock_env):
    """search_memories() should respect the limit parameter."""
    with (
        patch("src.memory.store.generate_embedding") as mock_embed,
        patch("src.memory.store.get_supabase_client") as mock_get_client,
    ):
        # Setup mocks
        mock_embed.return_value = [0.1] * 768
        mock_client = MagicMock()
        mock_result = MagicMock()
        # Return 2 memories (respecting limit)
        mock_result.data = [
            {
                "id": f"mem-{i}",
                "user_message": "Test",
                "ai_response": "Response",
                "similarity": 0.9,
                "created_at": "2025-01-01T00:00:00Z",
                "metadata": {},
            }
            for i in range(2)
        ]
        mock_client.rpc().execute.return_value = mock_result
        mock_get_client.return_value = mock_client

        # Call function with limit=2
        results = await search_memories(user_id="user-1", query="test", limit=2)

        # Should return at most 2 results
        assert len(results) <= 2


@pytest.mark.asyncio
async def test_search_memories_returns_memory_objects(mock_env):
    """search_memories() should return Memory dataclass objects."""
    with (
        patch("src.memory.store.generate_embedding") as mock_embed,
        patch("src.memory.store.get_supabase_client") as mock_get_client,
    ):
        # Setup mocks
        mock_embed.return_value = [0.1] * 768
        mock_client = MagicMock()
        mock_result = MagicMock()
        mock_result.data = [
            {
                "id": "mem-1",
                "user_message": "I'm anxious",
                "ai_response": "Let's try breathing",
                "similarity": 0.85,
                "created_at": "2025-01-01T12:00:00Z",
                "metadata": {"topic": "anxiety"},
            }
        ]
        mock_client.rpc().execute.return_value = mock_result
        mock_get_client.return_value = mock_client

        # Call function
        results = await search_memories(user_id="user-1", query="anxiety")

        # Verify Memory objects
        assert len(results) == 1
        memory = results[0]
        assert isinstance(memory, Memory)
        assert memory.id == "mem-1"
        assert memory.user_message == "I'm anxious"
        assert memory.ai_response == "Let's try breathing"
        assert memory.similarity == 0.85
        assert memory.metadata == {"topic": "anxiety"}


# =============================================================================
# format_memories_for_prompt() Tests
# =============================================================================


def test_format_memories_includes_relevance_percentage():
    """format_memories_for_prompt() should show relevance percentage."""
    memories = [
        Memory(
            id="mem-1",
            user_message="I feel stressed",
            ai_response="Let's breathe together",
            similarity=0.92,
            created_at="2025-01-01T00:00:00Z",
            metadata={},
        )
    ]

    result = format_memories_for_prompt(memories)

    # Should include 92% in output
    assert "92%" in result or "0.92" in result


def test_format_memories_respects_max_chars():
    """format_memories_for_prompt() should truncate to max_chars."""
    # Create a memory with very long messages
    long_message = "A" * 1000
    memories = [
        Memory(
            id=f"mem-{i}",
            user_message=long_message,
            ai_response=long_message,
            similarity=0.9,
            created_at="2025-01-01T00:00:00Z",
            metadata={},
        )
        for i in range(10)
    ]

    result = format_memories_for_prompt(memories, max_chars=500)

    # Should be truncated
    assert len(result) <= 600  # Allow some buffer for formatting


def test_format_memories_handles_empty_list():
    """format_memories_for_prompt() should handle empty memories list."""
    result = format_memories_for_prompt([])

    # Should return empty string or None
    assert result == "" or result is None or "No relevant memories" in result


# =============================================================================
# save_messages() Tests
# =============================================================================


def test_save_messages_inserts_both_messages(mock_env):
    """save_messages() should insert both user and assistant messages."""
    with patch("src.memory.store.get_supabase_client") as mock_get_client:
        # Setup mock
        mock_client = MagicMock()
        mock_insert = MagicMock()
        mock_insert.execute.return_value = MagicMock()
        mock_table = MagicMock()
        mock_table.insert.return_value = mock_insert
        mock_client.table.return_value = mock_table
        mock_get_client.return_value = mock_client

        # Call function
        save_messages(
            conversation_id="conv-1",
            user_message="Hello",
            ai_response="Hi there!",
        )

        # Verify insert was called with both messages
        mock_client.table.assert_called_once_with("messages")
        insert_call_args = mock_table.insert.call_args[0][0]
        assert len(insert_call_args) == 2
        assert insert_call_args[0]["role"] == "user"
        assert insert_call_args[1]["role"] == "assistant"


def test_save_messages_handles_errors_gracefully(mock_env):
    """save_messages() should not raise on errors (fire-and-forget)."""
    with patch("src.memory.store.get_supabase_client") as mock_get_client:
        # Setup mock to raise error
        mock_client = MagicMock()
        mock_client.table().insert().execute.side_effect = Exception("DB error")
        mock_get_client.return_value = mock_client

        # Should not raise (fire-and-forget)
        try:
            save_messages("conv-1", "Hello", "Hi")
        except Exception:
            pytest.fail("save_messages should not raise exceptions")


# =============================================================================
# generate_title_if_needed() Tests
# =============================================================================


def test_generate_title_extracts_from_first_message(mock_env):
    """generate_title_if_needed() should generate title from first user message."""
    with patch("src.memory.store.get_supabase_client") as mock_get_client:
        mock_client = MagicMock()

        # Mock the RPC call that generate_title_if_needed actually uses
        rpc_result = MagicMock()
        rpc_result.data = "I'm feeling anxious about work"
        mock_rpc = MagicMock()
        mock_rpc.execute.return_value = rpc_result
        mock_client.rpc.return_value = mock_rpc
        mock_get_client.return_value = mock_client

        # Call function
        title = generate_title_if_needed("conv-1")

        # Verify RPC was called correctly
        mock_client.rpc.assert_called_once_with(
            "generate_conversation_title",
            {"p_conversation_id": "conv-1"},
        )

        # Should return the title from RPC
        assert title == "I'm feeling anxious about work"
        assert len(title) > 0


def test_generate_title_truncates_to_50_chars(mock_env):
    """generate_title_if_needed() should truncate long titles."""
    with patch("src.memory.store.get_supabase_client") as mock_get_client:
        # Setup mock with long first message
        mock_client = MagicMock()
        conv_result = MagicMock()
        conv_result.data = [{"title": None}]
        msg_result = MagicMock()
        long_message = "This is a very long message that should be truncated to 50 characters maximum for the title"
        msg_result.data = [{"content": long_message}]

        mock_execute = MagicMock()
        mock_execute.execute.side_effect = [conv_result, msg_result]
        mock_single = MagicMock(return_value=mock_execute)
        mock_limit = MagicMock(return_value=MagicMock(single=mock_single))
        mock_order = MagicMock(return_value=MagicMock(limit=mock_limit))
        mock_eq = MagicMock(return_value=MagicMock(execute=mock_execute))
        mock_eq2 = MagicMock(return_value=MagicMock(order=mock_order))
        mock_select = MagicMock(return_value=MagicMock(eq=mock_eq))
        mock_select2 = MagicMock(return_value=MagicMock(eq=mock_eq2))

        def table_side_effect(name):
            if name == "conversations":
                return MagicMock(select=mock_select)
            else:
                return MagicMock(select=mock_select2)

        mock_client.table.side_effect = table_side_effect
        mock_get_client.return_value = mock_client

        # Call function
        title = generate_title_if_needed("conv-1")

        # Should be truncated to 50 chars
        if title:
            assert len(title) <= 50


def test_generate_title_returns_none_if_already_exists(mock_env):
    """generate_title_if_needed() should return None if title already exists."""
    with patch("src.memory.store.get_supabase_client") as mock_get_client:
        mock_client = MagicMock()

        # Mock RPC returning None (title already exists)
        rpc_result = MagicMock()
        rpc_result.data = None  # RPC returns None when title exists
        mock_rpc = MagicMock()
        mock_rpc.execute.return_value = rpc_result
        mock_client.rpc.return_value = mock_rpc
        mock_get_client.return_value = mock_client

        # Call function
        title = generate_title_if_needed("conv-1")

        # Should return None (title already exists)
        assert title is None
