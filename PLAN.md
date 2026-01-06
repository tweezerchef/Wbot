# SSR Fix: Eliminate FOUC with TanStack Query Integration

## Problem

The app shows a flash of unstyled/minimal content when navigating because:

1. Pages render with loading states first (`isLoading: true`)
2. Auth checks happen client-side via `useEffect` after hydration
3. QueryClient is not integrated with the router for SSR prefetching
4. Data is fetched client-side instead of being prefetched and hydrated

## Solution

Integrate TanStack Query with TanStack Router for proper SSR:

- Prefetch data in route loaders (runs on server)
- Dehydrate query cache and send with HTML
- Hydrate on client - components render immediately with cached data
- No loading states, no FOUC

## Implementation Steps

### Step 1: Set Up Router + Query SSR Integration

**File: `apps/web/src/router.tsx`**

```typescript
import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';

import { routeTree } from './routeTree.gen';

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  });

  return routerWithQueryClient(
    createRouter({
      routeTree,
      defaultPreload: 'intent',
      context: { queryClient },
    }),
    queryClient
  );
}
```

### Step 2: Update Root Route with Context

**File: `apps/web/src/routes/__root.tsx`**

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRouteWithContext } from '@tanstack/react-router';

// Define router context type
interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  // ... existing head config
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* ... existing layout */}
      <Outlet />
    </QueryClientProvider>
  );
}
```

### Step 3: Create Auth Query Options

**File: `apps/web/src/lib/auth.ts`**

```typescript
import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';

// Server function to get auth state
const getAuthState = createServerFn({ method: 'GET' }).handler(async () => {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isAuthenticated: false, user: null, hasCompletedOnboarding: false };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', user.id)
    .single();

  const preferences = profile?.preferences as Record<string, unknown> | null;
  const hasCompletedOnboarding = preferences && Object.keys(preferences).length > 0;

  return { isAuthenticated: true, user, hasCompletedOnboarding };
});

// Query options for reuse across routes
export const authQueryOptions = () =>
  queryOptions({
    queryKey: ['auth'],
    queryFn: getAuthState,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
```

### Step 4: Update Landing Page Route

**File: `apps/web/src/routes/index.tsx`**

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router';
import { authQueryOptions } from '../lib/auth';
import { LandingPage } from '../components/pages';

export const Route = createFileRoute('/')({
  // Prefetch auth state on server
  loader: async ({ context }) => {
    const authData = await context.queryClient.ensureQueryData(authQueryOptions());

    // Server-side redirect if authenticated
    if (authData.isAuthenticated) {
      if (authData.hasCompletedOnboarding) {
        throw redirect({ to: '/chat' });
      } else {
        throw redirect({ to: '/signup' });
      }
    }

    return authData;
  },
  component: LandingPage,
});
```

### Step 5: Update Landing Page Component

**File: `apps/web/src/components/pages/LandingPage/LandingPage.tsx`**

Remove all `useEffect` auth checking. The component just renders - auth is already handled by the loader:

```typescript
export function LandingPage() {
  // No loading state needed - if we're here, user is not authenticated
  // Auth was already checked in the route loader

  return (
    <div className={styles.container}>
      {/* ... existing UI */}
    </div>
  );
}
```

### Step 6: Update Chat Route

**File: `apps/web/src/routes/chat.tsx`**

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router';
import { authQueryOptions } from '../lib/auth';
import { conversationQueryOptions } from '../lib/conversations';

export const Route = createFileRoute('/chat')({
  loader: async ({ context }) => {
    // Prefetch auth - redirect if not authenticated
    const authData = await context.queryClient.ensureQueryData(authQueryOptions());

    if (!authData.isAuthenticated) {
      throw redirect({ to: '/' });
    }

    if (!authData.hasCompletedOnboarding) {
      throw redirect({ to: '/signup' });
    }

    // Prefetch conversation data (existing server function)
    await context.queryClient.prefetchQuery(conversationQueryOptions(authData.user.id));

    return {};
  },
  component: ChatPage,
});
```

### Step 7: Update ChatPage to Use Query

**File: `apps/web/src/components/pages/ChatPage/ChatPage.tsx`**

```typescript
import { useSuspenseQuery } from '@tanstack/react-query';
import { conversationQueryOptions } from '../../../lib/conversations';

export function ChatPage() {
  // Data is already in cache from loader - renders immediately
  const { data } = useSuspenseQuery(conversationQueryOptions());

  const [messages, setMessages] = useState<Message[]>(data.messages);
  const [conversationId, setConversationId] = useState<string | null>(data.conversationId);

  // ... rest of component
}
```

## Files to Modify

1. `apps/web/src/router.tsx` - Add Query SSR integration
2. `apps/web/src/routes/__root.tsx` - Use `createRootRouteWithContext`
3. `apps/web/src/lib/auth.ts` (new) - Auth query options
4. `apps/web/src/routes/index.tsx` - Prefetch auth in loader
5. `apps/web/src/routes/chat.tsx` - Prefetch auth + conversation in loader
6. `apps/web/src/components/pages/LandingPage/LandingPage.tsx` - Remove useEffect
7. `apps/web/src/components/pages/ChatPage/ChatPage.tsx` - Use useSuspenseQuery

## Dependencies to Add

```bash
pnpm add @tanstack/react-router-with-query --filter @wbot/web
```

## Benefits

1. **No FOUC** - HTML arrives fully rendered with styles
2. **No loading spinners on initial load** - Data is prefetched
3. **Server-side redirects** - Auth redirects happen before HTML is sent
4. **Eliminates useEffect for data fetching** - Uses TanStack Query patterns
5. **Cacheable** - Query cache enables instant navigation between routes

## Sources

- [TanStack Query SSR Guide](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [TanStack Router + Query Integration](https://tanstack.com/router/latest/docs/integrations/query)
- [Using Server Functions with TanStack Query](https://www.brenelz.com/posts/using-server-functions-and-tanstack-query/)
- [Advanced Server Rendering](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
