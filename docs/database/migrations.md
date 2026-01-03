---
sidebar_position: 2
---

# Database Migrations

Wbot uses Supabase migrations for database schema management.

## Migration Files

Migrations are stored in `supabase/migrations/` and run in order:

| File                               | Purpose                           |
| ---------------------------------- | --------------------------------- |
| `20231230000001_profiles.sql`      | User profiles, extends auth.users |
| `20231230000002_conversations.sql` | Chat sessions                     |
| `20231230000003_messages.sql`      | Individual messages               |
| `20250102000004_memories.sql`      | Semantic memory storage           |

## Running Migrations

### Local Development

```bash
# Start local Supabase (includes migrations)
pnpm db:start

# Reset database and rerun all migrations
pnpm db:reset

# Check migration status
pnpm db:status
```

### Creating New Migrations

```bash
# Create a new migration file
pnpm db:new add_activities_table

# This creates: supabase/migrations/YYYYMMDDHHMMSS_add_activities_table.sql
```

### Production Deployment

```bash
# Link to remote project
pnpm db:link

# Push migrations to production
pnpm db:push:remote
```

## Migration Best Practices

### 1. Always Use IF NOT EXISTS

```sql
-- Good: Won't fail if table exists
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- Bad: Will fail on re-run
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
```

### 2. Always Add RLS Policies

```sql
-- Enable RLS on new tables
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- Add policies for each operation
CREATE POLICY "Users can view own memories"
  ON memories FOR SELECT
  USING (auth.uid() = user_id);
```

### 3. Use Descriptive Comments

```sql
-- ============================================================================
-- Migration: 004_memories.sql
-- Purpose: Store semantic memories for personalized AI responses
-- ============================================================================
```

### 4. Consider Rollback

While Supabase doesn't have built-in rollback, structure migrations for safety:

```sql
-- Drop if exists (for development iteration)
DROP TABLE IF EXISTS memories;

-- Then create
CREATE TABLE memories (...);
```

## Example Migration

```sql
-- ============================================================================
-- Migration: 20250103000001_conversation_history.sql
-- Purpose: Add full-text search for conversation history
-- ============================================================================

-- Add search vector column
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- Create index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_messages_search
ON messages USING GIN (search_vector);

-- Function to search messages
CREATE OR REPLACE FUNCTION search_messages(
  search_query TEXT,
  user_uuid UUID
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.conversation_id,
    m.content,
    m.created_at,
    ts_rank(m.search_vector, websearch_to_tsquery('english', search_query)) AS rank
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE c.user_id = user_uuid
    AND m.search_vector @@ websearch_to_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT 50;
END;
$$;
```

## Generating TypeScript Types

After changing the schema, regenerate types:

```bash
pnpm db:generate-types
```

This updates `packages/shared/src/types/database.ts` with the latest schema.

## Troubleshooting

### Migration Failed

```bash
# Check what went wrong
pnpm db:status

# Reset and rerun (local only!)
pnpm db:reset
```

### Schema Drift

Compare local and remote schemas:

```bash
# Generate diff
pnpm db:diff
```

### Common Issues

| Issue                     | Solution                         |
| ------------------------- | -------------------------------- |
| "relation already exists" | Use `IF NOT EXISTS`              |
| "permission denied"       | Check RLS policies               |
| "foreign key violation"   | Ensure referenced rows exist     |
| "type does not exist"     | Enable required extensions first |
