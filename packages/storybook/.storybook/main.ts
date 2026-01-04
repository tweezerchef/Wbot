// This file has been automatically migrated to valid ESM format by Storybook.
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

import type { StorybookConfig } from '@storybook/react-vite';

const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));
const webAppPath = resolve(__dirname, '../../../apps/web');

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-vitest'),
    getAbsolutePath('@storybook/experimental-addon-test'),
    {
      name: getAbsolutePath('@storybook/addon-mcp'),
      options: {
        toolsets: {
          dev: true, // Story URL retrieval & UI instructions
          docs: true, // Component manifest & documentation
        },
      },
    },
  ],

  // Required for MCP docs tools
  features: {
    experimentalComponentsManifest: true,
  },

  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },

  viteFinal: (config) => {
    // Load environment variables from monorepo root (same as web app)
    // This enables VITE_SUPABASE_URL for audio file URLs
    config.envDir = resolve(__dirname, '../../..');

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
};

export default config;

function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
