# Redis Cache Setup Guide

This guide walks you through setting up a remote Redis instance for Wbot's semantic memory embedding cache.

## Why Redis?

Wbot uses Redis to cache vector embeddings, reducing API calls to Gemini and improving response times:

- **Without cache**: Every message requires a new embedding API call
- **With cache**: Repeat queries use cached embeddings (free + instant)
- **Impact**: Saves ~50% of embedding API costs

## Option 1: Upstash Redis (Recommended)

**Best for:** Serverless deployments, free tier, global edge caching

### Step 1: Create Upstash Account

1. Go to https://upstash.com
2. Sign up with GitHub or Google
3. Verify your email

### Step 2: Create Redis Database

1. Click **"Create Database"** in dashboard
2. Configure:
   - **Name**: `wbot-embeddings-cache`
   - **Type**: Regional (cheaper) or Global (faster)
   - **Region**: Choose closest to you (e.g., `us-east-1`)
   - **Eviction**: Select `allkeys-lru` (Least Recently Used)
3. Click **"Create"**

### Step 3: Get Connection URL

1. In the database dashboard, find the **"Redis URL"** section
2. Copy the URL (starts with `redis://` or `rediss://`)
3. Example: `redis://default:AbC123xyz@us1-example-12345.upstash.io:12345`

### Step 4: Configure Environment Variables

**For local development:**

```bash
# apps/ai/.env
REDIS_URL=redis://default:YOUR_PASSWORD@us1-example-12345.upstash.io:12345
```

**For production (Railway, Vercel, etc.):**

Add the `REDIS_URL` environment variable in your deployment platform's settings.

### Step 5: Test Connection

Run the test script:

```bash
cd apps/ai
uv run python scripts/test_redis.py
```

**Expected output:**

```
🔍 Testing Redis connection...

✅ REDIS_URL configured
   URL: redis://default:AbC123xyz...12345

📡 Connecting to Redis...
✅ Connected successfully!

💾 Testing embedding cache...
✅ Cached embedding for: 'This is a test message for caching...'
✅ Retrieved from cache: [0.1, 0.2, 0.3, 0.4, 0.5]
✅ Cache hit matches original!

📊 Cache Statistics:
   entry_count: 1
   max_entries: 1000
   oldest_entry_age_seconds: 0.5

✨ Redis is working perfectly!
```

### Step 6: Start Your App

```bash
pnpm dev:all
```

Redis caching will now work automatically! You'll see cache hits in the logs when retrieving memories.

---

## Option 2: Redis Cloud (Alternative)

**Best for:** Managed Redis with more control, free 30MB tier

1. Go to https://redis.com/try-free
2. Create account and database
3. Get connection URL from dashboard
4. Add to `REDIS_URL` in `.env`

---

## Option 3: Railway Redis (Alternative)

**Best for:** If you're already using Railway for deployment

1. In Railway project, click **"+ New"**
2. Select **"Database" → "Add Redis"**
3. Copy the `REDIS_URL` from the "Connect" tab
4. Add to your Railway environment variables
5. For local development, add to `apps/ai/.env`

---

## Configuration Details

### How It Works

The cache uses this key structure:

```
embedding:{user_id}:{text_hash}
```

**Example:**

```
embedding:user-123:a1b2c3d4e5f6g7h8
```

**Features:**

- Per-user isolation (each user has their own cache)
- LRU eviction (oldest entries removed when limit reached)
- 7-day TTL (embeddings expire after a week)
- Max 1000 entries per user

### Cache Configuration

Edit `apps/ai/src/memory/cache.py` to customize:

```python
MAX_ENTRIES_PER_USER = 1000  # Max cached embeddings per user
EMBEDDING_TTL_SECONDS = 7 * 24 * 60 * 60  # 7 days
REDIS_CONNECT_TIMEOUT = 2.0  # Connection timeout
```

### Monitoring Cache Performance

**Check cache stats for a user:**

```python
from src.memory.cache import get_cache_stats

stats = await get_cache_stats("user-id-here")
print(stats)
# {
#   "entry_count": 42,
#   "max_entries": 1000,
#   "oldest_entry_age_seconds": 3600
# }
```

**Monitor cache hits in logs:**

When running the AI backend, you'll see:

```
[memory] Cache hit for text hash: a1b2c3d4
[memory] Cache miss - generating new embedding
```

---

## Graceful Fallback

**Redis is optional** - the system works without it:

- If `REDIS_URL` is not set → caching disabled, embeddings generated fresh
- If Redis connection fails → warning logged, continues without cache
- No crashes or errors if Redis is unavailable

This makes development easier - you can run without Redis initially and add it later for performance.

---

## Cost Optimization

**With Redis caching:**

- Embedding API calls reduced by 50-70%
- Memory retrieval 10x faster (cache hits)
- Gemini API costs significantly lower

**Upstash Free Tier:**

- 10,000 commands/day
- 256 MB storage
- Perfect for development and small deployments

**Estimated usage:**

- ~5 commands per cache operation (get, set, zadd, etc.)
- 100 users × 10 messages/day = ~5,000 commands/day
- Easily fits in free tier

---

## Troubleshooting

### "Connection refused" error

**Possible causes:**

- Incorrect Redis URL
- Firewall blocking connection
- Redis server not running (if self-hosted)

**Solutions:**

1. Verify URL is correct
2. Check if IP whitelist needed (Upstash doesn't require this)
3. Test with `redis-cli` if available

### "Authentication failed" error

**Cause:** Wrong password in REDIS_URL

**Solution:**

1. Re-copy the URL from Upstash/Redis Cloud dashboard
2. Ensure no trailing spaces or special characters
3. Use the full URL including `redis://` protocol

### Cache not working

**Debug steps:**

1. Check if REDIS_URL is set:

   ```bash
   cd apps/ai
   uv run python -c "import os; print(os.getenv('REDIS_URL'))"
   ```

2. Run test script:

   ```bash
   uv run python scripts/test_redis.py
   ```

3. Check logs for Redis errors when starting the AI

---

## Security Best Practices

1. **Never commit REDIS_URL to git**
   - Already in `.gitignore` via `.env`

2. **Use different databases for dev/prod**
   - Create separate Upstash databases
   - `wbot-embeddings-dev` for local
   - `wbot-embeddings-prod` for production

3. **Rotate credentials periodically**
   - Upstash allows password reset in dashboard

4. **Use TLS (rediss://) in production**
   - Upstash provides both `redis://` and `rediss://` URLs
   - Use `rediss://` for production deployments

---

## Next Steps

1. ✅ Create Upstash account
2. ✅ Create Redis database
3. ✅ Copy REDIS_URL
4. ✅ Add to `apps/ai/.env`
5. ✅ Run `uv run python scripts/test_redis.py`
6. ✅ Start app with `pnpm dev:all`
7. ✅ Monitor cache hits in logs

You're all set! The embedding cache will now work across both local development and production deployments.
