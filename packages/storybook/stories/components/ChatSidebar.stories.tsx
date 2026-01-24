/**
 * ChatSidebar Stories
 *
 * Navigation sidebar for the chat interface containing:
 * - User profile with streak info
 * - New conversation button
 * - Quick discover actions
 * - Conversation history
 * - Journal entries history
 * - Pre-recorded meditation library
 * - Progress tracking widget
 * - Theme toggle and logout
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { ChatSidebar } from '@/features/chat/components/ChatSidebar/ChatSidebar';

/**
 * ChatSidebar provides the main navigation hub for the chat interface.
 * It contains user profile, discover actions, conversation history,
 * journal entries, meditation library, and progress tracking.
 */
const meta: Meta<typeof ChatSidebar> = {
  title: 'Components/Chat/ChatSidebar',
  component: ChatSidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Main navigation sidebar. Contains user profile, discover actions, conversation history, journal entries, meditation library, progress widget, and logout. Responsive with open/closed states.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', height: '100vh' }}>
        <Story />
        <div style={{ flex: 1, background: 'var(--color-background, #f5f5f5)', padding: '20px' }}>
          <p style={{ color: 'var(--color-text-secondary, #666)' }}>Main content area</p>
        </div>
      </div>
    ),
  ],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the sidebar is open or collapsed',
    },
    isHydrated: {
      control: 'boolean',
      description: 'Whether the component has hydrated (for CLS prevention)',
    },
    userEmail: {
      control: 'text',
      description: "User's email address",
    },
    currentConversationId: {
      control: 'text',
      description: 'ID of the currently selected conversation',
    },
  },
  args: {
    onClose: fn(),
    onNewConversation: fn(),
    onSelectConversation: fn(),
    onLogout: fn(),
    onDirectComponent: fn(),
    onSelectJournalEntry: fn(),
    onActivityRequest: fn(),
    onSelectPrerecordedMeditation: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ChatSidebar>;

// =============================================================================
// Open/Closed States
// =============================================================================

/**
 * Sidebar open with user logged in.
 */
export const Open: Story = {
  args: {
    isOpen: true,
    isHydrated: true,
    userEmail: 'user@example.com',
    userId: 'user-123',
    currentConversationId: 'conv-456',
  },
};

/**
 * Sidebar closed (collapsed state).
 */
export const Closed: Story = {
  args: {
    isOpen: false,
    isHydrated: true,
    userEmail: 'user@example.com',
    userId: 'user-123',
    currentConversationId: 'conv-456',
  },
};

// =============================================================================
// Hydration States
// =============================================================================

/**
 * Before hydration - prevents CLS with skeleton-like appearance.
 */
export const BeforeHydration: Story = {
  args: {
    isOpen: true,
    isHydrated: false,
    userEmail: undefined,
    userId: undefined,
    currentConversationId: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Initial SSR state before client-side hydration. Shows loading skeletons for lazy-loaded components.',
      },
    },
  },
};

/**
 * After hydration with user data.
 */
export const AfterHydration: Story = {
  args: {
    isOpen: true,
    isHydrated: true,
    userEmail: 'jane.doe@example.com',
    userId: 'user-789',
    currentConversationId: 'conv-123',
  },
};

// =============================================================================
// User States
// =============================================================================

/**
 * With no user email (edge case).
 */
export const NoUserEmail: Story = {
  args: {
    isOpen: true,
    isHydrated: true,
    userEmail: undefined,
    userId: 'user-123',
    currentConversationId: null,
  },
};

/**
 * With long email address.
 */
export const LongEmail: Story = {
  args: {
    isOpen: true,
    isHydrated: true,
    userEmail: 'very.long.email.address.that.might.overflow@example.com',
    userId: 'user-123',
    currentConversationId: 'conv-456',
  },
};

// =============================================================================
// Conversation States
// =============================================================================

/**
 * No conversation selected (new user or after clearing).
 */
export const NoConversation: Story = {
  args: {
    isOpen: true,
    isHydrated: true,
    userEmail: 'user@example.com',
    userId: 'user-123',
    currentConversationId: null,
  },
};

/**
 * With active conversation highlighted.
 */
export const WithActiveConversation: Story = {
  args: {
    isOpen: true,
    isHydrated: true,
    userEmail: 'user@example.com',
    userId: 'user-123',
    currentConversationId: 'conv-active-123',
  },
};

// =============================================================================
// Mobile Views
// =============================================================================

/**
 * Mobile viewport - sidebar open (overlay behavior).
 */
export const MobileOpen: Story = {
  args: {
    isOpen: true,
    isHydrated: true,
    userEmail: 'user@example.com',
    userId: 'user-123',
    currentConversationId: 'conv-456',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', overflow: 'hidden' }}>
        <Story />
      </div>
    ),
  ],
};

/**
 * Mobile viewport - sidebar closed.
 */
export const MobileClosed: Story = {
  args: {
    isOpen: false,
    isHydrated: true,
    userEmail: 'user@example.com',
    userId: 'user-123',
    currentConversationId: 'conv-456',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// =============================================================================
// Tablet View
// =============================================================================

/**
 * Tablet viewport.
 */
export const Tablet: Story = {
  args: {
    isOpen: true,
    isHydrated: true,
    userEmail: 'user@example.com',
    userId: 'user-123',
    currentConversationId: 'conv-456',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

// =============================================================================
// Large Desktop View
// =============================================================================

/**
 * Large desktop viewport.
 */
export const LargeDesktop: Story = {
  args: {
    isOpen: true,
    isHydrated: true,
    userEmail: 'user@example.com',
    userId: 'user-123',
    currentConversationId: 'conv-456',
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};
