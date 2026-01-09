import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ChatEmptyState } from '@/features/chat';

/**
 * Empty state component for the chat interface.
 * Displays a welcome illustration, quick actions, and conversation starters.
 */

const meta: Meta<typeof ChatEmptyState> = {
  title: 'Components/ChatEmptyState',
  component: ChatEmptyState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Welcome screen shown when the chat is empty. Features organic blob illustrations, quick action cards for breathing/meditation/journaling, and conversation starter chips.',
      },
    },
    backgrounds: {
      default: 'light',
    },
  },
  args: {
    onQuickAction: fn(),
    onStarterClick: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: '100%', maxWidth: '600px', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatEmptyState>;

/**
 * Default empty state with all elements visible.
 */
export const Default: Story = {};

/**
 * Empty state in a narrow container (mobile simulation).
 */
export const Mobile: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: '320px', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Empty state in a wide container (desktop).
 */
export const Desktop: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: '800px', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
};
