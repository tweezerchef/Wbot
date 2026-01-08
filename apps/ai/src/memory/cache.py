"""
============================================================================
Cache Module
============================================================================
Redis-based caching for embeddings and conversation messages.

Features:
- Embedding cache: Per-user isolation, LRU eviction, 7-day TTL
- Message cache: Per-conversation storage, 24-hour TTL, write-through pattern
- Graceful fallback on Redis failures
- Async operations using redis-py asyncio

Usage - Embeddings:
    from src.memory.cache import get_cached_embedding, cache_embedding

    embedding = await get_cached_embedding(user_id, text)
    if embedding is None:
        embedding = await generate_embedding(text)
        await cache_embedding(user_id, text, embedding)

Usage - Messages:
    from src.memory.cache import get_cached_messages, cache_messages, append_messages

    # Read: Check cache first, fall back to database
    messages = await get_cached_messages(conversation_id)

    # Write-through: Append new messages to cache after saving to database
    await append_messages(conversation_id, new_messages)
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

# Message cache configuration
MAX_CACHED_MESSAGES = 10_000  # Total messages across all cached conversations
MESSAGES_TTL_SECONDS = 24 * 60 * 60  # 24 hours (matches frontend TTL)
MESSAGES_LRU_KEY = "conv_msgs_lru"  # Sorted set: conversation_id -> last_access_timestamp
MESSAGES_COUNTS_KEY = "conv_msgs_counts"  # Hash: conversation_id -> message_count


def _get_redis_url() -> str | None:
    """Returns Redis URL from environment, or None if not configured.

    Checks REDIS_URI first (LangGraph convention), falls back to REDIS_URL.
    """
    return os.getenv("REDIS_URI") or os.getenv("REDIS_URL")


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


# =============================================================================
# Conversation Message Cache
# =============================================================================
# Write-through cache for conversation messages.
# - AI backend appends messages after saving to Supabase
# - Web frontend reads from cache first, falls back to Supabase
#
# Eviction Strategy:
# - Total message count across all conversations is limited to MAX_CACHED_MESSAGES
# - When limit is exceeded, oldest-accessed conversations are evicted (LRU)
# - Uses two tracking structures:
#   - MESSAGES_LRU_KEY: sorted set (conversation_id -> access_timestamp) for LRU ordering
#   - MESSAGES_COUNTS_KEY: hash (conversation_id -> message_count) for counting
# =============================================================================


def _messages_key(conversation_id: str) -> str:
    """Constructs the Redis key for cached conversation messages."""
    return f"conv_msgs:{conversation_id}"


async def _get_total_cached_messages(client: redis.Redis) -> int:
    """Returns the total number of messages across all cached conversations."""
    try:
        # Sum all values in the counts hash
        counts = await client.hgetall(MESSAGES_COUNTS_KEY)
        total = sum(int(v) for v in counts.values())
        return total
    except Exception:
        return 0


async def _evict_oldest_conversations(client: redis.Redis, messages_to_free: int) -> int:
    """
    Evicts oldest-accessed conversations until messages_to_free are removed.

    Args:
        client: Redis client instance.
        messages_to_free: Minimum number of messages to evict.

    Returns:
        Number of messages actually evicted.
    """
    evicted = 0
    try:
        while evicted < messages_to_free:
            # Get oldest conversation (lowest score = oldest access time)
            oldest = await client.zrange(MESSAGES_LRU_KEY, 0, 0)
            if not oldest:
                break

            conv_id_bytes = oldest[0]
            conv_id = (
                conv_id_bytes.decode("utf-8") if isinstance(conv_id_bytes, bytes) else conv_id_bytes
            )

            # Get message count for this conversation
            msg_count_raw = await client.hget(MESSAGES_COUNTS_KEY, conv_id)
            msg_count = int(msg_count_raw) if msg_count_raw else 0

            # Remove the conversation data and tracking entries
            pipe = client.pipeline()
            pipe.delete(_messages_key(conv_id))
            pipe.zrem(MESSAGES_LRU_KEY, conv_id)
            pipe.hdel(MESSAGES_COUNTS_KEY, conv_id)
            await pipe.execute()

            evicted += msg_count
            print(f"[cache] Evicted conversation {conv_id[:8]}... ({msg_count} msgs)")

    except Exception as e:
        print(f"[cache] Error during eviction: {e}")

    return evicted


async def get_cached_messages(conversation_id: str) -> list[dict[str, object]] | None:
    """
    Retrieves cached messages for a conversation.

    Updates the access time in the LRU index to support eviction.

    Args:
        conversation_id: The conversation UUID.

    Returns:
        List of message dicts [{id, role, content, created_at}, ...] or None if not cached.
    """
    client = await get_redis_client()
    if client is None:
        return None

    key = _messages_key(conversation_id)

    try:
        data = await client.get(key)
        if data is None:
            return None

        messages = json.loads(data)

        # Update access time in LRU index (keeps frequently accessed convos in cache)
        await client.zadd(MESSAGES_LRU_KEY, {conversation_id: time.time()})

        return messages
    except Exception as e:
        print(f"[cache] Error retrieving messages: {e}")
        return None


async def cache_messages(conversation_id: str, messages: list[dict[str, object]]) -> bool:
    """
    Caches all messages for a conversation (full replacement).

    Used when populating cache from a database read.
    Triggers eviction if total message count exceeds limit.

    Args:
        conversation_id: The conversation UUID.
        messages: List of message dicts to cache.

    Returns:
        True if caching succeeded, False otherwise.
    """
    client = await get_redis_client()
    if client is None:
        return False

    key = _messages_key(conversation_id)
    msg_count = len(messages)

    try:
        # Get current count for this conversation (if already cached)
        existing_count_raw = await client.hget(MESSAGES_COUNTS_KEY, conversation_id)
        existing_count = int(existing_count_raw) if existing_count_raw else 0

        # Check if we need to evict before adding
        current_total = await _get_total_cached_messages(client)
        new_total = current_total - existing_count + msg_count

        if new_total > MAX_CACHED_MESSAGES:
            messages_to_free = new_total - MAX_CACHED_MESSAGES + msg_count
            await _evict_oldest_conversations(client, messages_to_free)

        # Store messages with TTL and update tracking
        pipe = client.pipeline()
        pipe.setex(key, MESSAGES_TTL_SECONDS, json.dumps(messages))
        pipe.zadd(MESSAGES_LRU_KEY, {conversation_id: time.time()})
        pipe.hset(MESSAGES_COUNTS_KEY, conversation_id, msg_count)
        await pipe.execute()

        return True
    except Exception as e:
        print(f"[cache] Error caching messages: {e}")
        return False


async def append_messages(conversation_id: str, new_messages: list[dict[str, object]]) -> bool:
    """
    Appends new messages to an existing cached conversation.

    Used for write-through caching after saving messages to the database.
    If the conversation is not in cache, creates a new entry with just the
    new messages (ensures write-through works even if cache was evicted).

    Args:
        conversation_id: The conversation UUID.
        new_messages: New message dicts to append.

    Returns:
        True if append/create succeeded, False on error.
    """
    client = await get_redis_client()
    if client is None:
        return False

    key = _messages_key(conversation_id)

    try:
        # Get existing messages (may be empty if cache miss)
        data = await client.get(key)
        if data is None:
            # Cache miss - create new entry with just the new messages
            # This ensures write-through pattern works even if cache was evicted
            existing = []
            old_count = 0
        else:
            existing = json.loads(data)
            old_count = len(existing)

        updated = existing + new_messages
        new_count = len(updated)

        # Check if we need to evict before adding
        current_total = await _get_total_cached_messages(client)
        new_total = current_total - old_count + new_count

        if new_total > MAX_CACHED_MESSAGES:
            messages_to_free = new_total - MAX_CACHED_MESSAGES + len(new_messages)
            await _evict_oldest_conversations(client, messages_to_free)

        # Store updated messages with TTL and update tracking
        pipe = client.pipeline()
        pipe.setex(key, MESSAGES_TTL_SECONDS, json.dumps(updated))
        pipe.zadd(MESSAGES_LRU_KEY, {conversation_id: time.time()})
        pipe.hset(MESSAGES_COUNTS_KEY, conversation_id, new_count)
        await pipe.execute()

        return True
    except Exception as e:
        print(f"[cache] Error appending messages: {e}")
        return False


async def invalidate_conversation_cache(conversation_id: str) -> bool:
    """
    Removes a conversation from the cache.

    Call this when a conversation is deleted or needs full refresh.

    Args:
        conversation_id: The conversation UUID.

    Returns:
        True if invalidation succeeded, False otherwise.
    """
    client = await get_redis_client()
    if client is None:
        return False

    key = _messages_key(conversation_id)

    try:
        # Remove data and all tracking entries
        pipe = client.pipeline()
        pipe.delete(key)
        pipe.zrem(MESSAGES_LRU_KEY, conversation_id)
        pipe.hdel(MESSAGES_COUNTS_KEY, conversation_id)
        await pipe.execute()
        return True
    except Exception as e:
        print(f"[cache] Error invalidating conversation cache: {e}")
        return False


async def get_message_cache_stats() -> dict[str, object]:
    """
    Returns statistics about the message cache.

    Useful for monitoring and debugging.

    Returns:
        Dict with total_messages, conversation_count, oldest_conversation, etc.
    """
    client = await get_redis_client()
    if client is None:
        return {"error": "Redis not available"}

    try:
        total_messages = await _get_total_cached_messages(client)
        conv_count = await client.zcard(MESSAGES_LRU_KEY)

        # Get oldest conversation
        oldest = await client.zrange(MESSAGES_LRU_KEY, 0, 0, withscores=True)
        oldest_age = None
        if oldest:
            oldest_timestamp = oldest[0][1]
            oldest_age = time.time() - oldest_timestamp

        return {
            "total_messages": total_messages,
            "max_messages": MAX_CACHED_MESSAGES,
            "conversation_count": conv_count,
            "oldest_conversation_age_seconds": oldest_age,
            "utilization_percent": round(total_messages / MAX_CACHED_MESSAGES * 100, 1),
        }
    except Exception as e:
        return {"error": str(e)}
