"""
Test script to verify both Redis connections are working correctly.

This script tests:
1. Local Redis (REDIS_URL) - for AI-only embedding cache
2. Shared Redis (REDIS_SHARED_URL) - for frontend+backend message cache

Usage:
    cd apps/ai
    uv run python scripts/test_shared_redis.py
"""

import asyncio
import json
import os
import sys
import uuid

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.memory.cache import (
    append_messages,
    cache_embedding,
    get_cache_stats,
    get_cached_embedding,
    get_cached_messages,
    get_message_cache_stats,
    get_redis_client,
    get_shared_redis_client,
    invalidate_conversation_cache,
)


async def test_local_redis() -> bool:
    """Test local Redis connection (embeddings)."""
    print("\n" + "=" * 60)
    print("🔧 TESTING LOCAL REDIS (Embeddings)")
    print("=" * 60)

    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        print("⚠️  REDIS_URL not set - local Redis cache disabled")
        print("   This is optional but recommended for embedding caching")
        return True  # Not a failure, just not configured

    print("✅ REDIS_URL configured")
    # Mask password for display
    masked_url = redis_url.split("@")[-1] if "@" in redis_url else redis_url[:30] + "..."
    print(f"   Host: {masked_url}")

    # Test connection
    print("\n📡 Connecting to local Redis...")
    client = await get_redis_client()

    if client is None:
        print("❌ Failed to connect to local Redis")
        return False

    print("✅ Connected successfully!")

    # Test embedding cache
    print("\n💾 Testing embedding cache...")
    test_user_id = f"test-user-{uuid.uuid4().hex[:8]}"
    test_text = "Test embedding for local Redis"
    test_embedding = [0.1, 0.2, 0.3, 0.4, 0.5]

    cache_success = await cache_embedding(test_user_id, test_text, test_embedding)
    if not cache_success:
        print("❌ Failed to cache embedding")
        return False

    print("✅ Cached embedding")

    cached = await get_cached_embedding(test_user_id, test_text)
    if cached != test_embedding:
        print("❌ Cache retrieval mismatch")
        return False

    print("✅ Retrieved embedding matches!")

    # Show stats
    stats = await get_cache_stats(test_user_id)
    print(f"\n📊 Local Redis Stats: {stats}")

    print("\n✨ Local Redis is working correctly!")
    return True


async def test_shared_redis() -> bool:
    """Test shared Redis connection (messages)."""
    print("\n" + "=" * 60)
    print("🌐 TESTING SHARED REDIS (Messages - Upstash)")
    print("=" * 60)

    redis_url = os.getenv("REDIS_SHARED_URL")
    if not redis_url:
        print("❌ REDIS_SHARED_URL not set!")
        print("\n   This is REQUIRED for message caching to work between")
        print("   the AI backend and web frontend.")
        print("\n   To fix:")
        print("   1. Get your Upstash Redis URL")
        print("   2. Add to apps/ai/.env:")
        print("      REDIS_SHARED_URL=rediss://default:password@your-instance.upstash.io:6379")
        return False

    print("✅ REDIS_SHARED_URL configured")
    # Mask password for display
    masked_url = redis_url.split("@")[-1] if "@" in redis_url else redis_url[:30] + "..."
    print(f"   Host: {masked_url}")

    # Test connection
    print("\n📡 Connecting to shared Redis (Upstash)...")
    client = await get_shared_redis_client()

    if client is None:
        print("❌ Failed to connect to shared Redis")
        print("\n   Possible issues:")
        print("   - Incorrect URL or password")
        print("   - Network/firewall blocking connection")
        print("   - Upstash instance not running")
        return False

    print("✅ Connected successfully!")

    # Test message cache
    print("\n💬 Testing message cache...")
    test_conversation_id = f"test-conv-{uuid.uuid4().hex[:8]}"
    test_messages = [
        {
            "id": str(uuid.uuid4()),
            "role": "user",
            "content": "Hello from test script!",
            "created_at": "2025-01-10T00:00:00Z",
        },
        {
            "id": str(uuid.uuid4()),
            "role": "assistant",
            "content": "Hi! This is a test response.",
            "created_at": "2025-01-10T00:00:01Z",
        },
    ]

    # Test append (write-through)
    append_success = await append_messages(test_conversation_id, test_messages)
    if not append_success:
        print("❌ Failed to append messages to cache")
        return False

    print(f"✅ Appended {len(test_messages)} messages to cache")

    # Test retrieval
    cached_messages = await get_cached_messages(test_conversation_id)
    if cached_messages is None:
        print("❌ Failed to retrieve messages from cache")
        return False

    if len(cached_messages) != len(test_messages):
        print(
            f"❌ Message count mismatch: expected {len(test_messages)}, got {len(cached_messages)}"
        )
        return False

    print(f"✅ Retrieved {len(cached_messages)} messages from cache")

    # Verify content
    for i, (original, cached) in enumerate(zip(test_messages, cached_messages, strict=True)):
        if original["content"] != cached["content"]:
            print(f"❌ Message {i} content mismatch")
            return False
        if original["role"] != cached["role"]:
            print(f"❌ Message {i} role mismatch")
            return False

    print("✅ Message content matches!")

    # Clean up test data
    await invalidate_conversation_cache(test_conversation_id)
    print("✅ Cleaned up test data")

    # Show stats
    stats = await get_message_cache_stats()
    print(f"\n📊 Shared Redis Stats: {stats}")

    print("\n✨ Shared Redis is working correctly!")
    return True


async def test_frontend_compatibility() -> bool:
    """Test that cache format is compatible with frontend expectations."""
    print("\n" + "=" * 60)
    print("🔗 TESTING FRONTEND COMPATIBILITY")
    print("=" * 60)

    client = await get_shared_redis_client()
    if client is None:
        print("⚠️  Shared Redis not available, skipping compatibility test")
        return True

    test_conversation_id = f"compat-test-{uuid.uuid4().hex[:8]}"

    # Create messages in the format the frontend expects
    test_messages = [
        {
            "id": "msg-001",
            "role": "user",
            "content": "Test user message",
            "created_at": "2025-01-10T12:00:00Z",
        },
        {
            "id": "msg-002",
            "role": "assistant",
            "content": "Test assistant response",
            "created_at": "2025-01-10T12:00:01Z",
        },
    ]

    await append_messages(test_conversation_id, test_messages)

    # Read raw data to verify format
    key = f"conv_msgs:{test_conversation_id}"
    raw_data = await client.get(key)

    if raw_data is None:
        print("❌ Failed to read raw cache data")
        return False

    parsed = json.loads(raw_data)

    print("\n📝 Cached message format:")
    for msg in parsed:
        print(f"   - id: {msg.get('id')}")
        print(f"     role: {msg.get('role')}")
        print(f"     content: {msg.get('content')[:30]}...")
        print(f"     created_at: {msg.get('created_at')}")

    # Verify required fields
    required_fields = ["id", "role", "content", "created_at"]
    for msg in parsed:
        for field in required_fields:
            if field not in msg:
                print(f"❌ Missing required field: {field}")
                return False

    print("\n✅ Message format is compatible with frontend!")

    # Clean up
    await invalidate_conversation_cache(test_conversation_id)

    return True


async def main() -> None:
    """Run all Redis tests."""
    print("\n" + "=" * 60)
    print("       WBOT REDIS CONNECTION TEST")
    print("=" * 60)
    print("\nThis script verifies that both Redis instances are configured")
    print("correctly and can communicate with the AI backend.\n")

    results = {
        "Local Redis (REDIS_URL)": await test_local_redis(),
        "Shared Redis (REDIS_SHARED_URL)": await test_shared_redis(),
        "Frontend Compatibility": await test_frontend_compatibility(),
    }

    print("\n" + "=" * 60)
    print("       TEST SUMMARY")
    print("=" * 60)

    all_passed = True
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {status}  {test_name}")
        if not passed:
            all_passed = False

    print("=" * 60)

    if all_passed:
        print("\n🎉 All tests passed! Redis is configured correctly.")
        print("\nNext steps:")
        print("   1. Ensure root .env has REDIS_URI pointing to same Upstash")
        print("   2. Run 'pnpm dev:all' to start the application")
        print("   3. Send a message and verify it persists after refresh")
    else:
        print("\n⚠️  Some tests failed. Please check the configuration above.")
        print("\nRequired environment variables:")
        print("   - apps/ai/.env: REDIS_SHARED_URL=rediss://...@upstash.io:6379")
        print("   - Root .env: REDIS_URI=rediss://...@upstash.io:6379 (same URL)")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
