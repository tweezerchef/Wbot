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
import {
  MOCK_CONVERSATION_MESSAGES,
  MOCK_BREATHING_INTERRUPT,
  MOCK_VOICE_INTERRUPT,
  MOCK_JOURNALING_INTERRUPT,
} from '../mocks';

import { ChatPage } from '@/features/chat';
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

// ============================================================================
// Mock Data Wrapper Component
// ============================================================================

/**
 * Creates a ChatPage wrapped in router with mock data (no backend required).
 * Useful for testing specific UI states without Supabase connection.
 */
function ChatPageWithMockData({
  messages,
  conversationId = 'mock-conversation-123',
}: {
  messages: Message[];
  conversationId?: string;
}): ReactElement {
  const [router, setRouter] = useState<ReturnType<typeof createRouterWithLoaderData> | null>(null);
  const [routerReady, setRouterReady] = useState(false);

  useEffect(() => {
    const loaderData: ChatLoaderData = {
      conversationId,
      messages,
    };

    const newRouter = createRouterWithLoaderData(loaderData);
    setRouter(newRouter);

    // Wait for router to be ready
    void newRouter.load().then(() => {
      setRouterReady(true);
    });
  }, [messages, conversationId]);

  if (!router || !routerReady) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  return <RouterProvider router={router} />;
}

// ============================================================================
// Mock Data Stories
// ============================================================================

/**
 * Empty state - new user with no conversation history.
 * Shows the welcome screen.
 */
export const EmptyState: Story = {
  render: () => (
    <ChatPageWithMockData messages={[]} conversationId={undefined as unknown as string} />
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Empty state for new users with no previous conversations. Shows the welcome screen.',
      },
    },
  },
};

/**
 * With messages - active conversation with message history.
 */
export const WithMessages: Story = {
  render: () => <ChatPageWithMockData messages={MOCK_CONVERSATION_MESSAGES} />,
  parameters: {
    docs: {
      description: {
        story: 'Active conversation with message history. Shows user and assistant messages.',
      },
    },
  },
};

/**
 * Welcome state - shows the welcome message from the assistant.
 */
export const WelcomeMessage: Story = {
  render: () => (
    <ChatPageWithMockData
      messages={[
        {
          id: 'welcome-1',
          role: 'assistant',
          content:
            "Hello! I'm Wbot, your wellness companion. I'm here to help you with breathing exercises, guided meditations, journaling, and more. How are you feeling today?",
          createdAt: new Date(),
        },
      ]}
    />
  ),
};

/**
 * Long conversation - many messages to test scrolling.
 */
export const LongConversation: Story = {
  render: () => {
    const longMessages: Message[] = [
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'Hello! How are you feeling today?',
        createdAt: new Date('2024-01-15T10:00:00'),
      },
    ];

    // Add alternating user/assistant messages
    for (let i = 2; i <= 20; i++) {
      const isUser = i % 2 === 0;
      const messageNum = String(Math.floor(i / 2));
      longMessages.push({
        id: `msg-${String(i)}`,
        role: isUser ? 'user' : 'assistant',
        content: isUser
          ? `This is user message number ${messageNum}.`
          : `This is assistant response number ${messageNum}. Let me help you with your wellness journey.`,
        createdAt: new Date(`2024-01-15T10:${String(i).padStart(2, '0')}:00`),
      });
    }

    return <ChatPageWithMockData messages={longMessages} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Long conversation with many messages to test scrolling behavior.',
      },
    },
  },
};

// ============================================================================
// Mobile View Stories
// ============================================================================

/**
 * Mobile portrait view.
 */
export const MobilePortrait: Story = {
  render: () => <ChatPageWithMockData messages={MOCK_CONVERSATION_MESSAGES} />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Mobile portrait view of the chat interface.',
      },
    },
  },
};

/**
 * Mobile landscape view.
 */
export const MobileLandscape: Story = {
  render: () => <ChatPageWithMockData messages={MOCK_CONVERSATION_MESSAGES} />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile2',
    },
  },
};

/**
 * Tablet view.
 */
export const Tablet: Story = {
  render: () => <ChatPageWithMockData messages={MOCK_CONVERSATION_MESSAGES} />,
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

// ============================================================================
// HITL (Human-in-the-Loop) Documentation Stories
// ============================================================================

/**
 * Documentation for HITL interrupt states.
 * Shows the three types of interrupt prompts that can appear in chat.
 */
export const HITLDocumentation: StoryObj = {
  render: () => (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '16px' }}>HITL Interrupt States</h2>
      <p style={{ marginBottom: '24px', color: '#666', lineHeight: '1.6' }}>
        The ChatPage handles three types of Human-in-the-Loop (HITL) interrupts. When the AI
        suggests an activity, it pauses the conversation and displays a confirmation prompt. These
        states are managed by the InterruptPrompt component.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div
          style={{
            padding: '16px',
            background: '#f0f9ff',
            borderRadius: '8px',
            borderLeft: '4px solid #3b82f6',
          }}
        >
          <h3 style={{ marginBottom: '8px' }}>1. Breathing Confirmation</h3>
          <p style={{ fontSize: '14px', color: '#4b5563' }}>
            <strong>Type:</strong> breathing_confirmation
            <br />
            <strong>Triggered when:</strong> AI suggests a breathing exercise
            <br />
            <strong>User can:</strong> Start, change technique, or decline
          </p>
          <pre
            style={{
              marginTop: '12px',
              padding: '12px',
              background: '#1e293b',
              color: '#e2e8f0',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
            }}
          >
            {JSON.stringify(MOCK_BREATHING_INTERRUPT, null, 2)}
          </pre>
        </div>

        <div
          style={{
            padding: '16px',
            background: '#fdf4ff',
            borderRadius: '8px',
            borderLeft: '4px solid #a855f7',
          }}
        >
          <h3 style={{ marginBottom: '8px' }}>2. Voice Selection</h3>
          <p style={{ fontSize: '14px', color: '#4b5563' }}>
            <strong>Type:</strong> voice_selection
            <br />
            <strong>Triggered when:</strong> AI creates a personalized meditation
            <br />
            <strong>User can:</strong> Choose voice, preview meditation, or decline
          </p>
          <pre
            style={{
              marginTop: '12px',
              padding: '12px',
              background: '#1e293b',
              color: '#e2e8f0',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
            }}
          >
            {JSON.stringify(MOCK_VOICE_INTERRUPT, null, 2)}
          </pre>
        </div>

        <div
          style={{
            padding: '16px',
            background: '#f0fdf4',
            borderRadius: '8px',
            borderLeft: '4px solid #22c55e',
          }}
        >
          <h3 style={{ marginBottom: '8px' }}>3. Journaling Confirmation</h3>
          <p style={{ fontSize: '14px', color: '#4b5563' }}>
            <strong>Type:</strong> journaling_confirmation
            <br />
            <strong>Triggered when:</strong> AI suggests journaling
            <br />
            <strong>User can:</strong> Start, change prompt, or decline
          </p>
          <pre
            style={{
              marginTop: '12px',
              padding: '12px',
              background: '#1e293b',
              color: '#e2e8f0',
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
            }}
          >
            {JSON.stringify(MOCK_JOURNALING_INTERRUPT, null, 2)}
          </pre>
        </div>
      </div>

      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          background: '#fef3c7',
          borderRadius: '8px',
        }}
      >
        <h4 style={{ marginBottom: '8px' }}>Note</h4>
        <p style={{ fontSize: '14px', color: '#92400e' }}>
          To see these states in action, interact with the live ChatPage or use the individual
          InterruptPrompt stories. The interrupt state is managed by ChatPage and cannot be directly
          controlled via Storybook args.
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Documentation showing the structure of HITL interrupt payloads for breathing, voice selection, and journaling confirmations.',
      },
    },
  },
};

/**
 * Documentation for inline activity messages.
 * Shows how activities render inside MessageBubble.
 */
export const InlineActivityDocumentation: StoryObj = {
  render: () => (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '16px' }}>Inline Activities in Messages</h2>
      <p style={{ marginBottom: '24px', color: '#666', lineHeight: '1.6' }}>
        When the AI confirms an activity, the activity component renders inline within a
        MessageBubble. The message content contains JSON that is parsed by parseActivityContent.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '8px' }}>Supported Activities</h4>
          <ul style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
            <li>
              <strong>breathing_wim_hof</strong> → WimHofExercise component
            </li>
            <li>
              <strong>breathing</strong> → Completed exercise summary (historical)
            </li>
            <li>
              <strong>meditation</strong> → GuidedMeditation component
            </li>
            <li>
              <strong>meditation_ai_generated</strong> → AIGeneratedMeditation component
            </li>
            <li>
              <strong>journaling</strong> → JournalingExercise component
            </li>
          </ul>
        </div>

        <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '8px' }}>Activity Message Flow</h4>
          <ol style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
            <li>User triggers activity via conversation</li>
            <li>AI returns HITL interrupt → InterruptPrompt shown</li>
            <li>User confirms → Graph resumes</li>
            <li>AI returns activity message with JSON content</li>
            <li>MessageBubble parses JSON → Renders inline activity</li>
            <li>Activity completes → onComplete callback fires</li>
          </ol>
        </div>
      </div>

      <p style={{ marginTop: '16px', fontSize: '14px', color: '#888' }}>
        See the MessageBubble stories for individual activity rendering examples.
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Documentation explaining how activities render inline within chat messages.',
      },
    },
  },
};
