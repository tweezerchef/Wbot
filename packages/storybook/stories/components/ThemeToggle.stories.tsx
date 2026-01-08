import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThemeToggle, ThemeProvider } from '@/features/settings';

/**
 * Theme toggle component for switching between light, dark, and system themes.
 */
const meta: Meta<typeof ThemeToggle> = {
  title: 'Components/Settings/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Toggle for switching between light, dark, and system color schemes. Persists preference to localStorage.',
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div style={{ padding: '2rem' }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

/**
 * Default theme toggle - icons only.
 */
export const Default: Story = {
  args: {
    showLabels: false,
  },
};

/**
 * Theme toggle with labels.
 */
export const WithLabels: Story = {
  args: {
    showLabels: true,
  },
};

/**
 * Theme toggle in a dark container.
 */
export const DarkBackground: Story = {
  args: {
    showLabels: false,
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div
          style={{
            padding: '2rem',
            background: '#1a1a2e',
            borderRadius: '8px',
          }}
        >
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};
