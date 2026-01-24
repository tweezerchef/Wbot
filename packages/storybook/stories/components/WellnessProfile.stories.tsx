/**
 * WellnessProfile Stories
 *
 * Displays the user's wellness profile with stats, trends, and insights.
 * Requires Supabase connection for real data; shows documentation for mock states.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { WellnessProfile } from '@/features/wellness/components/WellnessProfile/WellnessProfile';

/**
 * WellnessProfile displays user wellness data including emotional baseline,
 * conversation/activity stats, recurring topics/triggers, and improvements.
 *
 * Note: This component fetches data from Supabase. In Storybook without
 * backend connection, it will show loading/error/empty states.
 */
const meta: Meta<typeof WellnessProfile> = {
  title: 'Components/Wellness/WellnessProfile',
  component: WellnessProfile,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Displays user wellness profile with stats and insights.

**Features:**
- Emotional baseline indicator with color
- Stats grid (conversations, activities, days active)
- Recurring topics and triggers
- Current focus/concern
- Progress improvements

**Data Source:** Fetches from \`user_wellness_profiles\` table in Supabase.
Requires authenticated user.`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    compact: {
      control: 'boolean',
      description: 'Show compact version (stats only, no topics/triggers)',
    },
    showLoading: {
      control: 'boolean',
      description: 'Whether to show loading state while fetching',
    },
  },
  args: {
    onLoaded: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof WellnessProfile>;

// =============================================================================
// Live Data Stories (require Supabase)
// =============================================================================

/**
 * Default - fetches data for current authenticated user.
 */
export const Default: Story = {
  args: {
    showLoading: true,
    compact: false,
  },
};

/**
 * Compact mode - shows only stats, no topics or triggers.
 */
export const Compact: Story = {
  args: {
    showLoading: true,
    compact: true,
  },
};

/**
 * With specific user ID.
 */
export const WithUserId: Story = {
  args: {
    userId: 'test-user-123',
    showLoading: true,
    compact: false,
  },
};

// =============================================================================
// Mobile Views
// =============================================================================

/**
 * Mobile viewport.
 */
export const Mobile: Story = {
  args: {
    showLoading: true,
    compact: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '16px' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Mobile compact mode.
 */
export const MobileCompact: Story = {
  args: {
    showLoading: true,
    compact: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '16px' }}>
        <Story />
      </div>
    ),
  ],
};

// =============================================================================
// Documentation Stories
// =============================================================================

/**
 * Visual reference for wellness profile structure.
 */
export const ProfileStructureReference: StoryObj = {
  render: () => (
    <div
      style={{
        maxWidth: '400px',
        padding: '20px',
        background: 'var(--color-surface, #fff)',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '16px' }}>Your Wellness Profile</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22c55e',
            }}
          />
          <span style={{ fontSize: '12px', color: '#666' }}>Positive</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '20px',
          padding: '16px',
          background: 'var(--color-background, #f5f5f5)',
          borderRadius: '8px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>42</div>
          <div style={{ fontSize: '11px', color: '#888' }}>Conversations</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>18</div>
          <div style={{ fontSize: '11px', color: '#888' }}>Activities</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>21</div>
          <div style={{ fontSize: '11px', color: '#888' }}>Days Active</div>
        </div>
      </div>

      {/* Topics */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#666' }}>Topics You Discuss</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {['work stress', 'sleep', 'anxiety', 'relationships'].map((topic) => (
            <span
              key={topic}
              style={{
                padding: '4px 10px',
                background: '#e0f2fe',
                color: '#0369a1',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      {/* Triggers */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#666' }}>
          Identified Triggers
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {['deadlines', 'lack of sleep'].map((trigger) => (
            <span
              key={trigger}
              style={{
                padding: '4px 10px',
                background: '#fef3c7',
                color: '#92400e',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            >
              {trigger}
            </span>
          ))}
        </div>
      </div>

      {/* Current Focus */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#666' }}>Current Focus</h4>
        <p style={{ fontSize: '14px', margin: 0, color: '#333' }}>
          Managing work-life balance and improving sleep quality
        </p>
      </div>

      {/* Progress */}
      <div>
        <h4 style={{ fontSize: '13px', marginBottom: '8px', color: '#666' }}>Progress Made</h4>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6' }}>
          <li>Established regular breathing practice</li>
          <li>Improved stress management during meetings</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual reference showing the structure of a wellness profile with sample data.',
      },
    },
  },
};

/**
 * All emotional baseline states.
 */
export const BaselineStates: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
      <h3 style={{ margin: 0 }}>Emotional Baseline States</h3>
      <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
        The baseline indicator color reflects the user's overall emotional state.
      </p>

      {[
        { label: 'Very Positive', color: '#10b981', key: 'very_positive' },
        { label: 'Positive', color: '#22c55e', key: 'positive' },
        { label: 'Neutral', color: '#94a3b8', key: 'neutral' },
        { label: 'Negative', color: '#f59e0b', key: 'negative' },
        { label: 'Very Negative', color: '#ef4444', key: 'very_negative' },
      ].map(({ label, color, key }) => (
        <div
          key={key}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: '#f5f5f5',
            borderRadius: '8px',
          }}
        >
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: color,
            }}
          />
          <span style={{ fontSize: '14px' }}>{label}</span>
          <code style={{ marginLeft: 'auto', fontSize: '11px', color: '#888' }}>{key}</code>
        </div>
      ))}
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows all possible emotional baseline states with their corresponding colors.',
      },
    },
  },
};

/**
 * Component states documentation.
 */
export const StateDocumentation: StoryObj = {
  render: () => (
    <div style={{ padding: '24px', maxWidth: '600px' }}>
      <h2 style={{ marginBottom: '16px' }}>WellnessProfile States</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '14px' }}>Loading State</h3>
          <p style={{ fontSize: '13px', color: '#4b5563', margin: 0 }}>
            Shows spinner and "Loading profile..." text while fetching data from Supabase.
            Controlled by <code>showLoading</code> prop (default: true).
          </p>
        </div>

        <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '14px' }}>Error State</h3>
          <p style={{ fontSize: '13px', color: '#4b5563', margin: 0 }}>
            Shows error message when fetch fails or user is not authenticated. Common errors: "Not
            authenticated", "Failed to load wellness profile".
          </p>
        </div>

        <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '14px' }}>Empty State</h3>
          <p style={{ fontSize: '13px', color: '#4b5563', margin: 0 }}>
            Shows "No wellness data yet" message for new users without profile data. Encourages
            continued engagement to build profile.
          </p>
        </div>

        <div style={{ padding: '16px', background: '#fdf4ff', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '8px', fontSize: '14px' }}>Compact Mode</h3>
          <p style={{ fontSize: '13px', color: '#4b5563', margin: 0 }}>
            When <code>compact=true</code>, shows only the header and stats grid. Hides topics,
            triggers, current focus, and improvements. Useful for sidebar widgets.
          </p>
        </div>
      </div>
    </div>
  ),
};
