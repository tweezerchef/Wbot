import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { fn } from 'storybook/test';

import {
  MeditationStreakBadge,
  TimerMeditation,
  useBinauralBeats,
} from '@/components/GuidedMeditation';
import { MeditationSeries, BadgeUnlock } from '@/components/MeditationSeries';
import type { MeditationSeriesType } from '@/components/MeditationSeries';

// =============================================================================
// MeditationStreakBadge Stories
// =============================================================================

const streakMeta: Meta<typeof MeditationStreakBadge> = {
  title: 'Interactive/MeditationFeatures/StreakBadge',
  component: MeditationStreakBadge,
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'wellness' },
    docs: {
      description: {
        component: `
Displays the user's meditation streak with celebratory animations.

## Features
- Dynamic emoji based on streak length (🔥 → 🌟 → ⭐ → 🏆)
- Celebration animation when streak is saved
- Compact and expanded variants
- Encouraging messages based on milestone
        `,
      },
    },
  },
  argTypes: {
    streak: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Current streak count in days',
    },
    variant: {
      control: 'radio',
      options: ['compact', 'expanded'],
      description: 'Display variant',
    },
    showCelebration: {
      control: 'boolean',
      description: 'Trigger celebration animation',
    },
  },
};

export default streakMeta;
type StreakStory = StoryObj<typeof MeditationStreakBadge>;

/** Default streak badge showing a 5-day streak */
export const DefaultStreak: StreakStory = {
  args: {
    streak: 5,
    variant: 'expanded',
    showCelebration: false,
  },
};

/** New user just starting their streak */
export const NewStreak: StreakStory = {
  args: {
    streak: 1,
    variant: 'expanded',
  },
};

/** Building momentum - 3 day streak */
export const BuildingMomentum: StreakStory = {
  args: {
    streak: 3,
    variant: 'expanded',
  },
};

/** One week streak - first major milestone */
export const OneWeekStreak: StreakStory = {
  args: {
    streak: 7,
    variant: 'expanded',
  },
};

/** Two week streak - showing consistency */
export const TwoWeekStreak: StreakStory = {
  args: {
    streak: 14,
    variant: 'expanded',
  },
};

/** 30+ day streak - trophy status */
export const MasterStreak: StreakStory = {
  args: {
    streak: 30,
    variant: 'expanded',
  },
};

/** Compact variant for space-constrained UI */
export const CompactVariant: StreakStory = {
  args: {
    streak: 12,
    variant: 'compact',
  },
};

/** Celebration animation when streak is saved */
export const WithCelebration: StreakStory = {
  args: {
    streak: 7,
    variant: 'expanded',
    showCelebration: true,
    onCelebrationComplete: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows the celebration animation that plays when a streak is saved after completing a meditation.',
      },
    },
  },
};

/** All streak milestones comparison */
export const AllMilestones: StreakStory = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <MeditationStreakBadge streak={1} variant="expanded" />
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Day 1</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <MeditationStreakBadge streak={3} variant="expanded" />
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Day 3</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <MeditationStreakBadge streak={7} variant="expanded" />
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Day 7</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <MeditationStreakBadge streak={14} variant="expanded" />
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Day 14</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <MeditationStreakBadge streak={30} variant="expanded" />
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>Day 30+</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all streak milestone badges showing emoji and message progression.',
      },
    },
  },
};

// =============================================================================
// TimerMeditation Stories
// =============================================================================

export const TimerMeditationDefault: StoryObj<typeof TimerMeditation> = {
  render: () => (
    <div style={{ width: '380px' }}>
      <TimerMeditation
        initialMinutes={5}
        enableAmbient={true}
        enableBinaural={true}
        onComplete={() => {
          console.warn('Timer completed!');
        }}
        onStop={(elapsed) => {
          console.warn(`Stopped after ${String(elapsed)} seconds`);
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: `
Silent meditation timer with real ambient sounds and binaural beats.

**Features:**
- Configurable duration (3-30 minutes)
- Real ambient sounds (ocean, rain, forest) from public audio files
- Binaural beats generated via Web Audio API
- Visual breathing animation during meditation
        `,
      },
    },
  },
};

export const TimerWithoutExtras: StoryObj<typeof TimerMeditation> = {
  render: () => (
    <div style={{ width: '380px' }}>
      <TimerMeditation
        initialMinutes={10}
        enableAmbient={false}
        enableBinaural={false}
        onComplete={() => {
          console.warn('Timer completed!');
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Simple timer without ambient sounds or binaural beats - pure silent meditation.',
      },
    },
  },
};

// =============================================================================
// Binaural Beats Demo
// =============================================================================

function BinauralBeatsDemo(): ReactElement {
  const binaural = useBinauralBeats({
    enabled: true,
    frequency: 'theta',
    volume: 0.3,
  });

  return (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '12px', width: '320px' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Binaural Beats Generator</h3>

      <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
        {binaural.getDescription()}
      </p>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>
          Frequency Preset
        </label>
        <select
          value={binaural.frequency}
          onChange={(e) => {
            binaural.setFrequency(e.target.value as 'delta' | 'theta' | 'alpha' | 'beta');
          }}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
        >
          <option value="delta">Delta (2 Hz) - Deep sleep</option>
          <option value="theta">Theta (6 Hz) - Deep meditation</option>
          <option value="alpha">Alpha (10 Hz) - Relaxation</option>
          <option value="beta">Beta (20 Hz) - Alert focus</option>
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>
          Volume: {Math.round(binaural.volume * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={binaural.volume}
          onChange={(e) => {
            binaural.setVolume(parseFloat(e.target.value));
          }}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {!binaural.isPlaying ? (
          <button
            onClick={binaural.start}
            style={{
              flex: 1,
              padding: '10px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ▶ Start
          </button>
        ) : (
          <>
            <button
              onClick={binaural.stop}
              style={{
                flex: 1,
                padding: '10px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              ■ Stop
            </button>
            <button
              onClick={() => {
                binaural.fadeOut(2);
              }}
              style={{
                flex: 1,
                padding: '10px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Fade Out
            </button>
          </>
        )}
      </div>

      <p style={{ fontSize: '12px', color: '#999', marginTop: '16px', textAlign: 'center' }}>
        🎧 Use headphones for best effect
      </p>
    </div>
  );
}

export const BinauralBeatsGenerator: StoryObj = {
  render: () => <BinauralBeatsDemo />,
  parameters: {
    docs: {
      description: {
        story: `
Interactive binaural beats generator using the Web Audio API.

**How it works:**
- Plays two slightly different frequencies in each ear
- The brain perceives a "beat" at the difference frequency
- Different frequencies target different brainwave states

**Use headphones** - binaural beats only work with stereo separation.
        `,
      },
    },
  },
};

// =============================================================================
// MeditationSeries Stories
// =============================================================================

const mockSeries: MeditationSeriesType[] = [
  {
    id: '7_day_calm',
    title: '7 Day Calm',
    description: 'A week of daily stress relief meditations to build your calm practice.',
    trackIds: [
      'breathing_focus',
      'body_scan_short',
      'daily_mindfulness',
      'anxiety_relief',
      'body_scan_medium',
      'loving_kindness',
      'complete_relaxation',
    ],
    badgeName: 'Week of Calm',
    badgeEmoji: '🧘',
    totalDurationSeconds: 2820,
    difficulty: 'beginner',
  },
  {
    id: 'sleep_better',
    title: 'Sleep Better',
    description: 'A 5-day program to improve your sleep through guided relaxation.',
    trackIds: [
      'body_scan_short',
      'breathing_focus',
      'body_scan_medium',
      'complete_relaxation',
      'sleep_meditation',
    ],
    badgeName: 'Sleep Master',
    badgeEmoji: '😴',
    totalDurationSeconds: 2700,
    difficulty: 'beginner',
  },
  {
    id: 'self_compassion',
    title: 'Self-Compassion Journey',
    description: 'Develop a loving relationship with yourself through 7 sessions.',
    trackIds: [
      'breathing_focus',
      'loving_kindness',
      'anxiety_relief',
      'loving_kindness',
      'body_scan_medium',
      'loving_kindness_extended',
      'loving_kindness_extended',
    ],
    badgeName: 'Heart of Gold',
    badgeEmoji: '💛',
    totalDurationSeconds: 3480,
    difficulty: 'intermediate',
  },
];

export const SeriesNotStarted: StoryObj<typeof MeditationSeries> = {
  render: () => (
    <div style={{ width: '380px' }}>
      <MeditationSeries
        series={mockSeries[0]}
        progress={null}
        onStartSession={(idx) => {
          console.warn(`Starting session ${String(idx)}`);
        }}
        onViewDetails={() => {
          console.warn('View details');
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A meditation series that hasn\'t been started yet. Shows "Start Series" button.',
      },
    },
  },
};

export const SeriesInProgress: StoryObj<typeof MeditationSeries> = {
  render: () => (
    <div style={{ width: '380px' }}>
      <MeditationSeries
        series={mockSeries[0]}
        progress={{
          seriesId: '7_day_calm',
          completedTrackIds: ['breathing_focus', 'body_scan_short', 'daily_mindfulness'],
          currentTrackIndex: 3,
          startedAt: '2024-01-01T00:00:00Z',
          completedAt: null,
          badgeEarned: false,
        }}
        onStartSession={(idx) => {
          console.warn(`Continuing at session ${String(idx)}`);
        }}
        onViewDetails={() => {
          console.warn('View details');
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A meditation series in progress showing completion status and "Continue" button.',
      },
    },
  },
};

export const SeriesCompleted: StoryObj<typeof MeditationSeries> = {
  render: () => (
    <div style={{ width: '380px' }}>
      <MeditationSeries
        series={mockSeries[0]}
        progress={{
          seriesId: '7_day_calm',
          completedTrackIds: mockSeries[0].trackIds,
          currentTrackIndex: 7,
          startedAt: '2024-01-01T00:00:00Z',
          completedAt: '2024-01-07T00:00:00Z',
          badgeEarned: true,
        }}
        onStartSession={(idx) => {
          console.warn(`Restarting at session ${String(idx)}`);
        }}
        onViewDetails={() => {
          console.warn('View details');
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'A completed meditation series with "Complete" badge and "Restart Series" option.',
      },
    },
  },
};

export const AllSeries: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '400px' }}>
      {mockSeries.map((series, idx) => (
        <MeditationSeries
          key={series.id}
          series={series}
          progress={
            idx === 1
              ? {
                  seriesId: series.id,
                  completedTrackIds: [series.trackIds[0], series.trackIds[1]],
                  currentTrackIndex: 2,
                  startedAt: '2024-01-01T00:00:00Z',
                  completedAt: null,
                  badgeEarned: false,
                }
              : null
          }
          onStartSession={(i) => {
            console.warn(`${series.title}: session ${String(i)}`);
          }}
          onViewDetails={() => {
            console.warn(`Details: ${series.title}`);
          }}
        />
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All available meditation series showing different progress states.',
      },
    },
  },
};

// =============================================================================
// BadgeUnlock Stories
// =============================================================================

export const BadgeUnlockDefault: StoryObj<typeof BadgeUnlock> = {
  render: () => (
    <BadgeUnlock
      badgeName="Week of Calm"
      badgeEmoji="🧘"
      onClose={() => {
        console.warn('Badge dismissed');
      }}
      autoClose={false}
    />
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Celebration overlay when a user earns a badge. Shows confetti animation and badge details.',
      },
    },
  },
};

export const BadgeUnlockSleepMaster: StoryObj<typeof BadgeUnlock> = {
  render: () => (
    <BadgeUnlock
      badgeName="Sleep Master"
      badgeEmoji="😴"
      onClose={() => {
        console.warn('Badge dismissed');
      }}
      autoClose={false}
    />
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

export const BadgeUnlockHeartOfGold: StoryObj<typeof BadgeUnlock> = {
  render: () => (
    <BadgeUnlock
      badgeName="Heart of Gold"
      badgeEmoji="💛"
      onClose={() => {
        console.warn('Badge dismissed');
      }}
      autoClose={false}
    />
  ),
  parameters: {
    layout: 'fullscreen',
  },
};

export const BadgeUnlockWithAutoClose: StoryObj<typeof BadgeUnlock> = {
  render: () => (
    <BadgeUnlock
      badgeName="30 Day Streak!"
      badgeEmoji="🏆"
      onClose={() => {
        console.warn('Auto-closed after 5 seconds');
      }}
      autoClose={true}
      autoCloseDelay={5000}
    />
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: "Badge unlock that auto-closes after 5 seconds if the user doesn't interact.",
      },
    },
  },
};
