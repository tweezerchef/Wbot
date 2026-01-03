"""
============================================================================
Tests for Memory Nodes
============================================================================
Integration tests for LangGraph memory nodes.

Tests:
- retrieve_memories node: Semantic search integration
- store_memory_node: Memory persistence integration
============================================================================
"""

import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.messages import AIMessage, HumanMessage

# Mock problematic imports to break circular dependencies
sys.modules['src.nodes.generate_response'] = MagicMock()
sys.modules['src.graph'] = MagicMock()
sys.modules['src.graph.wellness'] = MagicMock()
sys.modules['src.graph.state'] = MagicMock()

from src.nodes.retrieve_memories.node import retrieve_memories
from src.nodes.store_memory.node import store_memory_node


# =============================================================================
# retrieve_memories Node Tests
# =============================================================================


@pytest.mark.asyncio
async def test_retrieve_memories_returns_empty_when_unauthenticated():
    """retrieve_memories should return empty list when no user_id."""
    state = {
        "messages": [HumanMessage(content="Hello")],
        "user_context": {},  # No user_id
    }

    result = await retrieve_memories(state)

    assert result == {"retrieved_memories": []}


@pytest.mark.asyncio
async def test_retrieve_memories_returns_empty_when_no_messages():
    """retrieve_memories should return empty list when no user messages."""
    state = {
        "messages": [AIMessage(content="Hello")],  # Only AI message
        "user_context": {"user_id": "user-1"},
    }

    result = await retrieve_memories(state)

    assert result == {"retrieved_memories": []}


@pytest.mark.asyncio
async def test_retrieve_memories_returns_with_similarity_scores():
    """retrieve_memories should return memories with similarity scores."""
    with patch("src.nodes.retrieve_memories.node.search_memories") as mock_search:
        # Setup mock
        from src.memory.store import Memory

        mock_memories = [
            Memory(
                id="mem-1",
                user_message="I'm stressed",
                ai_response="Let's breathe",
                similarity=0.85,
                created_at="2025-01-01T00:00:00Z",
                metadata={},
            )
        ]
        mock_search.return_value = mock_memories

        state = {
            "messages": [HumanMessage(content="I feel anxious")],
            "user_context": {"user_id": "user-1"},
        }

        result = await retrieve_memories(state)

        # Verify memories returned with similarity
        assert len(result["retrieved_memories"]) == 1
        memory = result["retrieved_memories"][0]
        assert memory["id"] == "mem-1"
        assert memory["similarity"] == 0.85


@pytest.mark.asyncio
async def test_retrieve_memories_searches_latest_user_message():
    """retrieve_memories should search using the latest user message."""
    with patch("src.nodes.retrieve_memories.node.search_memories") as mock_search:
        mock_search.return_value = []

        state = {
            "messages": [
                HumanMessage(content="First message"),
                AIMessage(content="Response"),
                HumanMessage(content="Latest message"),
            ],
            "user_context": {"user_id": "user-1"},
        }

        await retrieve_memories(state)

        # Verify searched with latest user message
        mock_search.assert_called_once()
        call_args = mock_search.call_args
        assert call_args[1]["query"] == "Latest message"


@pytest.mark.asyncio
async def test_retrieve_memories_error_returns_empty():
    """retrieve_memories should return empty list on errors."""
    with patch("src.nodes.retrieve_memories.node.search_memories") as mock_search:
        # Simulate error
        mock_search.side_effect = Exception("DB error")

        state = {
            "messages": [HumanMessage(content="Hello")],
            "user_context": {"user_id": "user-1"},
        }

        # Should not raise, returns empty
        result = await retrieve_memories(state)
        assert result == {"retrieved_memories": []}


# =============================================================================
# store_memory_node Tests
# =============================================================================


@pytest.mark.asyncio
async def test_store_memory_extracts_message_pair():
    """store_memory_node should extract latest user/AI message pair."""
    with patch("src.nodes.store_memory.node.save_messages"), patch(
        "src.nodes.store_memory.node.store_memory"
    ) as mock_store, patch("src.nodes.store_memory.node.generate_title_if_needed"):
        state = {
            "messages": [
                HumanMessage(content="I'm stressed"),
                AIMessage(content="Let's breathe"),
            ],
            "user_context": {"user_id": "user-1"},
        }
        config = {"configurable": {"thread_id": "conv-1"}}

        await store_memory_node(state, config)

        # Verify store_memory called with correct messages
        mock_store.assert_called_once()
        call_args = mock_store.call_args
        assert call_args[1]["user_message"] == "I'm stressed"
        assert call_args[1]["ai_response"] == "Let's breathe"


@pytest.mark.asyncio
async def test_store_memory_calls_save_and_store():
    """store_memory_node should call both save_messages and store_memory."""
    with patch("src.nodes.store_memory.node.save_messages") as mock_save, patch(
        "src.nodes.store_memory.node.store_memory"
    ) as mock_store, patch("src.nodes.store_memory.node.generate_title_if_needed"):
        mock_store.return_value = "mem-123"

        state = {
            "messages": [
                HumanMessage(content="Hello"),
                AIMessage(content="Hi"),
            ],
            "user_context": {"user_id": "user-1"},
        }
        config = {"configurable": {"thread_id": "conv-1"}}

        await store_memory_node(state, config)

        # Both should be called
        mock_save.assert_called_once()
        mock_store.assert_called_once()


@pytest.mark.asyncio
async def test_store_memory_generates_title():
    """store_memory_node should generate conversation title if needed."""
    with patch("src.nodes.store_memory.node.save_messages"), patch(
        "src.nodes.store_memory.node.store_memory"
    ), patch("src.nodes.store_memory.node.generate_title_if_needed") as mock_title:
        state = {
            "messages": [
                HumanMessage(content="First message"),
                AIMessage(content="Response"),
            ],
            "user_context": {"user_id": "user-1"},
        }
        config = {"configurable": {"thread_id": "conv-1"}}

        await store_memory_node(state, config)

        # Verify title generation was called
        mock_title.assert_called_once_with("conv-1")


@pytest.mark.asyncio
async def test_store_memory_returns_empty_dict():
    """store_memory_node should return empty dict (no state changes)."""
    with patch("src.nodes.store_memory.node.save_messages"), patch(
        "src.nodes.store_memory.node.store_memory"
    ), patch("src.nodes.store_memory.node.generate_title_if_needed"):
        state = {
            "messages": [
                HumanMessage(content="Hi"),
                AIMessage(content="Hello"),
            ],
            "user_context": {"user_id": "user-1"},
        }
        config = {"configurable": {"thread_id": "conv-1"}}

        result = await store_memory_node(state, config)

        # Should return empty dict (side-effect only node)
        assert result == {}


@pytest.mark.asyncio
async def test_store_memory_skips_when_no_user_id():
    """store_memory_node should skip storage when unauthenticated."""
    with patch("src.nodes.store_memory.node.save_messages") as mock_save, patch(
        "src.nodes.store_memory.node.store_memory"
    ) as mock_store:
        state = {
            "messages": [HumanMessage(content="Hi"), AIMessage(content="Hello")],
            "user_context": {},  # No user_id
        }
        config = {"configurable": {"thread_id": "conv-1"}}

        result = await store_memory_node(state, config)

        # Should return empty without calling storage functions
        assert result == {}
        mock_save.assert_not_called()
        mock_store.assert_not_called()


@pytest.mark.asyncio
async def test_store_memory_skips_when_no_message_pair():
    """store_memory_node should skip when no complete message pair."""
    with patch("src.nodes.store_memory.node.save_messages") as mock_save, patch(
        "src.nodes.store_memory.node.store_memory"
    ) as mock_store:
        state = {
            "messages": [HumanMessage(content="Only one message")],
            "user_context": {"user_id": "user-1"},
        }
        config = {"configurable": {"thread_id": "conv-1"}}

        result = await store_memory_node(state, config)

        # Should skip storage
        assert result == {}
        mock_save.assert_not_called()
        mock_store.assert_not_called()


@pytest.mark.asyncio
async def test_store_memory_handles_save_errors_gracefully():
    """store_memory_node should not fail if save_messages errors."""
    with patch("src.nodes.store_memory.node.save_messages") as mock_save, patch(
        "src.nodes.store_memory.node.store_memory"
    ) as mock_store, patch("src.nodes.store_memory.node.generate_title_if_needed"):
        # save_messages raises error
        mock_save.side_effect = Exception("DB error")
        mock_store.return_value = "mem-1"

        state = {
            "messages": [HumanMessage(content="Hi"), AIMessage(content="Hello")],
            "user_context": {"user_id": "user-1"},
        }
        config = {"configurable": {"thread_id": "conv-1"}}

        # Should not raise, just logs error
        result = await store_memory_node(state, config)
        assert result == {}


@pytest.mark.asyncio
async def test_store_memory_handles_store_errors_gracefully():
    """store_memory_node should not fail if store_memory errors."""
    with patch("src.nodes.store_memory.node.save_messages"), patch(
        "src.nodes.store_memory.node.store_memory"
    ) as mock_store, patch("src.nodes.store_memory.node.generate_title_if_needed"):
        # store_memory raises error
        mock_store.side_effect = Exception("Embedding error")

        state = {
            "messages": [HumanMessage(content="Hi"), AIMessage(content="Hello")],
            "user_context": {"user_id": "user-1"},
        }
        config = {"configurable": {"thread_id": "conv-1"}}

        # Should not raise, just logs error
        result = await store_memory_node(state, config)
        assert result == {}
