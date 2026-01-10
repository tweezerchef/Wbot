# Redis Conversation Cache

This document explains how Redis caching works for conversation messages in Wbot.

## Architecture

Wbot uses **two separate Redis instances**:

1. **Local Redis** (Docker) - AI-only caching (embeddings)
2. **Shared Redis** (Upstash) - Frontend + Backend shared caching (messages)

```
┌─────────────────┐         ┌─────────────────────────────────────┐
│   Web Frontend  │         │            AI Backend               │
│  (TanStack Start)│         │           (LangGraph)               │
└────────┬────────┘         └──────┬─────────────────┬────────────┘
         │                         │                 │
         │ loadMessages()          │ save_messages() │ embeddings
         │ (cache-first read)      │ (write-through) │ (AI-only)
         ▼                         ▼                 ▼
┌──────────────────────────────────────┐  ┌─────────────────────┐
│         Upstash Redis (Shared)       │  │  Local Redis (AI)   │
│         REDIS_URI / REDIS_SHARED_URL │  │     REDIS_URL       │
└──────────────────────────────────────┘  └─────────────────────┘
         │
         │ cache miss
         ▼
┌──────────────────────────────────────────────┐
│              Supabase                        │
│         (Source of Truth)                    │
└──────────────────────────────────────────────┘
```

### Why Two Redis Instances?

- **Local Redis**: Fast, low-latency access for AI-only operations (embedding cache)
- **Shared Redis**: Remote instance accessible by both frontend and backend for shared data (messages)

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

**AI Backend** (`apps/ai/.env`):

```bash
# Local Redis (Docker) - for AI-only caching (embeddings)
REDIS_URL=redis://localhost:6379/0

# Shared Redis (Upstash) - for frontend+backend message cache
REDIS_SHARED_URL=rediss://default:YOUR_PASSWORD@your-instance.upstash.io:6379
```

**Web Frontend** (root `.env`):

```bash
# Shared Redis (Upstash) - must match AI backend's REDIS_SHARED_URL
REDIS_URI=rediss://default:YOUR_PASSWORD@your-instance.upstash.io:6379
```

| Variable           | Location       | Purpose                    | Points To                      |
| ------------------ | -------------- | -------------------------- | ------------------------------ |
| `REDIS_URL`        | `apps/ai/.env` | AI-only cache (embeddings) | Local Docker Redis             |
| `REDIS_SHARED_URL` | `apps/ai/.env` | Shared message cache       | Remote Upstash                 |
| `REDIS_URI`        | Root `.env`    | Web frontend cache reads   | Remote Upstash (same as above) |

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

| File                                | Purpose                                          |
| ----------------------------------- | ------------------------------------------------ |
| `apps/ai/src/memory/cache.py`       | Cache functions with dual Redis support (Python) |
| `apps/ai/src/memory/store.py`       | Write-through integration                        |
| `apps/web/src/lib/redis.ts`         | Redis client (TypeScript)                        |
| `apps/web/src/lib/conversations.ts` | Cache-first reads                                |

## Troubleshooting

### Messages not appearing after refresh

**Symptom**: New messages don't show up when you refresh the page.

**Likely cause**: Redis configuration mismatch between frontend and backend.

**Check**:

1. AI backend's `REDIS_SHARED_URL` points to Upstash (not local Redis)
2. Root `.env` has `REDIS_URI` pointing to the same Upstash instance
3. Run `apps/ai/scripts/test_shared_redis.py` to verify connectivity

### Cache working but slow

**Symptom**: Cache hits but response times are high.

**Likely cause**: Using local Redis for shared cache instead of Upstash.

**Check**: Ensure `REDIS_SHARED_URL` is set and points to Upstash (not localhost).
