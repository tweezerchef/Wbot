import type { Preview } from '@storybook/react';

// Import global CSS variables from web app
import '../../../apps/web/src/styles/variables.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    backgrounds: {
      options: {
        light: { name: 'light', value: '#ffffff' },
        dark: { name: 'dark', value: '#1a1a1a' },
        wellness: { name: 'wellness', value: '#f5f7fa' },
      },
    },

    layout: 'centered',

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },

  initialGlobals: {
    backgrounds: {
      value: 'wellness',
    },
  },

  tags: ['autodocs'],
};

export default preview;
