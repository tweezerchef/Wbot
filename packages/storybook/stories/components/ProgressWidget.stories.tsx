import type { Meta, StoryObj } from '@storybook/react-vite';

import { ProgressWidget } from '@/features/gamification';

/**
 * Compact progress widget for the sidebar.
 */
const meta: Meta<typeof ProgressWidget> = {
  title: 'Components/Sidebar/ProgressWidget',
  component: ProgressWidget,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Compact widget showing streak and weekly goal progress. Displays day dots for the current week.',
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
type Story = StoryObj<typeof ProgressWidget>;

/**
 * Fresh start - no progress yet.
 */
export const Default: Story = {
  args: {
    streakDays: 0,
    weeklyGoalCompleted: 0,
    weeklyGoalTarget: 5,
  },
};

/**
 * Some progress made this week.
 */
export const SomeProgress: Story = {
  args: {
    streakDays: 3,
    weeklyGoalCompleted: 3,
    weeklyGoalTarget: 5,
  },
};

/**
 * Weekly goal achieved.
 */
export const GoalAchieved: Story = {
  args: {
    streakDays: 7,
    weeklyGoalCompleted: 5,
    weeklyGoalTarget: 5,
  },
};

/**
 * Long streak with exceeded goal.
 */
export const LongStreak: Story = {
  args: {
    streakDays: 30,
    weeklyGoalCompleted: 7,
    weeklyGoalTarget: 5,
  },
};
