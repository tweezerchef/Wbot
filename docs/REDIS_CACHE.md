# Redis Conversation Cache

This document explains how Redis caching works for conversation messages in Wbot.

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Web Frontend  │         │   AI Backend    │
│  (TanStack Start)│         │   (LangGraph)   │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │ loadMessages()            │ save_messages()
         │ (cache-first read)        │ (write-through)
         ▼                           ▼
┌──────────────────────────────────────────────┐
│              Upstash Redis                   │
│         (Shared Remote Instance)             │
└──────────────────────────────────────────────┘
         │
         │ cache miss
         ▼
┌──────────────────────────────────────────────┐
│              Supabase                        │
│         (Source of Truth)                    │
└──────────────────────────────────────────────┘
```

## Cache Strategy

### Write-Through (AI Backend)

When the AI backend saves messages to Supabase, it also appends them to the Redis cache:

1. Insert messages into Supabase `messages` table
2. Append to Redis cache key `conv_msgs:{conversation_id}`

### Cache-First Read (Web Frontend)

When loading messages for display:

1. Check Redis cache first
2. If cache hit → return cached messages
3. If cache miss → load from Supabase → populate cache → return

## Cache Keys

| Key Pattern                   | Value                                    | Purpose                                 |
| ----------------------------- | ---------------------------------------- | --------------------------------------- |
| `conv_msgs:{conversation_id}` | JSON array of messages                   | Full message history for a conversation |
| `conv_msgs_lru`               | Sorted set (conversation_id → timestamp) | LRU ordering for eviction               |
| `conv_msgs_counts`            | Hash (conversation_id → count)           | Message count per conversation          |

## Eviction Strategy

The cache is limited by **total message count** across all cached conversations, not by TTL.

### Configuration

- **Max cached messages**: 10,000 messages total
- **Eviction trigger**: When total exceeds limit
- **Eviction policy**: Remove oldest-accessed conversations first (LRU)

### Why Message Count vs TTL?

- **Predictable memory usage**: Each message is ~1-2KB, so 10K messages ≈ 10-20MB
- **Fair resource allocation**: Prevents one user with huge conversations from dominating cache
- **No stale data concerns**: Messages don't change, so TTL-based expiry isn't necessary

### Eviction Process

1. Track total message count in Redis sorted set
2. When appending/caching messages, check if total exceeds limit
3. If over limit, remove oldest conversations until under limit
4. Update index after each operation

## Message Format

Cached messages are stored as JSON arrays:

```json
[
  {
    "id": "uuid",
    "role": "user",
    "content": "Hello",
    "created_at": "2025-01-04T12:00:00Z"
  },
  {
    "id": "uuid",
    "role": "assistant",
    "content": "Hi there!",
    "created_at": "2025-01-04T12:00:01Z"
  }
]
```

## Configuration

### Environment Variables

Both apps need the same Redis URL:

```bash
# In apps/ai/.env and apps/web/.env
REDIS_URL="rediss://...@upstash.io:6379"
```

### Cache Settings

Defined in `apps/ai/src/memory/cache.py`:

```python
MAX_CACHED_MESSAGES = 10_000  # Total messages across all conversations
```

## Graceful Degradation

If Redis is unavailable:

- **Reads**: Fall back to Supabase (slower but functional)
- **Writes**: Continue saving to Supabase (cache remains stale until available)
- **No errors**: Cache failures are logged but don't break the app

## Files

| File                                | Purpose                   |
| ----------------------------------- | ------------------------- |
| `apps/ai/src/memory/cache.py`       | Cache functions (Python)  |
| `apps/ai/src/memory/store.py`       | Write-through integration |
| `apps/web/src/lib/redis.ts`         | Redis client (TypeScript) |
| `apps/web/src/lib/conversations.ts` | Cache-first reads         |
