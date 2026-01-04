import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';

import type { MeditationTrack, MoodRating } from '@/components/GuidedMeditation';
import {
  GuidedMeditation,
  MeditationPlayer,
  MeditationVisual,
  MoodCheck,
  MEDITATION_TRACKS,
  getAllTracks,
} from '@/components/GuidedMeditation';

// Create a client for Storybook stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

/**
 * Guided meditation component with audio playback, visual animation, and mood tracking.
 *
 * Features:
 * - UCLA MARC guided meditation audio tracks
 * - Calming visual animations with multiple variants
 * - Ambient sound mixer (ocean, rain, forest)
 * - Before/after mood check
 * - Progress tracking with seek control
 * - Multiple tracks across different types and languages
 */
const meta: Meta<typeof GuidedMeditation> = {
  title: 'Interactive/GuidedMeditation',
  component: GuidedMeditation,
  decorators: [
    (Story): ReactElement => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'wellness' },
    docs: {
      description: {
        component: `
Guided meditation component that renders inline within the chat.

## Features
- UCLA MARC guided meditation audio tracks (CC BY-NC-ND 4.0)
- Calming visual animations (orb, rings, gradient variants)
- Ambient sound mixer with ocean, rain, and forest sounds
- Before/after mood tracking for session analytics
- Progress bar with seek control
- Dual volume controls (meditation + ambient)
- Spanish language track support

## Usage
This component is embedded within chat messages when the AI suggests or initiates a guided meditation session.
        `,
      },
    },
  },
  argTypes: {
    track: {
      control: 'select',
      options: Object.keys(MEDITATION_TRACKS),
      mapping: MEDITATION_TRACKS,
      description: 'The meditation track to play',
    },
    enableAmbient: {
      control: 'boolean',
      description: 'Whether to enable ambient background sounds',
    },
    introduction: {
      control: 'text',
      description: 'Optional introduction text from the AI',
    },
  },
  args: {
    track: MEDITATION_TRACKS.breathing_focus,
    introduction: "Let's take a moment to practice mindfulness together.",
    enableAmbient: false, // Disabled by default for Storybook to avoid autoplay issues
    onComplete: fn(),
    onStop: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof GuidedMeditation>;

// ==============================================================================
// Main Component Stories
// ==============================================================================

/**
 * Default meditation with breathing focus track.
 * A gentle 5-minute meditation focusing on the breath.
 */
export const BreathingFocus: Story = {
  args: {
    track: MEDITATION_TRACKS.breathing_focus,
    introduction:
      'This breathing meditation will help you find calm and focus. Just follow along with the gentle guidance.',
  },
};

/**
 * Body Scan meditation track (short).
 * A quick 3-minute body scan for tension release.
 */
export const BodyScanShort: Story = {
  args: {
    track: MEDITATION_TRACKS.body_scan_short,
    introduction:
      "Let's do a quick body scan to release any tension you're holding. This only takes 3 minutes.",
  },
};

/**
 * Body Scan meditation track (medium).
 * A thorough 9-minute body scan for deep relaxation.
 */
export const BodyScanMedium: Story = {
  args: {
    track: MEDITATION_TRACKS.body_scan_medium,
    introduction:
      "Take 9 minutes to deeply relax with this body scan. We'll move from head to toe.",
  },
};

/**
 * Loving Kindness (Metta) meditation.
 * A 9-minute practice for cultivating compassion.
 */
export const LovingKindness: Story = {
  args: {
    track: MEDITATION_TRACKS.loving_kindness,
    introduction:
      "Let's practice loving kindness together. This meditation will help you cultivate compassion for yourself and others.",
  },
};

/**
 * Extended Loving Kindness meditation.
 * A 13-minute deep compassion practice.
 */
export const LovingKindnessExtended: Story = {
  args: {
    track: MEDITATION_TRACKS.loving_kindness_extended,
    introduction:
      'This extended loving kindness practice takes us deeper into compassion cultivation, including visualizations for all beings.',
  },
};

/**
 * Anxiety Relief meditation.
 * A 7-minute practice for working with difficult emotions.
 */
export const AnxietyRelief: Story = {
  args: {
    track: 'body_scan_short',

    introduction:
      "I've chosen a meditation specifically for working with difficult emotions. Let's meet what you're feeling with mindfulness.",

    enableAmbient: true,
  },
};

/**
 * Sleep Meditation.
 * A 13-minute practice for preparing for restful sleep.
 */
export const SleepMeditation: Story = {
  args: {
    track: MEDITATION_TRACKS.sleep_meditation,
    introduction:
      "This soothing meditation will help prepare you for restful sleep. Get comfortable in bed and let's begin.",
  },
};

/**
 * Daily Mindfulness (short).
 * A quick 3-minute daily check-in practice.
 */
export const DailyMindfulness: Story = {
  args: {
    track: MEDITATION_TRACKS.daily_mindfulness,
    introduction:
      "Let's take a quick mindful pause. Just 3 minutes to center yourself and check in with how you're feeling.",
  },
};

/**
 * Complete Relaxation meditation.
 * A 15-minute comprehensive relaxation practice.
 */
export const CompleteRelaxation: Story = {
  args: {
    track: MEDITATION_TRACKS.complete_relaxation,
    introduction:
      'This 15-minute meditation guides you through deep muscle relaxation and calming breathwork. Perfect for unwinding.',
  },
};

/**
 * Spanish language breathing meditation.
 */
export const SpanishBreathingFocus: Story = {
  args: {
    track: MEDITATION_TRACKS.breathing_focus_es,
    introduction:
      'Una meditación suave enfocada en la respiración. Ideal para principiantes y práctica diaria.',
  },
};

/**
 * Spanish language body scan meditation.
 */
export const SpanishBodyScan: Story = {
  args: {
    track: MEDITATION_TRACKS.body_scan_short_es,
    introduction:
      'Un breve escaneo corporal para liberar tensión y reconectar con las sensaciones físicas.',
  },
};

/**
 * Meditation with ambient sounds enabled.
 * Shows ambient sound controls in the player.
 */
export const WithAmbientSounds: Story = {
  args: {
    track: MEDITATION_TRACKS.breathing_focus,
    introduction:
      'This meditation includes optional ambient sounds. Try ocean waves or gentle rain in the background.',
    enableAmbient: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Meditation with ambient sound mixer enabled. Use the dropdown to select ocean, rain, or forest sounds.',
      },
    },
  },
};

/**
 * Meditation without introduction text.
 * Shows the component in minimal mode.
 */
export const NoIntroduction: Story = {
  args: {
    track: MEDITATION_TRACKS.body_scan_short,
    introduction: undefined,
  },
  parameters: {
    docs: {
      description: {
        story: 'Guided meditation without an introduction message from the AI.',
      },
    },
  },
};

// ==============================================================================
// Sub-Component Stories
// ==============================================================================

/**
 * MeditationVisual component showcase.
 * Shows all three visual variants: orb, rings, and gradient.
 */
export const VisualVariants: StoryObj<typeof MeditationVisual> = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '32px',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <MeditationVisual playbackState="playing" variant="orb" size={120} />
        <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>Orb (Default)</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <MeditationVisual playbackState="playing" variant="rings" size={120} />
        <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>Rings</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <MeditationVisual playbackState="playing" variant="gradient" size={120} />
        <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>Gradient</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Three visual animation variants available for the meditation component.',
      },
    },
  },
};

/**
 * MeditationVisual state comparison.
 * Shows visual in different playback states.
 */
export const VisualPlaybackStates: StoryObj<typeof MeditationVisual> = {
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '32px',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <MeditationVisual playbackState="idle" variant="orb" size={100} />
        <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>Idle</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <MeditationVisual playbackState="playing" variant="orb" size={100} />
        <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>Playing</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <MeditationVisual playbackState="paused" variant="orb" size={100} />
        <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>Paused</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual component in different playback states. Animation pauses when not playing.',
      },
    },
  },
};

/**
 * MoodCheck component.
 * Interactive mood rating selector.
 */
export const MoodCheckComponent: StoryObj<typeof MoodCheck> = {
  render: () => {
    const handleSelect = (mood: MoodRating) => {
      console.warn('Mood selected:', mood);
    };
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        <MoodCheck
          label="How are you feeling before meditation?"
          onSelect={handleSelect}
          onSkip={() => {
            console.warn('Skipped');
          }}
          allowSkip
        />
        <MoodCheck
          label="Rate your mood (compact)"
          onSelect={handleSelect}
          allowSkip={false}
          compact
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Mood check component for before/after meditation ratings. Shows standard and compact variants.',
      },
    },
  },
};

/**
 * MeditationPlayer component with ambient controls.
 * Shows the player UI with dual volume controls.
 */
export const PlayerWithAmbient: StoryObj<typeof MeditationPlayer> = {
  render: () => {
    const mockState = {
      playbackState: 'playing' as const,
      currentTime: 127,
      duration: 300,
      progress: 42.3,
      isLoading: false,
      error: null,
    };
    return (
      <div style={{ width: '380px', padding: '20px', background: '#fff', borderRadius: '12px' }}>
        <MeditationPlayer
          state={mockState}
          track={MEDITATION_TRACKS.breathing_focus}
          onPlay={() => {
            console.warn('Play');
          }}
          onPause={() => {
            console.warn('Pause');
          }}
          onStop={() => {
            console.warn('Stop');
          }}
          onSeek={(pos) => {
            console.warn('Seek to:', pos);
          }}
          volume={0.8}
          onVolumeChange={(vol) => {
            console.warn('Volume:', vol);
          }}
          ambientControls={{
            sound: 'ocean',
            volume: 0.3,
            isPlaying: true,
            onSoundChange: (s) => {
              console.warn('Ambient sound:', s);
            },
            onVolumeChange: (vol) => {
              console.warn('Ambient volume:', vol);
            },
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'MeditationPlayer component with ambient sound controls showing dual volume sliders.',
      },
    },
  },
};

// ==============================================================================
// Track Overview
// ==============================================================================

/**
 * All available meditation tracks.
 * Overview of all 12 tracks with their details.
 */
export const AllTracks: Story = {
  render: () => {
    const tracks = getAllTracks();
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          maxWidth: '900px',
        }}
      >
        {tracks.map((track: MeditationTrack) => (
          <div
            key={track.id}
            style={{
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#404040' }}>
                {track.name}
              </h3>
              <span
                style={{
                  padding: '2px 8px',
                  fontSize: '11px',
                  backgroundColor: track.language === 'es' ? '#fef3c7' : '#e0e7ff',
                  color: track.language === 'es' ? '#92400e' : '#3730a3',
                  borderRadius: '4px',
                }}
              >
                {track.language.toUpperCase()}
              </span>
            </div>
            <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#737373' }}>
              {track.description}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  padding: '2px 6px',
                  fontSize: '12px',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  borderRadius: '4px',
                }}
              >
                {Math.floor(track.durationSeconds / 60)} min
              </span>
              <span
                style={{
                  padding: '2px 6px',
                  fontSize: '12px',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  borderRadius: '4px',
                }}
              >
                {track.type.replace('_', ' ')}
              </span>
              <span
                style={{
                  padding: '2px 6px',
                  fontSize: '12px',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  borderRadius: '4px',
                }}
              >
                {track.durationPreset}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Overview of all 12 available meditation tracks with their types and durations.',
      },
    },
  },
};

// ==============================================================================
// Test Stories with Play Functions
// ==============================================================================

/** Test track configuration */
const testTrack: MeditationTrack = {
  id: 'test_track',
  name: 'Test Meditation',
  type: 'breathing_focus',
  durationSeconds: 10,
  durationPreset: 'short',
  description: 'Test track for automated testing',
  audioUrl: 'https://example.com/test.mp3',
  narrator: 'Test Narrator',
  language: 'en',
  bestFor: ['testing'],
  attribution: 'Test attribution',
};

/**
 * Test: Starting meditation
 * Verifies that clicking Start begins the meditation
 */
export const TestStartMeditation: Story = {
  args: {
    track: testTrack,
    introduction: 'Test meditation for automated interaction testing',
    enableAmbient: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify idle state
    await expect(canvas.getByText('Begin Meditation')).toBeInTheDocument();
    await expect(canvas.getByText('Test Meditation')).toBeInTheDocument();

    // Click start button
    const startButton = canvas.getByText('Begin Meditation');
    await userEvent.click(startButton);

    // Verify playing state (play button should now show)
    await expect(canvas.getByRole('button', { name: /pause meditation/i })).toBeInTheDocument();
  },
};

/**
 * Test: Mood check interaction
 * Verifies mood selection works correctly
 */
export const TestMoodCheck: StoryObj<typeof MoodCheck> = {
  render: () => <MoodCheck label="How are you feeling?" onSelect={fn()} onSkip={fn()} allowSkip />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify mood buttons exist
    const moodButtons = canvas.getAllByRole('radio');
    await expect(moodButtons).toHaveLength(5);

    // Click a mood rating
    await userEvent.click(moodButtons[3]); // "Good" rating

    // Verify selection
    await expect(moodButtons[3]).toHaveAttribute('aria-checked', 'true');
  },
};

/**
 * Test: Visual component accessibility
 * Verifies ARIA attributes are set correctly
 */
export const TestVisualAccessibility: StoryObj<typeof MeditationVisual> = {
  render: () => <MeditationVisual playbackState="playing" variant="orb" size={120} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Visual should be hidden from screen readers
    const visual = canvas.getByRole('presentation');
    await expect(visual).toHaveAttribute('aria-hidden', 'true');
  },
};

/**
 * Visual test: Player in different states
 * Manual verification - no automated assertions
 */
export const VisualPlayerStates: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '400px',
      }}
    >
      <div>
        <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#999' }}>Loading State</p>
        <MeditationPlayer
          state={{
            playbackState: 'loading',
            currentTime: 0,
            duration: 0,
            progress: 0,
            isLoading: true,
            error: null,
          }}
          track={MEDITATION_TRACKS.breathing_focus}
          onPlay={fn()}
          onPause={fn()}
          onStop={fn()}
          onSeek={fn()}
          volume={0.8}
          onVolumeChange={fn()}
        />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#999' }}>Playing State</p>
        <MeditationPlayer
          state={{
            playbackState: 'playing',
            currentTime: 127,
            duration: 300,
            progress: 42.3,
            isLoading: false,
            error: null,
          }}
          track={MEDITATION_TRACKS.breathing_focus}
          onPlay={fn()}
          onPause={fn()}
          onStop={fn()}
          onSeek={fn()}
          volume={0.8}
          onVolumeChange={fn()}
        />
      </div>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#999' }}>Paused State</p>
        <MeditationPlayer
          state={{
            playbackState: 'paused',
            currentTime: 180,
            duration: 300,
            progress: 60,
            isLoading: false,
            error: null,
          }}
          track={MEDITATION_TRACKS.breathing_focus}
          onPlay={fn()}
          onPause={fn()}
          onStop={fn()}
          onSeek={fn()}
          volume={0.5}
          onVolumeChange={fn()}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual comparison of player in different states (loading, playing, paused).',
      },
    },
  },
};

/**
 * Mobile responsive view
 * Shows the component at mobile viewport width
 */
export const MobileView: Story = {
  args: {
    track: MEDITATION_TRACKS.breathing_focus,
    introduction: 'Mobile-optimized meditation experience.',
    enableAmbient: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Meditation component at mobile viewport width. Controls stack vertically.',
      },
    },
  },
};
