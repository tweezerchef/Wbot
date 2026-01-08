import type { Meta, StoryObj } from '@storybook/react-vite';

import { StreakDisplay } from '@/features/gamification';

/**
 * Large streak display with flame animation.
 */
const meta: Meta<typeof StreakDisplay> = {
  title: 'Components/Gamification/StreakDisplay',
  component: StreakDisplay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Large streak display with animated flame icon. Shows milestone badges and encouraging messages based on progress.',
      },
    },
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
type Story = StoryObj<typeof StreakDisplay>;

/**
 * Zero days - starting fresh.
 */
export const ZeroDays: Story = {
  args: {
    streakDays: 0,
  },
};

/**
 * First day.
 */
export const FirstDay: Story = {
  args: {
    streakDays: 1,
  },
};

/**
 * One week milestone.
 */
export const OneWeek: Story = {
  args: {
    streakDays: 7,
  },
};

/**
 * Two week milestone.
 */
export const TwoWeeks: Story = {
  args: {
    streakDays: 14,
  },
};

/**
 * One month milestone.
 */
export const OneMonth: Story = {
  args: {
    streakDays: 30,
  },
};

/**
 * Three month milestone.
 */
export const ThreeMonths: Story = {
  args: {
    streakDays: 90,
  },
};

/**
 * One year milestone.
 */
export const OneYear: Story = {
  args: {
    streakDays: 365,
  },
};

/**
 * Compact variant.
 */
export const Compact: Story = {
  args: {
    streakDays: 21,
    compact: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 200, padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};
