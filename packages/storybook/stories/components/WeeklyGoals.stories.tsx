import type { Meta, StoryObj } from '@storybook/react-vite';

import { WeeklyGoals } from '@/features/gamification';

/**
 * Weekly goal visualization component.
 */
const meta: Meta<typeof WeeklyGoals> = {
  title: 'Components/Gamification/WeeklyGoals',
  component: WeeklyGoals,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Shows weekly progress with day circles, progress bar, and encouraging messages. Highlights the current day.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360, padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WeeklyGoals>;

/**
 * Empty week - no progress yet.
 */
export const EmptyWeek: Story = {
  args: {
    completedDays: [],
    target: 5,
  },
};

/**
 * Monday completed.
 */
export const MondayDone: Story = {
  args: {
    completedDays: [0],
    target: 5,
  },
};

/**
 * Half week progress.
 */
export const HalfWeek: Story = {
  args: {
    completedDays: [0, 1, 2],
    target: 5,
  },
};

/**
 * Goal achieved - 5 days completed.
 */
export const GoalAchieved: Story = {
  args: {
    completedDays: [0, 1, 2, 3, 4],
    target: 5,
  },
};

/**
 * Perfect week - all 7 days.
 */
export const PerfectWeek: Story = {
  args: {
    completedDays: [0, 1, 2, 3, 4, 5, 6],
    target: 5,
  },
};

/**
 * Non-consecutive days.
 */
export const NonConsecutive: Story = {
  args: {
    completedDays: [0, 2, 4, 6],
    target: 5,
  },
};

/**
 * Compact variant.
 */
export const Compact: Story = {
  args: {
    completedDays: [0, 1, 2],
    target: 5,
    compact: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 280, padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};
