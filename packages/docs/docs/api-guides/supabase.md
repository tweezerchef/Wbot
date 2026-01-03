---
sidebar_position: 2
---

# Supabase Integration

Wbot uses Supabase for authentication, database, and real-time features.

## Client Setup

```typescript
// apps/web/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@wbot/shared';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

## Authentication

### Google OAuth

```typescript
// Sign in with Google
async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('Auth error:', error);
  }
}
```

### Session Management

```typescript
// Get current session
const {
  data: { session },
} = await supabase.auth.getSession();

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // User signed in
    redirectToChat();
  } else if (event === 'SIGNED_OUT') {
    // User signed out
    redirectToLanding();
  }
});
```

### Sign Out

```typescript
async function signOut() {
  await supabase.auth.signOut();
}
```

## Database Operations

### Conversations

```typescript
// apps/web/src/lib/conversations.ts

// Get user's conversations
export async function getConversations() {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Create conversation
export async function createConversation(userId: string, title?: string) {
  const { data, error } = await supabase
    .from('conversations')
    .insert({ user_id: userId, title })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update conversation title
export async function updateConversationTitle(id: string, title: string) {
  const { error } = await supabase.from('conversations').update({ title }).eq('id', id);

  if (error) throw error;
}

// Delete conversation
export async function deleteConversation(id: string) {
  const { error } = await supabase.from('conversations').delete().eq('id', id);

  if (error) throw error;
}
```

### Messages

```typescript
// Get messages for a conversation
export async function getMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Save a message
export async function saveMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      metadata: metadata ?? {},
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### Profiles

```typescript
// Get user profile
export async function getProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (error) throw error;
  return data;
}

// Update profile
export async function updateProfile(
  userId: string,
  updates: { display_name?: string; preferences?: Record<string, unknown> }
) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);

  if (error) throw error;
}
```

## Type Safety

Use generated types for full type safety:

```typescript
import type { Database } from '@wbot/shared';

type Conversation = Database['public']['Tables']['conversations']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

// Insert types
type NewMessage = Database['public']['Tables']['messages']['Insert'];
```

Regenerate types after schema changes:

```bash
pnpm db:generate-types
```

## Error Handling

```typescript
import { PostgrestError } from '@supabase/supabase-js';

async function fetchData() {
  const { data, error } = await supabase.from('conversations').select('*');

  if (error) {
    // Handle specific error codes
    if (error.code === 'PGRST116') {
      // No rows found
      return [];
    }

    // Log and rethrow
    console.error('Supabase error:', error);
    throw error;
  }

  return data;
}
```

## Environment Variables

```bash
# apps/web/.env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJ...

# apps/ai/.env (server-side only!)
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=eyJ...  # Never expose to client!
```

## Local Development

```bash
# Start local Supabase
pnpm db:start

# Access Supabase Studio
# http://localhost:54323

# Stop Supabase
pnpm db:stop
```
