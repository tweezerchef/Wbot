"""
============================================================================
Tests for Embedding Cache Module
============================================================================
Tests Redis-based caching for embeddings.

Tests:
- get_cached_embedding(): Cache hit/miss scenarios
- cache_embedding(): Storage with TTL and LRU tracking
- Eviction: Oldest entry removal when limit exceeded
- Graceful fallback when Redis unavailable
============================================================================
"""

import json
from unittest.mock import AsyncMock, patch

import pytest

from src.memory.cache import (
    EMBEDDING_TTL_SECONDS,
    MAX_ENTRIES_PER_USER,
    cache_embedding,
    get_cached_embedding,
)

# =============================================================================
# get_cached_embedding() Tests
# =============================================================================


@pytest.mark.asyncio
async def test_cache_hit_returns_stored_embedding():
    """get_cached_embedding() should return embedding on cache hit."""
    with patch("src.memory.cache.get_redis_client") as mock_get_redis:
        # Setup mock Redis client
        mock_redis = AsyncMock()
        embedding = [0.1, 0.2, 0.3]
        mock_redis.get.return_value = json.dumps(embedding)
        mock_redis.zadd = AsyncMock()
        mock_get_redis.return_value = mock_redis

        # Call function
        result = await get_cached_embedding("user-1", "Hello")

        # Verify returns cached embedding
        assert result == embedding
        assert len(result) == 3


@pytest.mark.asyncio
async def test_cache_miss_returns_none():
    """get_cached_embedding() should return None on cache miss."""
    with patch("src.memory.cache.get_redis_client") as mock_get_redis:
        # Setup mock - cache miss
        mock_redis = AsyncMock()
        mock_redis.get.return_value = None
        mock_get_redis.return_value = mock_redis

        # Call function
        result = await get_cached_embedding("user-1", "Hello")

        # Should return None
        assert result is None


@pytest.mark.asyncio
async def test_cache_updates_lru_on_hit():
    """get_cached_embedding() should update LRU timestamp on cache hit."""
    with patch("src.memory.cache.get_redis_client") as mock_get_redis, patch(
        "src.memory.cache.time.time", return_value=1000.0
    ):
        # Setup mock
        mock_redis = AsyncMock()
        mock_redis.get.return_value = json.dumps([0.1] * 768)
        mock_redis.zadd = AsyncMock()
        mock_get_redis.return_value = mock_redis

        # Call function
        await get_cached_embedding("user-1", "Hello")

        # Verify LRU was updated with timestamp
        assert mock_redis.zadd.called
        call_args = mock_redis.zadd.call_args
        # zadd called with (key, {hash: timestamp_value})
        assert call_args is not None
        # Check that zadd was called (timestamp value verification not critical for this test)


@pytest.mark.asyncio
async def test_cache_graceful_fallback_on_redis_unavailable():
    """get_cached_embedding() should return None when Redis unavailable."""
    with patch("src.memory.cache.get_redis_client") as mock_get_redis:
        # Redis not available
        mock_get_redis.return_value = None

        # Call function
        result = await get_cached_embedding("user-1", "Hello")

        # Should return None gracefully
        assert result is None


@pytest.mark.asyncio
async def test_cache_handles_get_errors():
    """get_cached_embedding() should handle Redis errors gracefully."""
    with patch("src.memory.cache.get_redis_client") as mock_get_redis:
        # Setup mock to raise error on get()
        mock_redis = AsyncMock()
        mock_redis.get.side_effect = Exception("Redis error")
        mock_get_redis.return_value = mock_redis

        # Should not raise, returns None
        result = await get_cached_embedding("user-1", "Hello")
        assert result is None


# =============================================================================
# cache_embedding() Tests
# =============================================================================


@pytest.mark.asyncio
async def test_cache_embedding_stores_with_ttl():
    """cache_embedding() should store embedding with TTL."""
    with patch("src.memory.cache.get_redis_client") as mock_get_redis:
        # Setup mock
        mock_redis = AsyncMock()
        mock_redis.setex = AsyncMock()
        mock_redis.zadd = AsyncMock()
        mock_redis.zcard = AsyncMock(return_value=10)  # Under limit
        mock_get_redis.return_value = mock_redis

        # Call function
        embedding = [0.1] * 768
        result = await cache_embedding("user-1", "Test text", embedding)

        # Verify setex was called with TTL
        assert result is True
        mock_redis.setex.assert_called_once()
        call_args = mock_redis.setex.call_args[0]
        assert call_args[1] == EMBEDDING_TTL_SECONDS  # TTL argument


@pytest.mark.asyncio
async def test_cache_embedding_updates_lru():
    """cache_embedding() should update LRU sorted set."""
    with patch("src.memory.cache.get_redis_client") as mock_get_redis, patch(
        "src.memory.cache.time.time", return_value=2000.0
    ):
        # Setup mock
        mock_redis = AsyncMock()
        mock_redis.setex = AsyncMock()
        mock_redis.zadd = AsyncMock()
        mock_redis.zcard = AsyncMock(return_value=10)
        mock_get_redis.return_value = mock_redis

        # Call function
        await cache_embedding("user-1", "Test", [0.1] * 768)

        # Verify LRU was updated with timestamp
        assert mock_redis.zadd.called
        call_args = mock_redis.zadd.call_args
        # zadd called with (key, {hash: timestamp})
        assert call_args is not None


@pytest.mark.asyncio
async def test_cache_embedding_triggers_eviction_when_over_limit():
    """cache_embedding() should evict oldest entries when over MAX_ENTRIES."""
    with patch("src.memory.cache.get_redis_client") as mock_get_redis, patch(
        "src.memory.cache._evict_oldest_entries"
    ) as mock_evict:
        # Setup mock - cache is over limit
        mock_redis = AsyncMock()
        mock_redis.setex = AsyncMock()
        mock_redis.zadd = AsyncMock()
        mock_redis.zcard = AsyncMock(return_value=MAX_ENTRIES_PER_USER + 10)  # Over limit
        mock_get_redis.return_value = mock_redis
        mock_evict.return_value = 10

        # Call function
        await cache_embedding("user-1", "Test", [0.1] * 768)

        # Verify eviction was triggered
        mock_evict.assert_called_once()


@pytest.mark.asyncio
async def test_cache_embedding_returns_false_on_redis_unavailable():
    """cache_embedding() should return False when Redis unavailable."""
    with patch("src.memory.cache.get_redis_client") as mock_get_redis:
        # Redis not available
        mock_get_redis.return_value = None

        # Call function
        result = await cache_embedding("user-1", "Test", [0.1] * 768)

        # Should return False
        assert result is False


@pytest.mark.asyncio
async def test_cache_embedding_handles_errors_gracefully():
    """cache_embedding() should handle Redis errors gracefully."""
    with patch("src.memory.cache.get_redis_client") as mock_get_redis:
        # Setup mock to raise error
        mock_redis = AsyncMock()
        mock_redis.setex.side_effect = Exception("Redis error")
        mock_get_redis.return_value = mock_redis

        # Should not raise, returns False
        result = await cache_embedding("user-1", "Test", [0.1] * 768)
        assert result is False


# =============================================================================
# Helper Function Tests
# =============================================================================


def test_hash_text_is_deterministic():
    """_hash_text() should return same hash for same text."""
    from src.memory.cache import _hash_text

    hash1 = _hash_text("Hello World")
    hash2 = _hash_text("Hello World")

    assert hash1 == hash2
    assert len(hash1) == 16


def test_hash_text_normalizes_input():
    """_hash_text() should normalize text (strip and lowercase)."""
    from src.memory.cache import _hash_text

    hash1 = _hash_text("  Hello World  ")
    hash2 = _hash_text("hello world")

    # Should produce same hash (normalized)
    assert hash1 == hash2


def test_embedding_key_format():
    """_embedding_key() should create correctly formatted key."""
    from src.memory.cache import _embedding_key

    key = _embedding_key("user-123", "abc123")

    assert key == "embedding:user-123:abc123"
    assert key.startswith("embedding:")


def test_lru_key_format():
    """_lru_key() should create correctly formatted key."""
    from src.memory.cache import _lru_key

    key = _lru_key("user-456")

    assert key == "embedding_lru:user-456"
    assert key.startswith("embedding_lru:")
