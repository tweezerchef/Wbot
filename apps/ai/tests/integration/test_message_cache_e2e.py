"""
============================================================================
End-to-End Tests for Message Cache
============================================================================
Integration tests verifying the full message persistence flow:
1. Write messages to Supabase via save_messages()
2. Verify messages are cached in shared Redis
3. Read messages back via get_cached_messages()
4. Verify data integrity (IDs, content, timestamps match)

These tests verify that the frontend and backend see the same cached data.

Prerequisites:
- REDIS_SHARED_URL must point to Upstash (shared Redis)
- SUPABASE_URL and SUPABASE_SERVICE_KEY must be configured (for save_messages)

Run with:
    cd apps/ai
    uv run pytest tests/integration/test_message_cache_e2e.py -v
============================================================================
"""

import os
import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

import src.memory.cache as cache_module
from src.memory.cache import (
    append_messages,
    get_cached_messages,
    get_shared_redis_client,
    invalidate_conversation_cache,
)

# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture(autouse=True)
def reset_redis_pools():
    """Reset Redis connection pools before each test to avoid event loop issues."""
    # Reset the global pools so each test gets a fresh connection
    cache_module._redis_pool = None
    cache_module._shared_redis_pool = None
    yield
    # Also reset after test
    cache_module._redis_pool = None
    cache_module._shared_redis_pool = None


@pytest.fixture
def conversation_id() -> str:
    """Generate a unique conversation ID for each test."""
    return f"test-e2e-{uuid.uuid4().hex[:12]}"


@pytest.fixture
def sample_messages() -> list[dict[str, str]]:
    """Generate sample messages in the expected format."""
    now = datetime.now(UTC).isoformat().replace("+00:00", "Z")
    return [
        {
            "id": str(uuid.uuid4()),
            "role": "user",
            "content": "Hello, I'm feeling stressed today.",
            "created_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": "I'm sorry to hear that. Would you like to try a breathing exercise?",
            "created_at": now,
        },
    ]


@pytest.fixture
async def cleanup_cache(conversation_id: str):
    """Cleanup cache after test."""
    yield
    # Cleanup after test
    await invalidate_conversation_cache(conversation_id)


# =============================================================================
# Shared Redis Connection Tests
# =============================================================================


@pytest.mark.asyncio
async def test_shared_redis_connection() -> None:
    """Verify shared Redis (Upstash) connection is available."""
    redis_url = os.getenv("REDIS_SHARED_URL")

    if not redis_url:
        pytest.skip("REDIS_SHARED_URL not configured - skipping E2E test")

    client = await get_shared_redis_client()
    assert client is not None, "Failed to connect to shared Redis"

    # Verify it's actually working
    pong = await client.ping()
    assert pong is True


# =============================================================================
# Cache Write Tests
# =============================================================================


@pytest.mark.asyncio
async def test_append_messages_to_cache(
    conversation_id: str,
    sample_messages: list[dict[str, str]],
    cleanup_cache: None,
) -> None:
    """Test that messages can be appended to the shared cache."""
    redis_url = os.getenv("REDIS_SHARED_URL")
    if not redis_url:
        pytest.skip("REDIS_SHARED_URL not configured")

    # Append messages
    result = await append_messages(conversation_id, sample_messages)

    assert result is True, "Failed to append messages to cache"


@pytest.mark.asyncio
async def test_append_messages_incremental(
    conversation_id: str,
    cleanup_cache: None,
) -> None:
    """Test that messages can be incrementally appended."""
    redis_url = os.getenv("REDIS_SHARED_URL")
    if not redis_url:
        pytest.skip("REDIS_SHARED_URL not configured")

    # First batch
    first_batch = [
        {
            "id": str(uuid.uuid4()),
            "role": "user",
            "content": "First message",
            "created_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        },
    ]
    await append_messages(conversation_id, first_batch)

    # Second batch
    second_batch = [
        {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": "Second message",
            "created_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        },
    ]
    await append_messages(conversation_id, second_batch)

    # Verify all messages are present
    cached = await get_cached_messages(conversation_id)
    assert cached is not None
    assert len(cached) == 2
    assert cached[0]["content"] == "First message"
    assert cached[1]["content"] == "Second message"


# =============================================================================
# Cache Read Tests
# =============================================================================


@pytest.mark.asyncio
async def test_get_cached_messages(
    conversation_id: str,
    sample_messages: list[dict[str, str]],
    cleanup_cache: None,
) -> None:
    """Test that cached messages can be retrieved."""
    redis_url = os.getenv("REDIS_SHARED_URL")
    if not redis_url:
        pytest.skip("REDIS_SHARED_URL not configured")

    # Setup: append messages first
    await append_messages(conversation_id, sample_messages)

    # Test retrieval
    cached = await get_cached_messages(conversation_id)

    assert cached is not None, "Cache returned None (expected messages)"
    assert len(cached) == len(sample_messages)


@pytest.mark.asyncio
async def test_cache_miss_returns_none(conversation_id: str) -> None:
    """Test that cache miss returns None."""
    redis_url = os.getenv("REDIS_SHARED_URL")
    if not redis_url:
        pytest.skip("REDIS_SHARED_URL not configured")

    # Non-existent conversation
    result = await get_cached_messages(f"nonexistent-{uuid.uuid4().hex[:8]}")

    assert result is None


# =============================================================================
# Data Integrity Tests
# =============================================================================


@pytest.mark.asyncio
async def test_message_content_integrity(
    conversation_id: str,
    sample_messages: list[dict[str, str]],
    cleanup_cache: None,
) -> None:
    """Test that message content is preserved correctly."""
    redis_url = os.getenv("REDIS_SHARED_URL")
    if not redis_url:
        pytest.skip("REDIS_SHARED_URL not configured")

    # Setup
    await append_messages(conversation_id, sample_messages)

    # Retrieve
    cached = await get_cached_messages(conversation_id)

    # Verify content matches
    for original, retrieved in zip(sample_messages, cached, strict=True):
        assert retrieved["id"] == original["id"], "Message ID mismatch"
        assert retrieved["role"] == original["role"], "Message role mismatch"
        assert retrieved["content"] == original["content"], "Message content mismatch"
        assert retrieved["created_at"] == original["created_at"], "Timestamp mismatch"


@pytest.mark.asyncio
async def test_message_order_preserved(
    conversation_id: str,
    cleanup_cache: None,
) -> None:
    """Test that message order is preserved in cache."""
    redis_url = os.getenv("REDIS_SHARED_URL")
    if not redis_url:
        pytest.skip("REDIS_SHARED_URL not configured")

    # Create ordered messages
    messages = [
        {
            "id": f"msg-{i}",
            "role": "user" if i % 2 == 0 else "assistant",
            "content": f"Message {i}",
            "created_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        }
        for i in range(10)
    ]

    # Append all
    await append_messages(conversation_id, messages)

    # Retrieve
    cached = await get_cached_messages(conversation_id)

    # Verify order
    for i, msg in enumerate(cached):
        assert msg["id"] == f"msg-{i}", f"Order mismatch at position {i}"
        assert msg["content"] == f"Message {i}"


# =============================================================================
# Frontend Compatibility Tests
# =============================================================================


@pytest.mark.asyncio
async def test_message_format_compatibility(
    conversation_id: str,
    sample_messages: list[dict[str, str]],
    cleanup_cache: None,
) -> None:
    """Test that cached messages have all fields expected by frontend."""
    redis_url = os.getenv("REDIS_SHARED_URL")
    if not redis_url:
        pytest.skip("REDIS_SHARED_URL not configured")

    # Setup
    await append_messages(conversation_id, sample_messages)

    # Retrieve
    cached = await get_cached_messages(conversation_id)

    # Frontend expects these fields
    required_fields = ["id", "role", "content", "created_at"]

    for msg in cached:
        for field in required_fields:
            assert field in msg, f"Missing required field: {field}"
            assert msg[field] is not None, f"Field {field} is None"


@pytest.mark.asyncio
async def test_role_values(
    conversation_id: str,
    cleanup_cache: None,
) -> None:
    """Test that role values are correct ('user' or 'assistant')."""
    redis_url = os.getenv("REDIS_SHARED_URL")
    if not redis_url:
        pytest.skip("REDIS_SHARED_URL not configured")

    messages = [
        {
            "id": "msg-1",
            "role": "user",
            "content": "User message",
            "created_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        },
        {
            "id": "msg-2",
            "role": "assistant",
            "content": "Assistant message",
            "created_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        },
    ]

    await append_messages(conversation_id, messages)
    cached = await get_cached_messages(conversation_id)

    valid_roles = {"user", "assistant"}
    for msg in cached:
        assert msg["role"] in valid_roles, f"Invalid role: {msg['role']}"


# =============================================================================
# Cache Invalidation Tests
# =============================================================================


@pytest.mark.asyncio
async def test_invalidate_conversation_cache(
    conversation_id: str,
    sample_messages: list[dict[str, str]],
) -> None:
    """Test that cache invalidation removes messages."""
    redis_url = os.getenv("REDIS_SHARED_URL")
    if not redis_url:
        pytest.skip("REDIS_SHARED_URL not configured")

    # Setup
    await append_messages(conversation_id, sample_messages)

    # Verify cached
    cached = await get_cached_messages(conversation_id)
    assert cached is not None

    # Invalidate
    result = await invalidate_conversation_cache(conversation_id)
    assert result is True

    # Verify removed
    cached_after = await get_cached_messages(conversation_id)
    assert cached_after is None


# =============================================================================
# Full Flow Integration Test
# =============================================================================


@pytest.mark.asyncio
async def test_full_save_and_retrieve_flow(
    conversation_id: str,
    cleanup_cache: None,
) -> None:
    """
    Test the full message persistence flow that happens in production:
    1. save_messages() writes to Supabase and appends to cache
    2. Frontend reads via get_cached_messages()

    This test mocks Supabase but uses real shared Redis.
    """
    redis_url = os.getenv("REDIS_SHARED_URL")
    if not redis_url:
        pytest.skip("REDIS_SHARED_URL not configured")

    # Import here to avoid import errors if modules not configured
    from src.memory.store import save_messages

    user_message = "I'm feeling anxious about my presentation tomorrow."
    ai_response = "That's understandable. Let's work through some calming techniques together."

    # Mock Supabase to avoid real database calls
    # Use MagicMock for sync parts, AsyncMock only for async execute()
    mock_client = MagicMock()

    # Create the result object that execute() returns
    # Must include all fields that save_messages() reads from the result
    mock_result = MagicMock()
    mock_result.data = [
        {
            "id": "msg-user-123",
            "role": "user",
            "content": user_message,
            "created_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        },
        {
            "id": "msg-ai-123",
            "role": "assistant",
            "content": ai_response,
            "created_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        },
    ]

    # Chain: client.table().insert().execute() -> result
    # table() and insert() are sync, execute() is async
    mock_execute = AsyncMock(return_value=mock_result)
    mock_client.table.return_value.insert.return_value.execute = mock_execute

    async def mock_get_client():
        return mock_client

    with patch("src.memory.store.get_async_supabase_client", mock_get_client):
        # Call save_messages (this should also append to cache)
        result = await save_messages(
            conversation_id=conversation_id,
            user_message=user_message,
            ai_response=ai_response,
        )

        # save_messages returns tuple (supabase_success, cache_success)
        supabase_success, _cache_success = result
        assert supabase_success is True, "Supabase insert failed"

    # Now verify cache has the messages (this is what frontend would read)
    cached = await get_cached_messages(conversation_id)

    assert cached is not None, "Cache should have messages after save_messages()"
    assert len(cached) == 2, "Should have 2 messages (user + assistant)"

    # Verify content
    user_msg = next((m for m in cached if m["role"] == "user"), None)
    ai_msg = next((m for m in cached if m["role"] == "assistant"), None)

    assert user_msg is not None, "User message not found in cache"
    assert ai_msg is not None, "Assistant message not found in cache"

    assert user_msg["content"] == user_message
    assert ai_msg["content"] == ai_response
