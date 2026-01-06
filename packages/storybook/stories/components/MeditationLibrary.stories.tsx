import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { fn } from 'storybook/test';

import { MeditationLibrary } from '@/components/MeditationLibrary';

// ============================================================================
// MeditationLibrary Stories
// ============================================================================

/**
 * Full meditation library component for browsing saved AI-generated meditations.
 *
 * Features:
 * - Grid display of saved meditations
 * - Filter by meditation type
 * - Filter by favorites only
 * - Sort by newest, oldest, most played, or recently played
 * - Inline playback
 * - Delete with confirmation
 *
 * NOTE: This component fetches real data from Supabase via the useMeditationLibrary hook.
 * Make sure you have:
 * 1. Valid Supabase credentials in your .env
 * 2. A test user with VITE_STORYBOOK_TEST_EMAIL and VITE_STORYBOOK_TEST_PASSWORD
 * 3. Some saved meditations for that test user
 */
const meta: Meta<typeof MeditationLibrary> = {
  title: 'Components/MeditationLibrary',
  component: MeditationLibrary,
  decorators: [
    (Story): ReactElement => (
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { default: 'wellness' },
    docs: {
      description: {
        component: `
Library component for browsing and replaying saved AI-generated meditations.

## Features
- Grid display of meditation cards
- Filter by meditation type (body scan, loving kindness, breathing focus, etc.)
- Filter favorites only
- Sort by newest, oldest, most played, or recently played
- Play saved meditations with inline player
- Toggle favorites with star icon
- Delete meditations with confirmation

## Data Source
This component fetches real data from Supabase. Ensure the test user has saved meditations.

## Usage
The library appears in the ActivityOverlay when the user opens their meditation collection.
        `,
      },
    },
  },
  args: {
    onPlay: fn(),
    onDelete: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof MeditationLibrary>;

/**
 * Default library view with meditations.
 * Fetches real data from Supabase for the authenticated test user.
 */
export const DefaultLibrary: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Default library view showing all saved meditations from Supabase.',
      },
    },
  },
};

/**
 * Compact library view (for sidebar/widget)
 */
export const CompactLibrary: Story = {
  args: {
    compact: true,
    maxItems: 3,
  },
};

/**
 * Library with favorites filter active
 */
export const FavoritesOnly: Story = {
  args: {
    initialFilters: {
      favoritesOnly: true,
    },
  },
};

/**
 * Library filtered by meditation type
 */
export const FilteredByType: Story = {
  args: {
    initialFilters: {
      type: 'body_scan',
    },
  },
};

/**
 * Mobile viewport
 */
export const MobileLibrary: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
