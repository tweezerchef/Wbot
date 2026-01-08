# TanStack Best Practices Audit Report

**Date:** January 8, 2026
**Application:** Wbot Web App (`apps/web`)
**Auditor:** Claude Code
**TanStack Start Version:** 1.145.5
**TanStack Router Version:** 1.144.0
**TanStack Query Version:** 5.90.16

---

## Executive Summary

This audit evaluates the Wbot web application against TanStack Start, TanStack Router, and TanStack Query best practices. The findings are based on:

1. Official TanStack documentation
2. TanStack Start GitHub examples (`start-basic`, `start-supabase-basic`, `start-basic-react-query`)
3. Community best practices and production tips

**Overall Assessment:** The application follows many TanStack best practices but has several areas for improvement, particularly around TanStack Query integration and file structure conventions.

### Quick Score Summary

| Category                   | Status    | Score |
| -------------------------- | --------- | ----- |
| Vite Configuration         | Excellent | 95%   |
| Router Configuration       | Excellent | 95%   |
| File-Based Routing         | Excellent | 90%   |
| Server Functions           | Excellent | 95%   |
| TanStack Query Integration | Good      | 85%   |
| SSR Configuration          | Excellent | 90%   |
| TypeScript Configuration   | Excellent | 95%   |
| File Structure             | Good      | 75%   |
| Component Organization     | Excellent | 90%   |

---

## Implementation Status (Updated January 8, 2026)

The following improvements were implemented based on this audit:

### Completed

1. **Router Configuration** (Phase 1)
   - Moved QueryClient creation inside `getRouter()` for SSR safety
   - Added `routerWithQueryClient()` for proper hydration/streaming
   - Added `DefaultCatchBoundary` as global error component
   - Updated type registration for context

2. **Root Layout** (Phase 1)
   - Changed to `createRootRouteWithContext<RouterContext>()`
   - QueryClient now received from router context instead of module-level

3. **Protected Route Layout** (Phase 2)
   - Created `_authed.tsx` pathless layout for authentication
   - Auth check in `beforeLoad` with redirect on failure
   - User context passed to child routes

4. **Chat Route Migration** (Phase 2)
   - Moved from `/routes/chat.tsx` to `/routes/_authed/chat.tsx`
   - Simplified loader since auth is handled by parent layout

5. **Query Patterns** (Phase 3)
   - Created `lib/queries/conversationKeys.ts` with hierarchical key factory
   - Created `lib/queries/conversations.ts` with queryOptions patterns
   - Ready for future Query adoption

6. **Testing & Documentation**
   - Added tests for `DefaultCatchBoundary` component
   - Added tests for query key factory
   - Added Storybook story for `DefaultCatchBoundary`

---

## Table of Contents

1. [Vite Configuration](#1-vite-configuration)
2. [Router Configuration](#2-router-configuration)
3. [File-Based Routing](#3-file-based-routing)
4. [Server Functions](#4-server-functions)
5. [TanStack Query Integration](#5-tanstack-query-integration)
6. [SSR Configuration](#6-ssr-configuration)
7. [TypeScript Configuration](#7-typescript-configuration)
8. [File Structure Analysis](#8-file-structure-analysis)
9. [Component Organization](#9-component-organization)
10. [Authentication Patterns](#10-authentication-patterns)
11. [Recommendations Summary](#11-recommendations-summary)
12. [Implementation Priority](#12-implementation-priority)

---

## 1. Vite Configuration

**File:** `apps/web/vite.config.ts`

### Current Implementation

```typescript
export default defineConfig({
  envDir: monorepoRoot,
  css: { modules: { localsConvention: 'camelCase' }, devSourcemap: true },
  plugins: [
    tanstackStart(),           // Correct order - first
    react({ babel: { plugins: [['babel-plugin-react-compiler', {}]] } }),
    tsConfigPaths({ projects: ['./tsconfig.json'] }),
    visualizer({ ... }),
  ],
  environments: { client: { build: { rollupOptions: { output: { manualChunks: { ... } } } } } },
});
```

### Best Practice Comparison

| Aspect                      | Expected               | Current        | Status   |
| --------------------------- | ---------------------- | -------------- | -------- |
| TanStack Start plugin order | First in plugins array | First          | ✅       |
| React plugin after TanStack | After tanstackStart()  | After          | ✅       |
| TypeScript paths            | vite-tsconfig-paths    | Configured     | ✅       |
| CSS Modules                 | camelCase convention   | Configured     | ✅       |
| Manual chunks               | Vendor splitting       | Implemented    | ✅       |
| Server port                 | Configure if needed    | Not configured | ⚠️ Minor |

### Recommendations

1. **Add explicit server port** (optional but recommended for team consistency):

   ```typescript
   server: {
     port: 3000,
     open: false,
   },
   ```

2. **Consider adding Nitro preset** for deployment configuration:
   ```typescript
   tanstackStart({
     nitro: {
       preset: 'node-server', // or 'vercel', 'cloudflare', etc.
     },
   }),
   ```

**Score: 95%** - Excellent configuration with minor optional enhancements.

---

## 2. Router Configuration

**File:** `apps/web/src/router.tsx`

### Current Implementation

```typescript
export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultNotFoundComponent: NotFound,
  });
}
```

### Best Practice Comparison

| Aspect                   | Expected                   | Current      | Status |
| ------------------------ | -------------------------- | ------------ | ------ |
| Factory function pattern | `getRouter()` function     | Implemented  | ✅     |
| Route tree import        | Auto-generated             | Correct      | ✅     |
| Preload strategy         | `'intent'` for hover-based | Configured   | ✅     |
| NotFound component       | Global default             | Configured   | ✅     |
| Error boundary           | `defaultErrorComponent`    | **Missing**  | ❌     |
| QueryClient context      | Pass via `context`         | **Missing**  | ❌     |
| SSR Query integration    | `routerWithQueryClient`    | **Not used** | ❌     |

### Critical Missing Patterns

#### 1. Missing Error Boundary

Official examples include a global error component:

```typescript
import { DefaultCatchBoundary } from './components/DefaultCatchBoundary';

export function getRouter() {
  return createRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultErrorComponent: DefaultCatchBoundary, // Add this
    defaultNotFoundComponent: NotFound,
  });
}
```

#### 2. Missing QueryClient Integration

For proper SSR hydration with TanStack Query, the router should use `routerWithQueryClient`:

```typescript
import { QueryClient } from '@tanstack/react-query';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    context: { queryClient }, // Pass QueryClient to loaders
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: NotFound,
  });

  return routerWithQueryClient(router, queryClient);
}
```

**Score: 80%** - Good foundation but missing critical Query integration.

---

## 3. File-Based Routing

**Directory:** `apps/web/src/routes/`

### Current Implementation

```
routes/
├── __root.tsx      # Root layout (correct)
├── index.tsx       # "/" route
├── chat.tsx        # "/chat" route
├── signup.tsx      # "/signup" route
└── routeTree.gen.ts # Auto-generated (correct)
```

### Best Practice Comparison

| Aspect            | Expected                          | Current      | Status |
| ----------------- | --------------------------------- | ------------ | ------ |
| Root layout       | `__root.tsx`                      | Present      | ✅     |
| Index route       | `index.tsx`                       | Present      | ✅     |
| Route naming      | Match URL structure               | Correct      | ✅     |
| Pathless layouts  | `_layoutName.tsx` for auth guards | **Not used** | ⚠️     |
| Route co-location | `-components/` prefix             | **Not used** | ⚠️     |

### Recommendations

#### 1. Add Protected Route Layout

Currently, auth checks happen inside `ChatPage`. Better pattern:

**Create:** `routes/_authed.tsx`

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw redirect({ to: '/' });
    }

    return { user };
  },
});
```

**Create:** `routes/_authed/chat.tsx` (move from `routes/chat.tsx`)

```typescript
export const Route = createFileRoute('/_authed/chat')({
  loader: ({ context }) => getConversationData(context.user.id),
  component: ChatPage,
});
```

#### 2. Route-Level Co-location

For route-specific components, use the `-` prefix convention:

```
routes/
├── chat.tsx
├── chat/
│   └── -components/
│       ├── MessageList.tsx
│       └── ChatInput.tsx
```

Files prefixed with `-` are ignored by the router but keep code organized.

**Score: 75%** - Correct basics, missing advanced patterns.

---

## 4. Server Functions

**File:** `apps/web/src/routes/chat.tsx`

### Current Implementation

```typescript
const getConversationData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ChatLoaderData> => {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // ... fetch conversations
  }
);

export const Route = createFileRoute('/chat')({
  loader: () => getConversationData(),
  component: ChatPage,
});
```

### Best Practice Comparison

| Aspect                    | Expected                        | Current     | Status |
| ------------------------- | ------------------------------- | ----------- | ------ |
| Server function creation  | `createServerFn()`              | Correct     | ✅     |
| HTTP method specification | `{ method: 'GET' }` for loaders | Correct     | ✅     |
| Handler pattern           | `.handler()` with async fn      | Correct     | ✅     |
| Error handling            | Try/catch with fallback         | Implemented | ✅     |
| Cookie access             | Server-side Supabase client     | Correct     | ✅     |
| Input validation          | `.validator()` for POST         | N/A for GET | ✅     |

### Missing: `notFound()` Helper

For resources that may not exist:

```typescript
import { notFound } from '@tanstack/react-start';

const getConversationData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ChatLoaderData> => {
    // If conversation required but not found:
    throw notFound();
  }
);
```

**Score: 95%** - Excellent server function implementation.

---

## 5. TanStack Query Integration

### Current State

**Critical Finding:** TanStack Query is configured but **significantly underutilized**.

### Current Implementation

```typescript
// __root.tsx
const queryClient = new QueryClient({ ... });

function RootDocument({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### Problems Identified

| Issue                                  | Impact                                | Severity  |
| -------------------------------------- | ------------------------------------- | --------- |
| QueryClient outside request scope      | Data can leak between users in SSR    | 🔴 High   |
| No `routerWithQueryClient` integration | Queries don't stream/hydrate properly | 🔴 High   |
| No `queryOptions` pattern              | Duplicate query configs, no reuse     | 🟡 Medium |
| No query key factory                   | Inconsistent cache invalidation       | 🟡 Medium |
| No `useSuspenseQuery` usage            | Missing SSR data prefetching          | 🟡 Medium |

### Recommended Architecture

#### 1. Move QueryClient to Router Factory

```typescript
// router.tsx
import { QueryClient } from '@tanstack/react-query';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';

export function getRouter() {
  // Create per-request QueryClient for SSR safety
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
  });

  return routerWithQueryClient(router, queryClient);
}
```

#### 2. Update Root Route for Context

```typescript
// __root.tsx
import { createRootRouteWithContext } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({ ... }),
  shellComponent: RootDocument,
});

function RootDocument({ children }) {
  const { queryClient } = Route.useRouteContext();

  return (
    <html>
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

#### 3. Create Query Options Pattern

**Create:** `lib/queries/conversationKeys.ts`

```typescript
export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (userId: string) => [...conversationKeys.lists(), userId] as const,
  details: () => [...conversationKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
  messages: (conversationId: string) =>
    [...conversationKeys.detail(conversationId), 'messages'] as const,
};
```

**Create:** `lib/queries/conversations.ts`

```typescript
import { queryOptions } from '@tanstack/react-query';
import { conversationKeys } from './conversationKeys';

export const conversationListOptions = (userId: string) =>
  queryOptions({
    queryKey: conversationKeys.list(userId),
    queryFn: () => getConversationsServerFn({ data: userId }),
    staleTime: 5 * 60 * 1000,
  });

export const conversationMessagesOptions = (conversationId: string) =>
  queryOptions({
    queryKey: conversationKeys.messages(conversationId),
    queryFn: () => getMessagesServerFn({ data: conversationId }),
    staleTime: 60 * 1000,
  });
```

#### 4. Use in Route Loaders

```typescript
// routes/_authed/chat.tsx
export const Route = createFileRoute('/_authed/chat')({
  loader: async ({ context }) => {
    const { queryClient, user } = context;

    // Prefetch conversation list for SSR
    await queryClient.ensureQueryData(conversationListOptions(user.id));

    // Get most recent and prefetch its messages
    const conversations = queryClient.getQueryData(conversationKeys.list(user.id));

    if (conversations?.[0]) {
      await queryClient.ensureQueryData(conversationMessagesOptions(conversations[0].id));
    }
  },
  component: ChatPage,
});
```

**Score: 50%** - Query is available but integration is incomplete.

---

## 6. SSR Configuration

### Current Implementation

**Root Layout (`__root.tsx`):**

- `head()` for meta tags ✅
- `shellComponent` for document shell ✅
- Critical CSS inlined ✅
- `<HeadContent />` and `<Scripts />` ✅

**Server Functions:**

- Supabase SSR client with cookies ✅
- Redis caching for messages ✅

### Best Practice Comparison

| Aspect                 | Expected                     | Current      | Status |
| ---------------------- | ---------------------------- | ------------ | ------ |
| Meta tags via `head()` | Route-level meta             | Implemented  | ✅     |
| Document shell         | `shellComponent`             | Implemented  | ✅     |
| Critical CSS           | Inline for FOUC prevention   | Implemented  | ✅     |
| HeadContent/Scripts    | TanStack components          | Present      | ✅     |
| SSR-safe Supabase      | `@supabase/ssr`              | Correct      | ✅     |
| Selective SSR          | `ssr: false` for client-only | **Not used** | ⚠️     |

### Recommendations

#### 1. Consider Selective SSR

For pages that don't need SSR (e.g., settings with localStorage):

```typescript
export const Route = createFileRoute('/settings')({
  ssr: false, // Render only on client
  component: SettingsPage,
});
```

#### 2. Data-Only SSR for Dashboard

If component is complex but data is simple:

```typescript
export const Route = createFileRoute('/dashboard')({
  ssr: 'data-only', // Fetch data on server, render on client
  loader: () => getDashboardData(),
  component: Dashboard,
});
```

**Score: 90%** - Excellent SSR setup with minor optimization opportunities.

---

## 7. TypeScript Configuration

**File:** `apps/web/tsconfig.json`

### Current Implementation

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@wbot/shared": ["../../packages/shared/src"]
    }
  }
}
```

### Best Practice Comparison

| Aspect            | Expected                    | Current   | Status |
| ----------------- | --------------------------- | --------- | ------ |
| Module resolution | `"bundler"` for Vite        | Correct   | ✅     |
| Strict mode       | Enabled                     | Enabled   | ✅     |
| Path aliases      | `@/` or `~/` convention     | `@/` used | ✅     |
| JSX transform     | `"react-jsx"` for React 17+ | Correct   | ✅     |
| Skip lib check    | For faster builds           | Enabled   | ✅     |
| Isolated modules  | Required for bundlers       | Enabled   | ✅     |

### Minor Recommendation

Consider using `~/` instead of `@/` to match TanStack examples, but this is purely preference:

```json
"paths": {
  "~/*": ["./src/*"]  // Match TanStack convention
}
```

**Score: 95%** - Excellent TypeScript configuration.

---

## 8. File Structure Analysis

### Current Structure

```
apps/web/src/
├── components/              # All UI components
│   ├── pages/               # Page components (ChatPage, LandingPage, SignupPage)
│   ├── BreathingExercise/   # Feature component
│   ├── GuidedMeditation/    # Feature component
│   ├── buttons/             # Icon components
│   └── ...
├── lib/                     # Utilities
│   ├── supabase/            # Client/server split
│   ├── ai-client.ts
│   ├── conversations.ts
│   ├── conversations.server.ts
│   └── ...
├── routes/                  # File-based routes
├── styles/                  # Global styles
└── router.tsx
```

### Issues Identified

| Issue                            | Description                    | Severity  |
| -------------------------------- | ------------------------------ | --------- |
| Flat component structure         | All components in one folder   | 🟡 Medium |
| No `types/` directory            | Types scattered across files   | 🟡 Medium |
| No `hooks/` directory            | Hooks inside component folders | 🟢 Low    |
| Page components in `components/` | Should be closer to routes     | 🟡 Medium |
| No query options directory       | Missing `lib/queries/`         | 🟡 Medium |

### Recommended Structure

Based on TanStack examples and best practices:

```
apps/web/src/
├── components/              # Shared UI components only
│   ├── ui/                  # Atomic UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── forms/               # Form components
│   ├── layout/              # Layout components
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── DefaultCatchBoundary.tsx  # Error boundary
│   └── NotFound.tsx
│
├── features/                # Feature-based organization
│   ├── chat/
│   │   ├── components/
│   │   │   ├── ChatPage.tsx
│   │   │   ├── MessageList.tsx
│   │   │   └── ChatInput.tsx
│   │   ├── hooks/
│   │   │   └── useChat.ts
│   │   └── types.ts
│   ├── breathing/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types.ts
│   └── meditation/
│       ├── components/
│       ├── hooks/
│       └── types.ts
│
├── lib/                     # Core utilities
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── queries/             # NEW: Query options
│   │   ├── conversationKeys.ts
│   │   ├── conversations.ts
│   │   └── messages.ts
│   ├── ai-client.ts
│   └── redis.ts
│
├── routes/                  # File-based routing
│   ├── __root.tsx
│   ├── index.tsx
│   ├── signup.tsx
│   ├── _authed.tsx          # NEW: Protected layout
│   └── _authed/
│       └── chat.tsx
│
├── styles/
│   ├── globals.css
│   └── variables.css
│
├── types/                   # NEW: Global types
│   ├── router.ts            # Router type registration
│   └── index.ts
│
└── router.tsx
```

### Key Changes

1. **Feature-based organization** - Group related components, hooks, and types by feature
2. **Separated UI components** - Atomic UI in `components/ui/`
3. **Query options** - Add `lib/queries/` for TanStack Query patterns
4. **Protected route layout** - Use `_authed.tsx` pattern
5. **Types directory** - Centralize shared types

**Score: 65%** - Functional but could benefit from reorganization.

---

## 9. Component Organization

### Current Pattern

```
ComponentName/
├── ComponentName.tsx        # Main component
├── ComponentName.module.css # Styles
├── index.ts                 # Re-export
├── types.ts                 # Type definitions
├── useCustomHook.ts         # Custom hooks
└── __tests__/               # Tests
```

### Best Practice Comparison

| Aspect           | Expected                     | Current | Status |
| ---------------- | ---------------------------- | ------- | ------ |
| Named exports    | `export function Component`  | Used    | ✅     |
| CSS Modules      | Co-located `.module.css`     | Used    | ✅     |
| Index re-exports | Clean imports                | Used    | ✅     |
| Type separation  | `types.ts` for complex types | Used    | ✅     |
| Hook co-location | Alongside component          | Used    | ✅     |
| Test co-location | `__tests__/` folder          | Used    | ✅     |

**Score: 90%** - Excellent component organization.

---

## 10. Authentication Patterns

### Current Implementation

**Server-side (`lib/supabase/server.ts`):**

```typescript
export function createServerSupabaseClient() {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return Object.entries(getCookies()).map(...); },
      setAll(cookies) { cookies.forEach(c => setCookie(...)); },
    },
  });
}
```

**In Route Loader (`routes/chat.tsx`):**

```typescript
const supabase = createServerSupabaseClient();
const {
  data: { user },
} = await supabase.auth.getUser();
```

### Best Practice Comparison

| Aspect                | Expected                 | Current       | Status |
| --------------------- | ------------------------ | ------------- | ------ |
| Supabase SSR package  | `@supabase/ssr`          | Used          | ✅     |
| Server client factory | Per-request creation     | Implemented   | ✅     |
| Cookie handling       | TanStack Start helpers   | Used          | ✅     |
| Auth in loaders       | `beforeLoad` or `loader` | In loader     | ⚠️     |
| Protected routes      | Pathless layout pattern  | **Not used**  | ❌     |
| Redirect on auth fail | `throw redirect()`       | Returns empty | ⚠️     |

### Recommendations

#### 1. Use `beforeLoad` for Auth Checks

Auth checks belong in `beforeLoad`, not `loader`:

```typescript
export const Route = createFileRoute('/chat')({
  beforeLoad: async () => {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw redirect({ to: '/' });
    }

    return { user };
  },
  loader: ({ context }) => getConversationData(context.user.id),
  component: ChatPage,
});
```

#### 2. Use Pathless Layout for Multiple Protected Routes

If adding more protected routes:

```typescript
// routes/_authed.tsx
export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const user = await getAuthUser();
    if (!user) throw redirect({ to: '/' });
    return { user };
  },
});

// routes/_authed/chat.tsx (automatically protected)
// routes/_authed/settings.tsx (automatically protected)
// routes/_authed/profile.tsx (automatically protected)
```

**Score: 75%** - Good foundation, missing advanced patterns.

---

## 11. Recommendations Summary

### High Priority (Implement First)

| #   | Issue                         | Recommendation                | Impact                |
| --- | ----------------------------- | ----------------------------- | --------------------- |
| 1   | QueryClient per-request       | Move to `getRouter()` factory | Data isolation in SSR |
| 2   | Router Query integration      | Use `routerWithQueryClient()` | Proper hydration      |
| 3   | Missing error boundary        | Add `DefaultCatchBoundary`    | Error handling        |
| 4   | Auth in loader not beforeLoad | Move auth to `beforeLoad`     | Security + redirects  |

### Medium Priority (Improve Next)

| #   | Issue                     | Recommendation                      | Impact            |
| --- | ------------------------- | ----------------------------------- | ----------------- |
| 5   | No query key factory      | Create `lib/queries/` directory     | Cache consistency |
| 6   | No queryOptions pattern   | Create reusable query options       | Code reuse        |
| 7   | Flat file structure       | Consider feature-based organization | Maintainability   |
| 8   | No protected route layout | Add `_authed.tsx` pattern           | Scalability       |

### Low Priority (Nice to Have)

| #   | Issue                 | Recommendation                     | Impact       |
| --- | --------------------- | ---------------------------------- | ------------ |
| 9   | Path alias convention | Consider `~/` to match examples    | Consistency  |
| 10  | Selective SSR         | Add `ssr: false` where appropriate | Performance  |
| 11  | Route co-location     | Use `-components/` prefix          | Organization |

---

## 12. Implementation Priority

### Phase 1: Critical Query Integration (1-2 days)

1. **Update `router.tsx`:**
   - Create QueryClient inside `getRouter()`
   - Add router context with QueryClient
   - Wrap with `routerWithQueryClient()`

2. **Update `__root.tsx`:**
   - Use `createRootRouteWithContext<RouterContext>()`
   - Get QueryClient from context

3. **Add `DefaultCatchBoundary.tsx`:**
   - Create global error component
   - Configure in router

### Phase 2: Auth Pattern Improvements (1 day)

1. **Move auth to `beforeLoad`:**
   - Redirect on auth failure
   - Pass user in context

2. **Consider `_authed.tsx` layout:**
   - If adding more protected routes
   - DRY auth checks

### Phase 3: Query Patterns (1-2 days)

1. **Create `lib/queries/`:**
   - `conversationKeys.ts`
   - `conversations.ts` with `queryOptions()`

2. **Update components:**
   - Use `useSuspenseQuery` for SSR data
   - Use `useQuery` for client-only data

### Phase 4: File Structure (Optional, 2-3 days)

1. **Evaluate feature-based structure:**
   - May not be necessary for current size
   - Consider as app grows

---

## Appendix: Reference Links

- [TanStack Start Documentation](https://tanstack.com/start/latest/docs/framework/react/overview)
- [TanStack Router File-Based Routing](https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing)
- [TanStack Query SSR Guide](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [TanStack Start Examples](https://github.com/TanStack/router/tree/main/examples/react)
- [Supabase TanStack Start Integration](https://supabase.com/docs/guides/getting-started/quickstarts/tanstack)

---

_Report generated by Claude Code - January 8, 2026_
