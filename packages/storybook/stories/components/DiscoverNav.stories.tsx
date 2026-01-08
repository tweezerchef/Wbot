import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { DiscoverNav } from '@/features/navigation';

/**
 * Discover navigation section for the sidebar.
 */
const meta: Meta<typeof DiscoverNav> = {
  title: 'Components/Sidebar/DiscoverNav',
  component: DiscoverNav,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Navigation section showing available wellness activities. Includes breathing, meditation, journaling, and sleep stories (coming soon).',
      },
    },
    backgrounds: {
      default: 'light',
    },
  },
  args: {
    onItemClick: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 260, padding: '1rem', background: '#f8f9fb' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DiscoverNav>;

/**
 * Default state with no active item.
 */
export const Default: Story = {};

/**
 * With breathing as active item.
 */
export const BreathingActive: Story = {
  args: {
    activeItem: 'breathing',
  },
};

/**
 * With meditation as active item.
 */
export const MeditationActive: Story = {
  args: {
    activeItem: 'meditation',
  },
};

/**
 * With journaling as active item.
 */
export const JournalingActive: Story = {
  args: {
    activeItem: 'journal',
  },
};
