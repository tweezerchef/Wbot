import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import { ChatPage } from '@/components/pages/ChatPage/ChatPage';

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
 * Main chat interface page.
 * Where users interact with the wellness chatbot.
 */
const meta: Meta<typeof ChatPage> = {
  title: 'Pages/ChatPage',
  component: ChatPage,
  decorators: [
    (Story): ReactElement => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Chat interface for conversing with the Wbot wellness assistant.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatPage>;

/**
 * Default chat page view.
 */
export const Default: Story = {};
