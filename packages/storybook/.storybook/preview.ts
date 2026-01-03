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
      default: 'wellness',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'wellness', value: '#f5f7fa' },
      ],
    },
    layout: 'centered',
  },
};

export default preview;
