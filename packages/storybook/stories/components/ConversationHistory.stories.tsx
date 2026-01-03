import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { fn } from 'storybook/test';

import { ConversationHistory } from '@/components/ConversationHistory/ConversationHistory';

// Create a client for Storybook stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

/**
 * Sidebar component showing conversation history.
 * Displays a collapsible list of past conversations with search.
 */
const meta: Meta<typeof ConversationHistory> = {
  title: 'Components/ConversationHistory',
  component: ConversationHistory,
  decorators: [
    (Story): ReactElement => (
      <QueryClientProvider client={queryClient}>
        <div
          style={{ height: '600px', width: '320px', backgroundColor: '#f5f5f5', padding: '16px' }}
        >
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays conversation history in a collapsible panel. Shows recent conversations grouped by recency with search functionality.',
      },
    },
  },
  args: {
    currentConversationId: null,
    onSelectConversation: fn(),
    onCloseSidebar: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ConversationHistory>;

/**
 * Default conversation history (collapsed).
 */
export const Default: Story = {
  args: {
    currentConversationId: null,
  },
};

/**
 * With an active conversation selected.
 */
export const WithActiveConversation: Story = {
  args: {
    currentConversationId: 'some-conversation-id',
  },
};
