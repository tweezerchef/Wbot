import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { Badge, BadgeGrid, type BadgeData } from '@/features/gamification';

// Sample badges for stories
const sampleBadges: BadgeData[] = [
  {
    id: 'first-breath',
    name: 'First Breath',
    description: 'Complete your first breathing exercise',
    category: 'milestone',
    icon: 'check',
    isUnlocked: true,
    unlockedAt: new Date(),
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    category: 'consistency',
    icon: 'flame',
    isUnlocked: true,
    unlockedAt: new Date(),
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Try all activity types',
    category: 'exploration',
    icon: 'star',
    isUnlocked: false,
    progress: 75,
  },
  {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Complete 10 sleep stories',
    category: 'mastery',
    icon: 'moon',
    isUnlocked: false,
    progress: 30,
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Practice before 7am 5 times',
    category: 'mastery',
    icon: 'sun',
    isUnlocked: false,
    progress: 60,
  },
  {
    id: 'mindful-month',
    name: 'Mindful Month',
    description: 'Maintain a 30-day streak',
    category: 'consistency',
    icon: 'medal',
    isUnlocked: false,
    progress: 47,
  },
];

/**
 * Achievement badge component.
 */
const meta: Meta<typeof Badge> = {
  title: 'Components/Gamification/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Achievement badges with locked/unlocked states. Supports different categories with unique color schemes.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

/**
 * Unlocked badge - milestone category.
 */
export const UnlockedMilestone: Story = {
  args: {
    badge: sampleBadges[0],
  },
};

/**
 * Unlocked badge - consistency category.
 */
export const UnlockedConsistency: Story = {
  args: {
    badge: sampleBadges[1],
  },
};

/**
 * Locked badge with progress.
 */
export const LockedWithProgress: Story = {
  args: {
    badge: sampleBadges[2],
    showProgress: true,
  },
};

/**
 * Locked badge - mastery category.
 */
export const LockedMastery: Story = {
  args: {
    badge: sampleBadges[3],
    showProgress: true,
  },
};

/**
 * Just unlocked animation.
 */
export const JustUnlocked: Story = {
  args: {
    badge: sampleBadges[0],
    justUnlocked: true,
  },
};

/**
 * Badge grid - flat display.
 */
export const GridFlat: StoryObj<typeof BadgeGrid> = {
  render: () => (
    <div style={{ width: 400, padding: '1rem' }}>
      <BadgeGrid badges={sampleBadges} showProgress onBadgeClick={fn()} />
    </div>
  ),
};

/**
 * Badge grid - grouped by category.
 */
export const GridGrouped: StoryObj<typeof BadgeGrid> = {
  render: () => (
    <div style={{ width: 400, padding: '1rem' }}>
      <BadgeGrid badges={sampleBadges} groupByCategory showProgress onBadgeClick={fn()} />
    </div>
  ),
};
