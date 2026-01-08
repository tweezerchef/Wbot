import type { Meta, StoryObj } from '@storybook/react-vite';

import { ChatSkeleton, SidebarSkeleton, ActivityCardSkeleton } from '@/components/skeletons';

/**
 * Skeleton loading components for FOUC prevention.
 */
const meta: Meta<typeof ChatSkeleton> = {
  title: 'Components/Skeletons',
  component: ChatSkeleton,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Skeleton loading states for various components. Used to prevent Flash of Unstyled Content (FOUC) during initial load.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatSkeleton>;

/**
 * Chat page skeleton with sidebar and main content.
 */
export const ChatPageSkeleton: Story = {
  render: () => <ChatSkeleton />,
};

/**
 * Sidebar skeleton showing profile, nav, and conversations.
 */
export const SidebarSkeletonExample: StoryObj<typeof SidebarSkeleton> = {
  render: () => (
    <div style={{ width: 280, height: '100vh' }}>
      <SidebarSkeleton />
    </div>
  ),
};

/**
 * Activity card skeleton - default size.
 */
export const ActivityCardDefault: StoryObj<typeof ActivityCardSkeleton> = {
  render: () => (
    <div style={{ width: 300, padding: '1rem' }}>
      <ActivityCardSkeleton />
    </div>
  ),
};

/**
 * Activity card skeleton - compact size.
 */
export const ActivityCardCompact: StoryObj<typeof ActivityCardSkeleton> = {
  render: () => (
    <div style={{ width: 250, padding: '1rem' }}>
      <ActivityCardSkeleton compact />
    </div>
  ),
};

/**
 * Multiple activity card skeletons in a grid.
 */
export const ActivityCardGrid: StoryObj<typeof ActivityCardSkeleton> = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem',
        padding: '1rem',
        maxWidth: 900,
      }}
    >
      <ActivityCardSkeleton />
      <ActivityCardSkeleton />
      <ActivityCardSkeleton />
    </div>
  ),
};
