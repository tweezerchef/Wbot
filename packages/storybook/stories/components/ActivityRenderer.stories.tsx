/**
 * ActivityRenderer Stories
 *
 * Renders the appropriate component based on DirectComponent selection from sidebar.
 * All activity components are lazy-loaded to reduce initial bundle size.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ActivityRenderer } from '@/features/navigation/components/ActivityRenderer/ActivityRenderer';

/**
 * ActivityRenderer dynamically renders activity components based on the
 * DirectComponent type selected from the sidebar discover nav.
 *
 * Supports:
 * - Breathing: box, relaxing_478, coherent, deep_calm, wimhof
 * - Meditation: timer, guided, library
 * - Wellness: profile, moodcheck
 * - Gamification: badges, streak, goals
 */
const meta: Meta<typeof ActivityRenderer> = {
  title: 'Components/Navigation/ActivityRenderer',
  component: ActivityRenderer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `Dynamic activity router that renders components based on DirectComponent selection.

**Performance:** All activity components are lazy-loaded with Suspense for optimal bundle size.

**Component Types:**
- \`breathing\`: ImmersiveBreathing or WimHofExercise
- \`meditation\`: TimerMeditation, GuidedMeditation, or MeditationLibrary
- \`wellness\`: WellnessProfile or MoodCheck
- \`gamification\`: BadgeGrid, StreakDisplay, or WeeklyGoals`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', background: 'var(--color-background, #f5f5f5)' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    onClose: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ActivityRenderer>;

// =============================================================================
// Breathing Activities
// =============================================================================

/**
 * Box Breathing - 4-4-4-4 pattern.
 */
export const BreathingBox: Story = {
  args: {
    component: { type: 'breathing', variant: 'box' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Renders ImmersiveBreathing with Box Breathing technique.',
      },
    },
  },
};

/**
 * 4-7-8 Relaxing Breath.
 */
export const BreathingRelaxing: Story = {
  args: {
    component: { type: 'breathing', variant: 'relaxing_478' },
  },
};

/**
 * Coherent Breathing - 6-6 pattern.
 */
export const BreathingCoherent: Story = {
  args: {
    component: { type: 'breathing', variant: 'coherent' },
  },
};

/**
 * Deep Calm - 5-2-7-2 pattern.
 */
export const BreathingDeepCalm: Story = {
  args: {
    component: { type: 'breathing', variant: 'deep_calm' },
  },
};

/**
 * Wim Hof Method - Power breathing with retention.
 */
export const BreathingWimHof: Story = {
  args: {
    component: { type: 'breathing', variant: 'wimhof' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Renders WimHofExercise with default Wim Hof technique.',
      },
    },
  },
};

// =============================================================================
// Meditation Activities
// =============================================================================

/**
 * Timer Meditation - Simple timed session.
 */
export const MeditationTimer: Story = {
  args: {
    component: { type: 'meditation', variant: 'timer' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Renders TimerMeditation with 5-minute default.',
      },
    },
  },
};

/**
 * Meditation Library - Browse available tracks.
 */
export const MeditationLibrary: Story = {
  args: {
    component: { type: 'meditation', variant: 'library' },
  },
};

/**
 * Guided Meditation - Shows library to select track.
 */
export const MeditationGuided: Story = {
  args: {
    component: { type: 'meditation', variant: 'guided' },
  },
};

// =============================================================================
// Wellness Activities
// =============================================================================

/**
 * Wellness Profile - User stats and insights.
 */
export const WellnessProfile: Story = {
  args: {
    component: { type: 'wellness', variant: 'profile' },
  },
};

/**
 * Mood Check - Quick mood selection.
 */
export const WellnessMoodCheck: Story = {
  args: {
    component: { type: 'wellness', variant: 'moodcheck' },
  },
};

// =============================================================================
// Gamification Activities
// =============================================================================

/**
 * Badges - Achievement display.
 */
export const GamificationBadges: Story = {
  args: {
    component: { type: 'gamification', variant: 'badges' },
  },
};

/**
 * Streak Display - Current streak count.
 */
export const GamificationStreak: Story = {
  args: {
    component: { type: 'gamification', variant: 'streak' },
  },
};

/**
 * Weekly Goals - Progress tracking.
 */
export const GamificationGoals: Story = {
  args: {
    component: { type: 'gamification', variant: 'goals' },
  },
};

// =============================================================================
// Mobile Views
// =============================================================================

/**
 * Mobile viewport - breathing activity.
 */
export const MobileBreathing: Story = {
  args: {
    component: { type: 'breathing', variant: 'box' },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Mobile viewport - meditation timer.
 */
export const MobileMeditation: Story = {
  args: {
    component: { type: 'meditation', variant: 'timer' },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// =============================================================================
// Documentation
// =============================================================================

/**
 * Component type documentation.
 */
export const ComponentTypeDocumentation: StoryObj = {
  render: () => (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '16px' }}>DirectComponent Types</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '14px' }}>Breathing</h3>
          <code style={{ display: 'block', marginBottom: '8px' }}>
            {`{ type: 'breathing', variant: 'box' | 'relaxing_478' | 'coherent' | 'deep_calm' | 'wimhof' }`}
          </code>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
            <li>
              <strong>box, relaxing_478, coherent, deep_calm</strong>: ImmersiveBreathing
            </li>
            <li>
              <strong>wimhof</strong>: WimHofExercise
            </li>
          </ul>
        </div>

        <div style={{ padding: '16px', background: '#fdf4ff', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '14px' }}>Meditation</h3>
          <code style={{ display: 'block', marginBottom: '8px' }}>
            {`{ type: 'meditation', variant: 'timer' | 'guided' | 'library' }`}
          </code>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
            <li>
              <strong>timer</strong>: TimerMeditation (5 min default)
            </li>
            <li>
              <strong>guided</strong>: MeditationLibrary (select then play)
            </li>
            <li>
              <strong>library</strong>: MeditationLibrary
            </li>
          </ul>
        </div>

        <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '14px' }}>Wellness</h3>
          <code style={{ display: 'block', marginBottom: '8px' }}>
            {`{ type: 'wellness', variant: 'profile' | 'moodcheck' }`}
          </code>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
            <li>
              <strong>profile</strong>: WellnessProfile (stats & insights)
            </li>
            <li>
              <strong>moodcheck</strong>: MoodCheck (quick mood selection)
            </li>
          </ul>
        </div>

        <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '14px' }}>Gamification</h3>
          <code style={{ display: 'block', marginBottom: '8px' }}>
            {`{ type: 'gamification', variant: 'badges' | 'streak' | 'goals' }`}
          </code>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
            <li>
              <strong>badges</strong>: BadgeGrid
            </li>
            <li>
              <strong>streak</strong>: StreakDisplay
            </li>
            <li>
              <strong>goals</strong>: WeeklyGoals
            </li>
          </ul>
        </div>
      </div>

      <div
        style={{ marginTop: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}
      >
        <h3 style={{ marginBottom: '8px', fontSize: '14px' }}>Usage</h3>
        <pre
          style={{
            padding: '12px',
            background: '#1e293b',
            color: '#e2e8f0',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
          }}
        >
          {`import { ActivityRenderer } from '@/features/navigation';

<ActivityRenderer
  component={{ type: 'breathing', variant: 'box' }}
  onClose={() => setShowActivity(false)}
/>`}
        </pre>
      </div>
    </div>
  ),
};
