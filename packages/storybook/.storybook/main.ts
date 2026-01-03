import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

import type { StorybookConfig } from '@storybook/react-vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const webAppPath = resolve(__dirname, '../../../apps/web');

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions', '@storybook/addon-a11y'],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  viteFinal: (config) => {
    // Add path aliases to resolve @wbot/web components
    config.resolve = config.resolve ?? {};

    // Define our path aliases
    const newAliases: Record<string, string> = {
      '@': join(webAppPath, 'src'),
      '@wbot/shared': resolve(__dirname, '../../../packages/shared/src'),
    };

    // Merge with existing alias if it's an object (not array)
    const existingAlias = config.resolve.alias;
    if (existingAlias && typeof existingAlias === 'object' && !Array.isArray(existingAlias)) {
      config.resolve.alias = Object.assign({}, existingAlias, newAliases);
    } else {
      config.resolve.alias = newAliases;
    }

    // CSS Modules configuration
    config.css = {
      modules: {
        localsConvention: 'camelCase',
      },
    };

    return config;
  },

  // Include web app's public assets (audio files, etc.)
  staticDirs: [{ from: join(webAppPath, 'public'), to: '/' }],

  docs: {
    autodocs: true,
  },
};

export default config;
