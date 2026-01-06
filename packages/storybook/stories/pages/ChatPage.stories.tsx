import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';

import { useStorybookAuth } from '../../.storybook/context/AuthContext';

import { ChatPage } from '@/components/pages/ChatPage/ChatPage';
import type { Message } from '@/lib/ai-client';
import { getMostRecentConversation, loadMessages } from '@/lib/conversations';

// ============================================================================
// Types
// ============================================================================

interface ChatLoaderData {
  conversationId: string | null;
  messages: Message[];
}

// ============================================================================
// Router Setup with Dynamic Loader Data
// ============================================================================

/**
 * Creates a router with the /chat route that provides loader data.
 * The loader data is passed in so we can use real fetched data.
 */
function createRouterWithLoaderData(loaderData: ChatLoaderData) {
  // Create root route with Outlet for child routes
  const rootRoute = createRootRoute({
    component: Outlet,
  });

  // Create /chat route with loader that returns the provided data
  const chatRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/chat',
    loader: () => loaderData,
    component: ChatPage,
  });

  // Also add index route for completeness
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
  });

  // Build route tree
  const routeTree = rootRoute.addChildren([indexRoute, chatRoute]);

  // Create router with memory history starting at /chat
  return createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: ['/chat'] }),
  });
}

// ============================================================================
// Wrapper Component with Real Data Fetching
// ============================================================================

/**
 * Wrapper that fetches real conversation data and provides it to ChatPage.
 *
 * Uses the authenticated session from Storybook's AuthDecorator to:
 * 1. Get the user's most recent conversation
 * 2. Load all messages for that conversation
 * 3. Provide the data via TanStack Router's loader
 */
function ChatPageWithRealData(): ReactElement {
  const { user, isAuthenticated, isLoading: authLoading } = useStorybookAuth();
  const [loaderData, setLoaderData] = useState<ChatLoaderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [router, setRouter] = useState<ReturnType<typeof createRouterWithLoaderData> | null>(null);
  const [routerReady, setRouterReady] = useState(false);

  // Fetch conversation data when authenticated
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      setError('Not authenticated. Please check your test user credentials.');
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      if (!user) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get the user's most recent conversation
        const conversationId = await getMostRecentConversation(user.id);

        let messages: Message[] = [];
        if (conversationId) {
          // Load messages for the conversation
          messages = await loadMessages(conversationId);
        }

        const data: ChatLoaderData = {
          conversationId,
          messages,
        };

        setLoaderData(data);

        // Create router with the fetched data
        const newRouter = createRouterWithLoaderData(data);
        setRouter(newRouter);

        // Wait for router to be ready
        await newRouter.load();
        setRouterReady(true);
      } catch (err) {
        console.error('[ChatPage Story] Failed to fetch data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch conversation data');
      } finally {
        setIsLoading(false);
      }
    }

    void fetchData();
  }, [user, isAuthenticated, authLoading]);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#666' }}>Loading conversation data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            background: '#fef2f2',
            borderRadius: '8px',
            maxWidth: '400px',
          }}
        >
          <p style={{ color: '#dc2626', fontWeight: 500, marginBottom: '8px' }}>Error</p>
          <p style={{ color: '#7f1d1d', fontSize: '14px' }}>{error}</p>
        </div>
      </div>
    );
  }

  // Empty state (no conversations yet)
  if (!loaderData?.conversationId) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: '2rem',
            background: '#f0fdf4',
            borderRadius: '8px',
            maxWidth: '400px',
          }}
        >
          <p style={{ color: '#166534', fontWeight: 500, marginBottom: '8px' }}>No Conversations</p>
          <p style={{ color: '#15803d', fontSize: '14px' }}>
            The test user has no conversations yet. Create some conversations to see them here.
          </p>
        </div>
      </div>
    );
  }

  // Router not ready
  if (!router || !routerReady) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Initializing router...</div>;
  }

  // Render ChatPage with real data via router
  return <RouterProvider router={router} />;
}

// ============================================================================
// Story Definition
// ============================================================================

/**
 * Main chat interface page.
 * Where users interact with the wellness chatbot.
 *
 * NOTE: This story fetches real data from Supabase:
 * - Uses the authenticated test user's most recent conversation
 * - Loads all messages for that conversation
 *
 * Make sure you have:
 * 1. Valid Supabase credentials in your .env
 * 2. A test user with VITE_STORYBOOK_TEST_EMAIL and VITE_STORYBOOK_TEST_PASSWORD
 * 3. Some conversations for that test user
 */
const meta: Meta<typeof ChatPage> = {
  title: 'Pages/ChatPage',
  component: ChatPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Chat interface for conversing with the Wbot wellness assistant.

## Data Source
This component fetches real conversation data from Supabase for the authenticated test user.

## Requirements
- Valid Supabase credentials in .env
- Test user credentials (VITE_STORYBOOK_TEST_EMAIL, VITE_STORYBOOK_TEST_PASSWORD)
- At least one conversation for the test user
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatPage>;

/**
 * Default chat page view with real conversation data.
 * Fetches the test user's most recent conversation from Supabase.
 */
export const Default: Story = {
  render: () => <ChatPageWithRealData />,
};
