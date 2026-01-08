import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { fn } from 'storybook/test';

import { ConversationHistory } from '@/features/chat';

/**
 * Sidebar component showing conversation history.
 * Displays a collapsible list of past conversations with search.
 *
 * NOTE: This component fetches real data from Supabase via useConversationHistory hook.
 * Make sure you have:
 * 1. Valid Supabase credentials in your .env
 * 2. A test user with VITE_STORYBOOK_TEST_EMAIL and VITE_STORYBOOK_TEST_PASSWORD
 * 3. Some conversations for that test user
 */
const meta: Meta<typeof ConversationHistory> = {
  title: 'Components/ConversationHistory',
  component: ConversationHistory,
  decorators: [
    (Story): ReactElement => (
      <div style={{ height: '600px', width: '320px', backgroundColor: '#f5f5f5', padding: '16px' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Displays conversation history in a collapsible panel.
Shows recent conversations grouped by recency with search functionality.

## Data Source
This component fetches real conversation data from Supabase for the authenticated test user.
        `,
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
 * Fetches real conversations from Supabase.
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
