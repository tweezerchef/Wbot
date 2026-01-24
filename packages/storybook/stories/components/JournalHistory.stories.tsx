/**
 * JournalHistory Stories
 *
 * Sidebar component for browsing past journal entries.
 * Expandable panel with entry list showing category, preview, and metadata.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { JournalHistory } from '@/features/journaling/components/JournalHistory/JournalHistory';

/**
 * JournalHistory displays recent journal entries in an expandable sidebar panel.
 * Shows category badges, entry previews, word counts, and favorite status.
 *
 * Note: This component fetches data from Supabase via useJournalEntries hook.
 * In Storybook, it will show the loading/empty states unless connected to a real backend.
 */
const meta: Meta<typeof JournalHistory> = {
  title: 'Components/Journaling/JournalHistory',
  component: JournalHistory,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Sidebar component for journal entry history. Features:
- Expandable/collapsible toggle button
- Entry list with category badges and time display
- Preview text and word count
- Favorite star indicator
- Loading and empty states
- Mobile-aware (closes sidebar on entry selection)`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '280px',
          background: 'var(--color-surface, #fff)',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    onSelectEntry: fn(),
    onCloseSidebar: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof JournalHistory>;

// =============================================================================
// States
// =============================================================================

/**
 * Default collapsed state - shows toggle button.
 */
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Initial collapsed state. Click the toggle button to expand and load entries.',
      },
    },
  },
};

/**
 * Component as it appears in sidebar context.
 */
export const InSidebarContext: Story = {
  args: {},
  decorators: [
    (Story) => (
      <div
        style={{
          width: '280px',
          padding: '8px',
          background: 'var(--color-surface, #fff)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// =============================================================================
// Mobile Views
// =============================================================================

/**
 * Mobile viewport.
 */
export const Mobile: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '100%',
          padding: '8px',
          background: 'var(--color-surface, #fff)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// =============================================================================
// Documentation Stories
// =============================================================================

/**
 * Component behavior documentation.
 */
export const Documentation: StoryObj = {
  render: () => (
    <div style={{ padding: '16px', maxWidth: '500px' }}>
      <h3 style={{ marginBottom: '16px' }}>JournalHistory Component</h3>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>Features</h4>
        <ul style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '1.6' }}>
          <li>Expandable toggle button with chevron rotation</li>
          <li>Fetches 10 most recent entries via useJournalEntries hook</li>
          <li>Category badges with emoji and color</li>
          <li>Relative time display (e.g., "2 hours ago")</li>
          <li>Preview text truncated to 60 characters</li>
          <li>Word count and favorite star indicator</li>
          <li>Loading and empty state handling</li>
          <li>Closes sidebar on mobile when entry is selected</li>
        </ul>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>Props</h4>
        <ul style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '1.6' }}>
          <li>
            <code>onSelectEntry</code>: Called when user clicks an entry
          </li>
          <li>
            <code>onCloseSidebar</code>: Called on mobile to close sidebar
          </li>
        </ul>
      </div>

      <div>
        <h4 style={{ marginBottom: '8px', fontSize: '14px' }}>Data Requirements</h4>
        <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
          This component requires Supabase authentication and the journal_entries table. In
          Storybook without backend connection, it will show loading/empty states.
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Documentation of JournalHistory component features and behavior.',
      },
    },
  },
};

/**
 * Visual reference for entry item structure.
 */
export const EntryItemStructure: StoryObj = {
  render: () => (
    <div
      style={{
        width: '280px',
        background: 'var(--color-surface, #fff)',
        borderRadius: '8px',
        padding: '12px',
      }}
    >
      <p style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
        Entry item structure reference:
      </p>

      {/* Mock entry item */}
      <div
        style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'var(--color-background, #f5f5f5)',
          cursor: 'pointer',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 500,
              background: 'var(--color-success, #10b981)',
              color: 'white',
            }}
          >
            🙏 Gratitude
          </span>
          <span style={{ fontSize: '11px', color: '#888' }}>2h ago</span>
        </div>

        {/* Prompt */}
        <p
          style={{
            fontSize: '13px',
            fontWeight: 500,
            marginBottom: '4px',
            color: 'var(--color-text, #333)',
          }}
        >
          Write about three things you are grateful for...
        </p>

        {/* Preview */}
        <p
          style={{
            fontSize: '12px',
            color: '#666',
            marginBottom: '8px',
            lineHeight: '1.4',
          }}
        >
          Today I am grateful for the quiet morning I had with my cof...
        </p>

        {/* Meta */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: '#888',
          }}
        >
          <span>85 words</span>
          <span style={{ color: 'gold' }}>★</span>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Visual reference showing the structure of a journal entry item in the list.',
      },
    },
  },
};
