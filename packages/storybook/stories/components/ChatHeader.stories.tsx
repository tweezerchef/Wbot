/**
 * ChatHeader Stories
 *
 * Header bar for the chat interface containing the logo and sidebar controls.
 * Responsive behavior:
 * - Mobile: Shows hamburger menu button to toggle sidebar
 * - Desktop: Shows expand button when sidebar is collapsed
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { ChatHeader } from '@/features/chat/components/ChatHeader/ChatHeader';

/**
 * ChatHeader displays the Wbot logo and sidebar toggle controls.
 * The toggle button changes based on viewport and sidebar state.
 */
const meta: Meta<typeof ChatHeader> = {
  title: 'Components/Chat/ChatHeader',
  component: ChatHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Chat interface header with logo and responsive sidebar controls. Shows menu icon on mobile, expand icon on desktop when sidebar is closed.',
      },
    },
  },
  argTypes: {
    isSidebarOpen: {
      control: 'boolean',
      description: 'Whether the sidebar is currently open',
    },
  },
  args: {
    onToggleSidebar: fn(),
    onExpandSidebar: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ChatHeader>;

// =============================================================================
// Desktop States
// =============================================================================

/**
 * Sidebar closed - shows expand button on desktop.
 */
export const SidebarClosed: Story = {
  args: {
    isSidebarOpen: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'When sidebar is closed, desktop users see an expand button (chevron right) to open the sidebar.',
      },
    },
  },
};

/**
 * Sidebar open - expand button is hidden on desktop.
 */
export const SidebarOpen: Story = {
  args: {
    isSidebarOpen: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'When sidebar is open, the expand button is hidden since the sidebar is visible.',
      },
    },
  },
};

// =============================================================================
// Mobile States
// =============================================================================

/**
 * Mobile with sidebar closed - shows hamburger menu icon.
 */
export const MobileSidebarClosed: Story = {
  args: {
    isSidebarOpen: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'On mobile, shows hamburger menu icon when sidebar is closed.',
      },
    },
  },
};

/**
 * Mobile with sidebar open - shows close (X) icon.
 */
export const MobileSidebarOpen: Story = {
  args: {
    isSidebarOpen: true,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'On mobile, shows close icon (X) when sidebar is open.',
      },
    },
  },
};

// =============================================================================
// Interactive Test Stories
// =============================================================================

/**
 * Test: Toggle button changes icon based on sidebar state.
 */
export const TestToggleIcon: Story = {
  args: {
    isSidebarOpen: false,
    onToggleSidebar: fn(),
    onExpandSidebar: fn(),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find the menu button with "Open menu" label
    const menuButton = canvas.getByRole('button', { name: /open menu/i });
    await expect(menuButton).toBeInTheDocument();
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  },
};

/**
 * Test: Toggle button callback is called.
 */
export const TestToggleCallback: Story = {
  args: {
    isSidebarOpen: false,
    onToggleSidebar: fn(),
    onExpandSidebar: fn(),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find and click the menu button
    const menuButton = canvas.getByRole('button', { name: /open menu/i });
    await userEvent.click(menuButton);

    // Verify callback was called
    await expect(args.onToggleSidebar).toHaveBeenCalledTimes(1);
  },
};

/**
 * Test: Close menu state.
 */
export const TestCloseMenuState: Story = {
  args: {
    isSidebarOpen: true,
    onToggleSidebar: fn(),
    onExpandSidebar: fn(),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Should show "Close menu" when sidebar is open
    const closeButton = canvas.getByRole('button', { name: /close menu/i });
    await expect(closeButton).toBeInTheDocument();
    await expect(closeButton).toHaveAttribute('aria-expanded', 'true');
  },
};

/**
 * Test: Logo is always visible.
 */
export const TestLogoVisible: Story = {
  args: {
    isSidebarOpen: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Logo should always be visible
    const logo = canvas.getByRole('heading', { name: /wbot/i });
    await expect(logo).toBeInTheDocument();
  },
};

// =============================================================================
// Responsive Showcase
// =============================================================================

/**
 * Tablet viewport - tests intermediate responsive behavior.
 */
export const Tablet: Story = {
  args: {
    isSidebarOpen: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

/**
 * Large desktop viewport.
 */
export const LargeDesktop: Story = {
  args: {
    isSidebarOpen: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};
