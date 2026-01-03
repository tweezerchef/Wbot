"""
============================================================================
Embedding Cache Module
============================================================================
Redis-based caching for vector embeddings to reduce API calls to Gemini.

Features:
- Per-user cache isolation (key: embedding:{user_id}:{text_hash})
- Size-based eviction (max 1000 entries per user)
- Graceful fallback on Redis failures
- Async operations using redis-py asyncio

Usage:
    from src.memory.cache import get_cached_embedding, cache_embedding

    # Check cache first
    embedding = await get_cached_embedding(user_id, text)
    if embedding is None:
        embedding = await generate_embedding(text)
        await cache_embedding(user_id, text, embedding)
============================================================================
"""

import hashlib
import json
import os
import time

import redis.asyncio as redis

# Configuration constants
MAX_ENTRIES_PER_USER = 1000
EMBEDDING_TTL_SECONDS = 7 * 24 * 60 * 60  # 7 days
REDIS_CONNECT_TIMEOUT = 2.0  # seconds


def _get_redis_url() -> str | None:
    """Returns Redis URL from environment, or None if not configured."""
    return os.getenv("REDIS_URL")


# Global connection pool (initialized lazily)
_redis_pool: redis.ConnectionPool | None = None


async def get_redis_client() -> redis.Redis | None:
    """
    Returns an async Redis client using a shared connection pool.

    Returns None if Redis is not configured or unavailable.
    Uses a global connection pool for efficiency.

    Returns:
        redis.Redis instance or None if unavailable.
    """
    global _redis_pool

    redis_url = _get_redis_url()
    if not redis_url:
        return None

    try:
        if _redis_pool is None:
            _redis_pool = redis.ConnectionPool.from_url(
                redis_url,
                max_connections=10,
                socket_connect_timeout=REDIS_CONNECT_TIMEOUT,
            )

        client = redis.Redis(connection_pool=_redis_pool)
        # Quick health check
        await client.ping()
        return client
    except Exception as e:
        print(f"[cache] Redis connection failed: {e}")
        return None


def _hash_text(text: str) -> str:
    """
    Creates a deterministic hash of text for cache keys.

    Normalizes text before hashing for consistent cache hits.
    Returns first 16 chars of SHA-256 hash.

    Args:
        text: The text to hash.

    Returns:
        16-character hex string hash.
    """
    normalized = text.strip().lower()
    hash_bytes = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
    return hash_bytes[:16]


def _embedding_key(user_id: str, text_hash: str) -> str:
    """Constructs the Redis key for an embedding."""
    return f"embedding:{user_id}:{text_hash}"


def _lru_key(user_id: str) -> str:
    """Constructs the Redis key for a user's LRU sorted set."""
    return f"embedding_lru:{user_id}"


async def get_cached_embedding(user_id: str, text: str) -> list[float] | None:
    """
    Retrieves a cached embedding for the given text.

    Args:
        user_id: The user ID for cache isolation.
        text: The text whose embedding to retrieve.

    Returns:
        The cached embedding as a list of floats, or None if not found.
    """
    client = await get_redis_client()
    if client is None:
        return None

    text_hash = _hash_text(text)
    key = _embedding_key(user_id, text_hash)

    try:
        data = await client.get(key)
        if data is None:
            return None

        # Update LRU timestamp on cache hit
        lru_key = _lru_key(user_id)
        await client.zadd(lru_key, {text_hash: time.time()})

        return json.loads(data)
    except Exception as e:
        print(f"[cache] Error retrieving embedding: {e}")
        return None


async def cache_embedding(user_id: str, text: str, embedding: list[float]) -> bool:
    """
    Stores an embedding in the cache.

    Args:
        user_id: The user ID for cache isolation.
        text: The original text that was embedded.
        embedding: The embedding vector to cache.

    Returns:
        True if caching succeeded, False otherwise.
    """
    client = await get_redis_client()
    if client is None:
        return False

    text_hash = _hash_text(text)
    key = _embedding_key(user_id, text_hash)
    lru_key = _lru_key(user_id)

    try:
        # Store embedding with TTL
        await client.setex(key, EMBEDDING_TTL_SECONDS, json.dumps(embedding))

        # Update LRU sorted set
        await client.zadd(lru_key, {text_hash: time.time()})

        # Check if eviction needed
        count = await client.zcard(lru_key)
        if count > MAX_ENTRIES_PER_USER:
            await _evict_oldest_entries(client, user_id, lru_key)

        return True
    except Exception as e:
        print(f"[cache] Error caching embedding: {e}")
        return False


async def _evict_oldest_entries(
    client: redis.Redis,
    user_id: str,
    lru_key: str,
    keep_count: int = MAX_ENTRIES_PER_USER,
) -> int:
    """
    Removes the oldest cache entries beyond the keep_count limit.

    Uses the LRU sorted set to identify oldest entries by timestamp.

    Args:
        client: The Redis client instance.
        user_id: The user ID for key construction.
        lru_key: The LRU sorted set key.
        keep_count: Number of entries to keep.

    Returns:
        Number of entries evicted.
    """
    try:
        # Get count of entries to remove
        total_count = await client.zcard(lru_key)
        remove_count = total_count - keep_count

        if remove_count <= 0:
            return 0

        # Get the oldest entries (lowest timestamps)
        oldest_hashes = await client.zrange(lru_key, 0, remove_count - 1)

        if not oldest_hashes:
            return 0

        # Delete embedding keys and remove from sorted set
        pipe = client.pipeline()
        for text_hash in oldest_hashes:
            # text_hash might be bytes, decode if needed
            if isinstance(text_hash, bytes):
                text_hash = text_hash.decode("utf-8")
            pipe.delete(_embedding_key(user_id, text_hash))
            pipe.zrem(lru_key, text_hash)

        await pipe.execute()
        return len(oldest_hashes)

    except Exception as e:
        print(f"[cache] Error during eviction: {e}")
        return 0


async def get_cache_stats(user_id: str) -> dict[str, object]:
    """
    Returns cache statistics for debugging and monitoring.

    Args:
        user_id: The user ID to get stats for.

    Returns:
        Dict with entry_count, oldest_entry_age, etc.
    """
    client = await get_redis_client()
    if client is None:
        return {"error": "Redis not available"}

    lru_key = _lru_key(user_id)

    try:
        count = await client.zcard(lru_key)
        oldest = await client.zrange(lru_key, 0, 0, withscores=True)

        oldest_age = None
        if oldest:
            oldest_timestamp = oldest[0][1]
            oldest_age = time.time() - oldest_timestamp

        return {
            "entry_count": count,
            "max_entries": MAX_ENTRIES_PER_USER,
            "oldest_entry_age_seconds": oldest_age,
        }
    except Exception as e:
        return {"error": str(e)}


async def close_redis_pool() -> None:
    """Closes the Redis connection pool. Call during shutdown."""
    global _redis_pool
    if _redis_pool is not None:
        await _redis_pool.aclose()
        _redis_pool = None
