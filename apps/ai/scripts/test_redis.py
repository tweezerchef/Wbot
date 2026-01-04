"""
Quick script to test Redis connection and caching functionality.

Usage:
    cd apps/ai
    uv run python scripts/test_redis.py
"""

import asyncio
import os
import sys

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.memory.cache import (
    cache_embedding,
    get_cache_stats,
    get_cached_embedding,
    get_redis_client,
)


async def main() -> None:
    """Test Redis connection and caching."""
    print("🔍 Testing Redis connection...\n")

    # Check if REDIS_URL is set
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        print("❌ REDIS_URL not set in environment variables")
        print("\nTo fix:")
        print("  1. Get Redis URL from Upstash/Redis Cloud")
        print("  2. Add to apps/ai/.env:")
        print("     REDIS_URL=redis://...")
        return

    print("✅ REDIS_URL configured")
    print(f"   URL: {redis_url[:30]}...{redis_url[-15:]}\n")

    # Test connection
    print("📡 Connecting to Redis...")
    client = await get_redis_client()

    if client is None:
        print("❌ Failed to connect to Redis")
        print("\nPossible issues:")
        print("  - Incorrect URL")
        print("  - Network/firewall blocking connection")
        print("  - Redis server not running")
        return

    print("✅ Connected successfully!\n")

    # Test caching
    print("💾 Testing embedding cache...")
    test_user_id = "test-user-123"
    test_text = "This is a test message for caching"
    test_embedding = [0.1, 0.2, 0.3, 0.4, 0.5]  # Dummy embedding

    # Cache the embedding
    cache_success = await cache_embedding(test_user_id, test_text, test_embedding)
    if not cache_success:
        print("❌ Failed to cache embedding")
        return

    print(f"✅ Cached embedding for: '{test_text[:50]}...'")

    # Retrieve from cache
    cached = await get_cached_embedding(test_user_id, test_text)
    if cached is None:
        print("❌ Failed to retrieve from cache")
        return

    print(f"✅ Retrieved from cache: {cached}")

    # Verify it matches
    if cached == test_embedding:
        print("✅ Cache hit matches original!\n")
    else:
        print("❌ Cache data mismatch\n")

    # Show cache stats
    print("📊 Cache Statistics:")
    stats = await get_cache_stats(test_user_id)
    for key, value in stats.items():
        print(f"   {key}: {value}")

    print("\n✨ Redis is working perfectly!")


if __name__ == "__main__":
    asyncio.run(main())
