Looking at your SQL migration, I'll create comprehensive database schema documentation for the memories table.

---

````markdown
---
sidebar_position: 4
title: Memories Schema
---

# Memories Database Schema

The memories system enables semantic search of past conversations using vector embeddings, allowing the AI to recall relevant context from previous interactions with users.

## Table Overview

### memories

**Purpose:** Stores conversation pairs (user message + AI response) with vector embeddings for semantic similarity search. This enables the AI to find and reference relevant past conversations when helping users.

```sql
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  combined_text TEXT NOT NULL,
  embedding halfvec(768),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
````

## Column Definitions

| Column            | Type         | Constraints           | Description                                   |
| ----------------- | ------------ | --------------------- | --------------------------------------------- |
| `id`              | UUID         | PRIMARY KEY           | Auto-generated unique identifier              |
| `user_id`         | UUID         | NOT NULL, FOREIGN KEY | References `profiles(id)` with CASCADE delete |
| `conversation_id` | UUID         | FOREIGN KEY           | Optional reference to source conversation     |
| `user_message`    | TEXT         | NOT NULL              | The user's original message                   |
| `ai_response`     | TEXT         | NOT NULL              | The AI assistant's response                   |
| `combined_text`   | TEXT         | NOT NULL              | Formatted text used for embedding generation  |
| `embedding`       | halfvec(768) | nullable              | 768-dimensional embedding vector              |
| `metadata`        | JSONB        | DEFAULT '{}'          | Flexible storage for additional context       |
| `created_at`      | TIMESTAMPTZ  | DEFAULT NOW()         | Memory creation timestamp                     |

## Design Decisions

### Vector Storage Strategy

:::tip Memory Optimization
The table uses `halfvec(768)` instead of `vector(768)` to save approximately 50% storage space with minimal quality loss. This is particularly important for embeddings which can grow large with many memories per user.
:::

```sql
-- Half precision vector (2 bytes per dimension)
embedding halfvec(768)  -- Uses ~1.5KB per embedding

-- vs full precision (would use ~3KB per embedding)
-- embedding vector(768)
```

### Text Storage Format

The `combined_text` field follows a standardized format for consistent embedding generation:

```
User: {user_message}
```
