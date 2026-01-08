import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { fn } from 'storybook/test';

import { MeditationCard } from '@/features/meditation';
import type { SavedMeditation } from '@/features/meditation';

// Create a client for Storybook stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

// ============================================================================
// Mock Data
// ============================================================================

const createMockMeditation = (overrides: Partial<SavedMeditation> = {}): SavedMeditation => ({
  id: `meditation-${String(Date.now())}-${Math.random().toString(36).slice(2, 7)}`,
  title: 'Morning Calm',
  meditation_type: 'breathing_focus',
  duration_seconds: 600,
  voice_id: 'alloy',
  voice_name: 'Alloy',
  audio_url: '/audio/ocean-waves.mp3',
  status: 'complete',
  play_count: 3,
  last_played_at: new Date().toISOString(),
  is_favorite: false,
  mood_before: 3,
  mood_after: 4,
  created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  generation_context: {
    time_of_day: 'morning',
    primary_intent: 'Start the day with clarity',
    memories_used: 2,
    emotional_signals: ['stressed', 'tired'],
  },
  ...overrides,
});

// Mock data for use in MeditationCard stories (not a story itself)
const mockMeditations: SavedMeditation[] = [
  createMockMeditation({
    id: 'med-1',
    title: 'Morning Calm',
    meditation_type: 'breathing_focus',
    duration_seconds: 600,
    is_favorite: true,
    play_count: 12,
  }),
  createMockMeditation({
    id: 'med-2',
    title: 'Body Scan for Relaxation',
    meditation_type: 'body_scan',
    duration_seconds: 900,
    voice_id: 'nova',
    voice_name: 'Nova',
    play_count: 5,
  }),
  createMockMeditation({
    id: 'med-3',
    title: 'Loving Kindness Practice',
    meditation_type: 'loving_kindness',
    duration_seconds: 720,
    is_favorite: true,
    play_count: 8,
  }),
  createMockMeditation({
    id: 'med-4',
    title: 'Sleep Well Tonight',
    meditation_type: 'sleep',
    duration_seconds: 1200,
    voice_id: 'echo',
    voice_name: 'Echo',
    play_count: 15,
  }),
  createMockMeditation({
    id: 'med-5',
    title: 'Release Anxiety',
    meditation_type: 'anxiety_relief',
    duration_seconds: 480,
    is_favorite: true,
    play_count: 20,
    generation_context: {
      time_of_day: 'evening',
      primary_intent: 'Find relief from anxious thoughts',
      memories_used: 4,
      emotional_signals: ['anxious', 'overwhelmed', 'worried'],
    },
  }),
  createMockMeditation({
    id: 'med-6',
    title: 'Daily Mindfulness Check-in',
    meditation_type: 'daily_mindfulness',
    duration_seconds: 300,
    play_count: 25,
  }),
];

// ============================================================================
// MeditationCard Stories
// ============================================================================

/**
 * Individual meditation card for displaying saved AI-generated meditations.
 *
 * Features:
 * - Play button to start meditation
 * - Favorite toggle (star)
 * - Delete button with confirmation
 * - Duration and play count display
 * - Voice name indicator
 */
const meta: Meta<typeof MeditationCard> = {
  title: 'Components/MeditationCard',
  component: MeditationCard,
  decorators: [
    (Story): ReactElement => (
      <QueryClientProvider client={queryClient}>
        <div style={{ maxWidth: '360px', margin: '0 auto' }}>
          <Story />
        </div>
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'wellness' },
    docs: {
      description: {
        component:
          'Card component for displaying saved AI-generated meditations with play, favorite, and delete actions.',
      },
    },
  },
  args: {
    onPlay: fn(),
    onToggleFavorite: fn(),
    onDelete: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof MeditationCard>;

/**
 * Default meditation card appearance
 */
export const DefaultCard: Story = {
  args: {
    meditation: mockMeditations[0],
  },
};

/**
 * Favorite meditation (starred)
 */
export const FavoritedCard: Story = {
  args: {
    meditation: mockMeditations[2],
  },
};

/**
 * Card in compact mode (for sidebars/widgets)
 */
export const CompactCard: Story = {
  args: {
    meditation: mockMeditations[0],
    compact: true,
  },
};

/**
 * Card for a sleep meditation
 */
export const SleepMeditationCard: Story = {
  args: {
    meditation: mockMeditations[3],
  },
};

/**
 * Card with high play count
 */
export const FrequentlyPlayedCard: Story = {
  args: {
    meditation: mockMeditations[4],
  },
};

/**
 * All meditation card variants
 */
export const AllCardVariants: StoryObj = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1rem',
        padding: '1rem',
      }}
    >
      {mockMeditations.map((meditation) => (
        <MeditationCard
          key={meditation.id}
          meditation={meditation}
          onPlay={fn()}
          onToggleFavorite={fn()}
          onDelete={fn()}
        />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All meditation card variants showing different types and states.',
      },
    },
  },
};

/**
 * Compact cards for sidebar
 */
export const CompactCardsGrid: StoryObj = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '300px',
        padding: '1rem',
      }}
    >
      {mockMeditations.slice(0, 4).map((meditation) => (
        <MeditationCard
          key={meditation.id}
          meditation={meditation}
          onPlay={fn()}
          onToggleFavorite={fn()}
          onDelete={fn()}
          compact
        />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Compact card layout for sidebar or widget display.',
      },
    },
  },
};
