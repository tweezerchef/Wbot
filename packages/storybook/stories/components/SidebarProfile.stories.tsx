import type { Meta, StoryObj } from '@storybook/react-vite';

import { SidebarProfile } from '@/features/user';

/**
 * User profile section for the sidebar.
 */
const meta: Meta<typeof SidebarProfile> = {
  title: 'Components/Sidebar/SidebarProfile',
  component: SidebarProfile,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays user avatar, name, and current streak in the sidebar. Shows initials when no avatar image is available.',
      },
    },
    backgrounds: {
      default: 'light',
    },
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
type Story = StoryObj<typeof SidebarProfile>;

/**
 * Profile with email and no streak.
 */
export const Default: Story = {
  args: {
    email: 'user@example.com',
    streakDays: 0,
  },
};

/**
 * Profile with active streak.
 */
export const WithStreak: Story = {
  args: {
    email: 'wellness@example.com',
    streakDays: 7,
  },
};

/**
 * Profile with long email (truncated).
 */
export const LongEmail: Story = {
  args: {
    email: 'verylongemailaddress@longdomainname.com',
    streakDays: 14,
  },
};

/**
 * Profile with high streak count.
 */
export const HighStreak: Story = {
  args: {
    email: 'dedicated@example.com',
    streakDays: 365,
  },
};
