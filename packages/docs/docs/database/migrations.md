---
sidebar_position: 2
---

# Database Migrations

Wbot uses Supabase migrations for database schema management.

## Migration Files

Migrations are stored in `database/migrations/` and run in order:

| File                    | Purpose                           |
| ----------------------- | --------------------------------- |
| `001_profiles.sql`      | User profiles, extends auth.users |
| `002_conversations.sql` | Chat sessions                     |
| `003_messages.sql`      | Individual messages               |

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
pnpm db:new add_memories_table

# This creates: database/migrations/004_add_memories_table.sql
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
