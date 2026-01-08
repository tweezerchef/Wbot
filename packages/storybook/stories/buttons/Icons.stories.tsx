import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  HistoryIcon,
  LogoutIcon,
  MenuIcon,
  NewChatIcon,
  SearchIcon,
} from '@/components/ui/icons';

/**
 * Icon components used throughout the Wbot UI.
 * All icons are 24x24 SVGs that inherit color from their parent via `currentColor`.
 */
const meta: Meta = {
  title: 'Components/Icons',
  parameters: {
    docs: {
      description: {
        component:
          'SVG icon components used for navigation, actions, and UI indicators. All icons use `currentColor` for easy theming.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ color: '#404040', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

// Grid component showing all icons together
function IconGrid() {
  const icons = [
    { name: 'Menu', component: MenuIcon, description: 'Mobile menu toggle' },
    { name: 'Close', component: CloseIcon, description: 'Close/dismiss actions' },
    { name: 'ChevronLeft', component: ChevronLeftIcon, description: 'Navigate back' },
    { name: 'ChevronRight', component: ChevronRightIcon, description: 'Navigate forward' },
    { name: 'ChevronDown', component: ChevronDownIcon, description: 'Expand/dropdown' },
    { name: 'NewChat', component: NewChatIcon, description: 'Start new conversation' },
    { name: 'History', component: HistoryIcon, description: 'View conversation history' },
    { name: 'Search', component: SearchIcon, description: 'Search functionality' },
    { name: 'Logout', component: LogoutIcon, description: 'Sign out' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '32px',
        padding: '24px',
      }}
    >
      {icons.map(({ name, component: Icon, description }) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: '#f5f5f5',
            }}
          >
            <Icon />
          </div>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>{name}</span>
          <span style={{ fontSize: '12px', color: '#737373', textAlign: 'center' }}>
            {description}
          </span>
        </div>
      ))}
    </div>
  );
}

export const AllIcons: StoryObj = {
  render: () => <IconGrid />,
  parameters: {
    docs: {
      description: {
        story: 'All available icons displayed in a grid with their names and use cases.',
      },
    },
  },
};

export const Menu: StoryObj = {
  render: () => <MenuIcon />,
  parameters: {
    docs: {
      description: {
        story: 'Hamburger menu icon - three horizontal lines for mobile menu toggle.',
      },
    },
  },
};

export const Close: StoryObj = {
  render: () => <CloseIcon />,
  parameters: {
    docs: {
      description: { story: 'X icon for closing modals, sidebars, and dismissing content.' },
    },
  },
};

export const ChevronLeft: StoryObj = {
  render: () => <ChevronLeftIcon />,
  parameters: {
    docs: { description: { story: 'Left-pointing chevron for back navigation.' } },
  },
};

export const ChevronRight: StoryObj = {
  render: () => <ChevronRightIcon />,
  parameters: {
    docs: { description: { story: 'Right-pointing chevron for forward navigation.' } },
  },
};

export const ChevronDown: StoryObj = {
  render: () => <ChevronDownIcon />,
  parameters: {
    docs: { description: { story: 'Down-pointing chevron for expandable sections or dropdowns.' } },
  },
};

export const NewChat: StoryObj = {
  render: () => <NewChatIcon />,
  parameters: {
    docs: { description: { story: 'Plus/pencil icon for starting a new conversation.' } },
  },
};

export const History: StoryObj = {
  render: () => <HistoryIcon />,
  parameters: {
    docs: { description: { story: 'Clock icon for viewing conversation history.' } },
  },
};

export const Search: StoryObj = {
  render: () => <SearchIcon />,
  parameters: {
    docs: { description: { story: 'Magnifying glass for search functionality.' } },
  },
};

export const Logout: StoryObj = {
  render: () => <LogoutIcon />,
  parameters: {
    docs: { description: { story: 'Door/arrow icon for signing out.' } },
  },
};

// Themed examples
export const ThemedIcons: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: '32px' }}>
      <div style={{ color: '#4a9d9a' }}>
        <MenuIcon />
        <span style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>Primary</span>
      </div>
      <div style={{ color: '#7c6f9c' }}>
        <HistoryIcon />
        <span style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>Secondary</span>
      </div>
      <div style={{ color: '#e07a5f' }}>
        <NewChatIcon />
        <span style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>Accent</span>
      </div>
      <div style={{ color: '#ef4444' }}>
        <LogoutIcon />
        <span style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>Error</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Icons inherit color from their parent, making them easy to theme.',
      },
    },
  },
};
