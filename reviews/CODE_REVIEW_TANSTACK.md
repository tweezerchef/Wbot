# Code Review: TanStack Implementation

**Review Date:** January 15, 2026
**Reviewer:** Claude Code
**Scope:** TanStack Start, TanStack Router, TanStack Query implementation in `apps/web`
**Version:** TanStack Start v1.145+, TanStack Router v1.144+, TanStack Query v5.90+

---

## Executive Summary

The Wbot web application demonstrates a **solid foundation** with TanStack Start, Router, and Query. The implementation follows many current best practices, particularly in areas like file-based routing, authentication guards, and SSR data loading. However, there are several opportunities to improve type safety, caching strategies, and leverage more advanced TanStack patterns.

### Overall Assessment

| Area                | Rating        | Summary                                       |
| ------------------- | ------------- | --------------------------------------------- |
| **TanStack Start**  | ✅ Good       | Server functions and SSR well implemented     |
| **TanStack Router** | ✅ Good       | File-based routing, auth guards properly done |
| **TanStack Query**  | ⚠️ Needs Work | Query keys set up but underutilized           |
| **Type Safety**     | ⚠️ Needs Work | Missing router type registration              |
| **Error Handling**  | ✅ Good       | Global error boundary in place                |
| **Performance**     | ✅ Good       | Code splitting, preloading configured         |

---

## Table of Contents

1. [TanStack Start Review](#1-tanstack-start-review)
2. [TanStack Router Review](#2-tanstack-router-review)
3. [TanStack Query Review](#3-tanstack-query-review)
4. [Cross-Cutting Concerns](#4-cross-cutting-concerns)
5. [Priority Recommendations](#5-priority-recommendations)
6. [Action Items](#6-action-items)

---

## 1. TanStack Start Review

### 1.1 Server Functions ✅ Well Implemented

**Current Implementation** (`routes/_authed.tsx:15-27`):

```typescript
const getAuthUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthedUser | null> => {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    return { id: user.id, email: user.email };
  }
);
```

**Assessment:** ✅ Correct pattern

- Properly uses `createServerFn` for server-side auth validation
- Returns typed data (`AuthedUser | null`)
- Server-only code (Supabase server client) correctly isolated

**Minor Improvement:** Add input validation with Zod for server functions that accept input:

```typescript
// Recommended pattern for server functions with input
import { z } from 'zod';

const ConversationIdSchema = z.object({
  conversationId: z.string().uuid(),
});

export const getConversationById = createServerFn({ method: 'GET' })
  .validator(zodValidator(ConversationIdSchema))
  .handler(async ({ data }) => {
    // data.conversationId is validated
    return fetchConversation(data.conversationId);
  });
```

---

### 1.2 SSR Data Loading ✅ Good Pattern

**Current Implementation** (`routes/_authed/chat.tsx:28-53`):

```typescript
const getConversationData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ChatLoaderData> => {
    const supabase = createServerSupabaseClient();
    // ... fetch data
    return { conversationId, messages, userEmail: user.email };
  }
);

export const Route = createFileRoute('/_authed/chat')({
  loader: () => getConversationData(),
  pendingMs: 0,
  pendingComponent: ChatSkeleton,
  component: ChatPage,
});
```

**Assessment:** ✅ Excellent pattern

- Data fetched server-side with cookies
- Redis cache layer for performance
- Immediate skeleton display with `pendingMs: 0`

**Enhancement:** Consider using `defer()` for non-critical data:

```typescript
import { defer } from '@tanstack/react-router';

export const Route = createFileRoute('/_authed/chat')({
  loader: async () => {
    const [conversationData, preferences] = await Promise.all([
      getConversationData(),
      // Non-critical - stream in later
      defer(getUserPreferences()),
    ]);
    return { ...conversationData, preferences };
  },
});
```

---

### 1.3 Supabase SSR Integration ✅ Correct

**Current Implementation** (`lib/supabase/server.ts`):

```typescript
import { getCookies, setCookie } from '@tanstack/react-start/server';

export function createServerSupabaseClient() {
  return createServerClient<Database>(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return Object.entries(getCookies()).map(([name, value]) => ({
            name,
            value,
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach((cookie) => {
            setCookie(cookie.name, cookie.value, cookie.options);
          });
        },
      },
    }
  );
}
```

**Assessment:** ✅ Properly integrates TanStack Start's cookie APIs with Supabase SSR

---

### 1.4 Missing: Middleware Pattern ⚠️

**Current State:** No middleware configured

**Recommendation:** Add middleware for cross-cutting concerns:

```typescript
// lib/middleware/auth.ts
import { createMiddleware } from '@tanstack/react-start';

export const authMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return next({
    context: { user },
  });
});

// Usage in protected server functions
export const getPrivateData = createServerFn()
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    // context.user is typed and available
    return fetchUserData(context.user.id);
  });
```

---

## 2. TanStack Router Review

### 2.1 File-Based Routing ✅ Correct Structure

**Current Structure:**

```
routes/
├── __root.tsx           ✅ Root layout
├── index.tsx            ✅ Landing page
├── signup.tsx           ✅ Public route
├── _authed.tsx          ✅ Pathless auth layout
└── _authed/
    └── chat.tsx         ✅ Protected route
```

**Assessment:** ✅ Follows TanStack Router conventions perfectly

- `__root.tsx` for root layout
- `_authed.tsx` for pathless protected layout
- Underscore prefix correctly used for pathless routes

---

### 2.2 Authentication Guard ✅ Well Implemented

**Current Implementation** (`routes/_authed.tsx:29-44`):

```typescript
export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const user = await getAuthUser();

    if (!user) {
      throw redirect({ to: '/' });
    }

    return { user };
  },
  component: AuthedLayout,
});
```

**Assessment:** ✅ Correct pattern

- Uses `beforeLoad` (not `loader`) for auth checks
- Uses `redirect()` object (TanStack convention)
- Passes user context to child routes

**Enhancement:** Capture redirect location for post-login navigation:

```typescript
beforeLoad: async ({ location }) => {
  const user = await getAuthUser();

  if (!user) {
    throw redirect({
      to: '/',
      search: { redirect: location.href }, // Capture intended destination
    });
  }

  return { user };
},
```

---

### 2.3 Type Safety ⚠️ Needs Improvement

**Issue:** Router type not registered globally

**Current State:** Missing in `router.tsx`:

```typescript
// MISSING: Type registration
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

**Impact:** Top-level hooks like `useNavigate()`, `useSearch()`, `useParams()` lack type safety when used outside route components.

**Fix:**

```typescript
// router.tsx
import type { AnyRouter } from '@tanstack/react-router';

export function getRouter() {
  const queryClient = new QueryClient({ ... });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: NotFound,
  });

  return routerWithQueryClient(router, queryClient);
}

// Register router type for type-safe hooks
export type AppRouter = ReturnType<typeof getRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}
```

---

### 2.4 Using `getRouteApi` ✅ Correct Pattern

**Current Implementation** (`features/chat/components/ChatPage/ChatPage.tsx:42-43`):

```typescript
const routeApi = getRouteApi('/_authed/chat');

export function ChatPage() {
  const loaderData = routeApi.useLoaderData();
  // ...
}
```

**Assessment:** ✅ Correct pattern for accessing route data in components that may be code-split

---

### 2.5 Search Params ⚠️ Not Utilized

**Current State:** No search param validation found

**Recommendation:** Add Zod validation for any routes with search params:

```typescript
// Example: If chat page ever needs search params
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';

const chatSearchSchema = z.object({
  conversationId: z.string().uuid().optional(),
  scrollTo: z.string().optional(),
});

export const Route = createFileRoute('/_authed/chat')({
  validateSearch: zodValidator(chatSearchSchema),
  // ...
});
```

---

### 2.6 Navigation Patterns ✅ Good

**Current Use:** Standard `<Link>` components with proper routing

**Enhancement:** Enable preloading on navigation links:

```typescript
// Current (implicit)
<Link to="/chat">Chat</Link>

// Recommended (explicit intent preloading)
<Link to="/chat" preload="intent">Chat</Link>
```

**Note:** Router already has `defaultPreload: 'intent'` configured in `router.tsx`, so this is already working globally. ✅

---

## 3. TanStack Query Review

### 3.1 QueryClient Configuration ✅ Good

**Current Implementation** (`router.tsx:14-24`):

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false, // Good for chat UX
      retry: 1,
    },
  },
});
```

**Assessment:** ✅ Reasonable defaults for a chat application

- `staleTime: 60000` prevents unnecessary refetches
- `refetchOnWindowFocus: false` appropriate for streaming chat

**Enhancement:** Add `gcTime` and production-aware settings:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000, // Keep unused data 5 minutes
      refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
  },
});
```

---

### 3.2 Query Keys ✅ Good Structure, ⚠️ Underutilized

**Current Implementation** (`lib/queries/conversationKeys.ts`):

```typescript
export const conversationKeys = {
  all: ['conversations'],
  lists: () => [...conversationKeys.all, 'list'],
  list: (userId: string) => [...conversationKeys.lists(), userId],
  details: () => [...conversationKeys.all, 'detail'],
  detail: (id: string) => [...conversationKeys.details(), id],
  messages: (conversationId: string) => [...conversationKeys.detail(conversationId), 'messages'],
};
```

**Assessment:** ✅ Excellent factory pattern following TkDodo's recommendations

**Issue:** Query keys are defined but `useQuery`/`useMutation` are barely used in the codebase. The app primarily uses:

- Server function loaders (good for SSR)
- Direct Supabase client calls (bypasses cache)
- SSE streaming (doesn't fit Query model)

**Recommendation:** Leverage Query for conversation list:

```typescript
// lib/queries/conversationQueries.ts
import { queryOptions } from '@tanstack/react-query';

export function conversationListOptions(userId: string) {
  return queryOptions({
    queryKey: conversationKeys.list(userId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// In ConversationHistory component
function ConversationHistory({ userId }: { userId: string }) {
  const { data: conversations } = useQuery(conversationListOptions(userId));
  // ...
}
```

---

### 3.3 Router + Query Integration ✅ Correct Setup

**Current Implementation** (`router.tsx:33`):

```typescript
return routerWithQueryClient(router, queryClient);
```

**Assessment:** ✅ Properly using `@tanstack/react-router-with-query` for SSR hydration

---

### 3.4 Missing: `queryOptions` Helper ⚠️

**Current State:** Query options defined inline or not at all

**Recommendation:** Create reusable query options:

```typescript
// lib/queries/conversationQueries.ts
import { queryOptions } from '@tanstack/react-query';
import { conversationKeys } from './conversationKeys';

export function conversationDetailOptions(conversationId: string) {
  return queryOptions({
    queryKey: conversationKeys.detail(conversationId),
    queryFn: () => fetchConversation(conversationId),
    staleTime: 5 * 60 * 1000,
  });
}

export function conversationMessagesOptions(conversationId: string) {
  return queryOptions({
    queryKey: conversationKeys.messages(conversationId),
    queryFn: () => fetchMessages(conversationId),
    staleTime: 30 * 1000, // Messages change frequently
  });
}

// Usage - fully type-safe across the app
useQuery(conversationDetailOptions('123'));
useSuspenseQuery(conversationDetailOptions('123'));
queryClient.prefetchQuery(conversationDetailOptions('123'));
```

---

### 3.5 Missing: Mutations for Data Updates ⚠️

**Current State:** Direct Supabase calls without Query integration

**Current Pattern** (`features/chat/components/ChatPage/ChatPage.tsx`):

```typescript
// Direct database call - bypasses Query cache
const newId = await createConversation(session.user.id);
```

**Recommended Pattern:**

```typescript
// lib/queries/conversationMutations.ts
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => createConversation(userId),
    onSuccess: (newConversation, userId) => {
      // Update the list cache
      queryClient.invalidateQueries({
        queryKey: conversationKeys.list(userId),
      });
    },
  });
}

// Usage in component
function ChatPage() {
  const createConversation = useCreateConversation();

  const handleNewChat = async () => {
    const result = await createConversation.mutateAsync(userId);
    setConversationId(result.id);
  };
}
```

---

### 3.6 Suspense Integration ⚠️ Opportunity

**Current State:** Uses `useLoaderData()` for SSR data, no `useSuspenseQuery`

**Opportunity:** For client-side navigation, `useSuspenseQuery` can provide better UX:

```typescript
// Route loader ensures data is in cache
export const Route = createFileRoute('/_authed/chat')({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(
      conversationDetailOptions(await getDefaultConversationId())
    );
  },
});

// Component uses suspense query
function ChatPage() {
  const { data } = useSuspenseQuery(conversationDetailOptions(conversationId));
  // data is always defined
}
```

---

## 4. Cross-Cutting Concerns

### 4.1 Error Handling ✅ Good

**Current Implementation:**

- Global `defaultErrorComponent` configured in router
- `DefaultCatchBoundary` provides recovery UI
- `NotFound` component for 404s

**Enhancement:** Add Query error boundary:

```typescript
// components/QueryErrorBoundary.tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

export function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} fallbackRender={ErrorFallback}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

---

### 4.2 Code Splitting ✅ Configured

**Current Vite Config:**

```typescript
manualChunks: {
  'react-vendor': ['react', 'react-dom'],
  'tanstack-vendor': ['@tanstack/react-query', '@tanstack/react-router'],
  'supabase-vendor': ['@supabase/supabase-js'],
  'shared-vendor': ['zod'],
}
```

**Assessment:** ✅ Good vendor chunking for caching

**Future Enhancement:** Use `.lazy.tsx` files for non-critical route components:

```typescript
// routes/_authed/chat.tsx - Critical config (stays in main bundle)
export const Route = createFileRoute('/_authed/chat')({
  loader: () => getConversationData(),
  pendingMs: 0,
});

// routes/_authed/chat.lazy.tsx - Non-critical (lazy loaded)
export const Route = createLazyFileRoute('/_authed/chat')({
  component: ChatPage,
  pendingComponent: ChatSkeleton,
  errorComponent: ChatError,
});
```

---

### 4.3 Critical CSS ✅ Well Done

**Current Implementation** (`routes/__root.tsx`):

- CSS variables inlined in `<style>` tag
- Base reset styles embedded
- Prevents FOUC (Flash of Unstyled Content)

---

### 4.4 State Sync Pattern ⚠️ Could Be Improved

**Current Pattern** (`ChatPage.tsx`):

```typescript
const loaderData = routeApi.useLoaderData();
const [messages, setMessages] = useState<Message[]>(loaderData.messages);

useEffect(() => {
  setMessages(loaderData.messages);
  setConversationId(loaderData.conversationId);
}, [loaderData.messages, loaderData.conversationId]);
```

**Issue:** Manual state sync between loader data and component state

**Better Pattern:** Use loader data directly or Query cache as source of truth:

```typescript
// Option 1: Direct loader data (if not mutating locally)
function ChatPage() {
  const { messages } = routeApi.useLoaderData();
  // Use messages directly, no useState needed
}

// Option 2: Query as source of truth
function ChatPage() {
  const { conversationId } = routeApi.useLoaderData();
  const { data: messages } = useQuery(conversationMessagesOptions(conversationId));
  // Mutations update the cache, component re-renders
}
```

**Note:** The current pattern is necessary because of SSE streaming updates. Consider using Query's `setQueryData` for streaming updates:

```typescript
// Update cache directly during streaming
for await (const event of client.streamMessage(...)) {
  if (event.type === 'done') {
    queryClient.setQueryData(
      conversationKeys.messages(conversationId),
      (old) => [...old, newMessage]
    );
  }
}
```

---

## 5. Priority Recommendations

### High Priority

| #   | Issue                              | Impact                      | Effort |
| --- | ---------------------------------- | --------------------------- | ------ |
| 1   | Add router type registration       | Type safety for hooks       | Low    |
| 2   | Create `queryOptions` wrappers     | Type-safe, reusable queries | Medium |
| 3   | Add mutations for database updates | Cache consistency           | Medium |

### Medium Priority

| #   | Issue                                  | Impact                | Effort |
| --- | -------------------------------------- | --------------------- | ------ |
| 4   | Add Zod validation to server functions | Runtime safety        | Low    |
| 5   | Implement auth middleware              | DRY, centralized auth | Medium |
| 6   | Add `QueryErrorResetBoundary`          | Better error recovery | Low    |

### Low Priority

| #   | Issue                               | Impact           | Effort |
| --- | ----------------------------------- | ---------------- | ------ |
| 7   | Use `.lazy.tsx` for code splitting  | Bundle size      | Low    |
| 8   | Add `defer()` for non-critical data | TTFB improvement | Low    |
| 9   | Add redirect capture in auth guard  | Better UX        | Low    |

---

## 6. Action Items

### Immediate (This Sprint)

- [ ] **Add router type registration** in `router.tsx`

  ```typescript
  declare module '@tanstack/react-router' {
    interface Register {
      router: AppRouter;
    }
  }
  ```

- [ ] **Create `conversationQueries.ts`** with `queryOptions` wrappers
  - `conversationDetailOptions(id)`
  - `conversationMessagesOptions(id)`
  - `conversationListOptions(userId)`

- [ ] **Create `conversationMutations.ts`** for database operations
  - `useCreateConversation()`
  - `useDeleteConversation()`
  - `useTouchConversation()` (update timestamp)

### Next Sprint

- [ ] **Add auth middleware** for server functions
- [ ] **Add Zod validators** to server functions with input
- [ ] **Wrap main app with `QueryErrorResetBoundary`**

### Backlog

- [ ] Evaluate `.lazy.tsx` code splitting for route components
- [ ] Add `defer()` for non-critical data loading
- [ ] Capture redirect location in auth guard

---

## Appendix: Code Snippets

### A. Complete Router Type Registration

```typescript
// router.tsx
import { QueryClient } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import { routeTree } from './routeTree.gen';

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 2,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: NotFound,
  });

  return routerWithQueryClient(router, queryClient);
}

// Type registration for type-safe hooks
export type AppRouter = ReturnType<typeof getRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}
```

### B. Complete Query Options Pattern

```typescript
// lib/queries/conversationQueries.ts
import { queryOptions } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { conversationKeys } from './conversationKeys';
import type { Message, Conversation } from '@wbot/shared';

export function conversationListOptions(userId: string) {
  return queryOptions({
    queryKey: conversationKeys.list(userId),
    queryFn: async (): Promise<Conversation[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function conversationMessagesOptions(conversationId: string) {
  return queryOptions({
    queryKey: conversationKeys.messages(conversationId),
    queryFn: async (): Promise<Message[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 30 * 1000,
  });
}
```

### C. Complete Mutation Pattern

```typescript
// lib/queries/conversationMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { conversationKeys } from './conversationKeys';

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('conversations')
        .insert({ user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, userId) => {
      queryClient.invalidateQueries({
        queryKey: conversationKeys.list(userId),
      });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from('conversations').delete().eq('id', conversationId);

      if (error) throw error;
      return { conversationId, userId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: conversationKeys.list(data.userId),
      });
      queryClient.removeQueries({
        queryKey: conversationKeys.detail(data.conversationId),
      });
    },
  });
}
```

---

## References

- [TanStack Start Documentation](https://tanstack.com/start/latest/docs)
- [TanStack Router Documentation](https://tanstack.com/router/latest/docs)
- [TanStack Query Documentation](https://tanstack.com/query/v5/docs)
- [TkDodo's Blog - Effective React Query Keys](https://tkdodo.eu/blog/effective-react-query-keys)
- [TkDodo's Blog - The Query Options API](https://tkdodo.eu/blog/the-query-options-api)

---

_Last updated: January 15, 2026_
