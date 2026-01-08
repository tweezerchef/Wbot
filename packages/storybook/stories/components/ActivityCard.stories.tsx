import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ActivityCard } from '@/components/ui';

/**
 * Card component for displaying wellness activities.
 */
const meta: Meta<typeof ActivityCard> = {
  title: 'Components/ActivityCard',
  component: ActivityCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Card for displaying breathing exercises, meditations, journaling prompts, and sleep stories. Features gradient backgrounds based on activity type.',
      },
    },
  },
  args: {
    onStart: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320, padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ActivityCard>;

/**
 * Breathing exercise card.
 */
export const Breathing: Story = {
  args: {
    type: 'breathing',
    title: 'Box Breathing',
    description: 'A calming 4-4-4-4 pattern to reduce stress and improve focus.',
    duration: 5,
    difficulty: 'Beginner',
  },
};

/**
 * Meditation card.
 */
export const Meditation: Story = {
  args: {
    type: 'meditation',
    title: 'Morning Calm',
    description: 'Start your day with clarity and intention through this guided meditation.',
    duration: 10,
    difficulty: 'Beginner',
  },
};

/**
 * Journaling card.
 */
export const Journal: Story = {
  args: {
    type: 'journal',
    title: 'Gratitude Reflection',
    description: 'Explore what you are thankful for and cultivate a positive mindset.',
    duration: 15,
    difficulty: 'Beginner',
  },
};

/**
 * Sleep story card.
 */
export const Sleep: Story = {
  args: {
    type: 'sleep',
    title: 'Starlit Forest',
    description: 'Drift off to sleep with this soothing journey through a peaceful forest.',
    duration: 25,
    difficulty: 'Beginner',
  },
};

/**
 * Compact variant for smaller spaces.
 */
export const Compact: Story = {
  args: {
    type: 'breathing',
    title: 'Quick Calm',
    description: 'A brief breathing exercise for instant relaxation.',
    duration: 2,
    compact: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 240, padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * All activity types in a grid.
 */
export const AllTypes: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1rem',
        padding: '1rem',
        maxWidth: 700,
      }}
    >
      <ActivityCard
        type="breathing"
        title="Box Breathing"
        description="Calming 4-4-4-4 pattern"
        duration={5}
        difficulty="Beginner"
      />
      <ActivityCard
        type="meditation"
        title="Morning Calm"
        description="Start with clarity"
        duration={10}
        difficulty="Beginner"
      />
      <ActivityCard
        type="journal"
        title="Gratitude"
        description="Reflect on the positive"
        duration={15}
        difficulty="Beginner"
      />
      <ActivityCard
        type="sleep"
        title="Starlit Forest"
        description="Drift into peaceful sleep"
        duration={25}
        difficulty="Beginner"
      />
    </div>
  ),
};
