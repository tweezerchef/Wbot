// This file has been automatically migrated to valid ESM format by Storybook.
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

import type { StorybookConfig } from '@storybook/react-vite';

const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));
const webAppPath = resolve(__dirname, '../../../apps/web');

interface RollupWarning {
  code?: string;
}

type RollupWarn = (warning: RollupWarning) => void;

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    getAbsolutePath('@storybook/addon-a11y'),
    getAbsolutePath('@storybook/addon-docs'),
    getAbsolutePath('@storybook/addon-vitest'),
    {
      name: getAbsolutePath('@storybook/addon-mcp'),
      options: {
        toolsets: {
          dev: true, // Story URL retrieval & UI instructions
          docs: true, // Component manifest & documentation
        },
      },
    },
    getAbsolutePath('@chromatic-com/storybook'),
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

    // Code splitting - separate large dependencies into chunks
    // Fixes the "chunks are larger than 500 kB" warning
    // Uses function-based manualChunks to only split modules that are actually imported
    const manualChunks = (id: string) => {
      // React core (stable, rarely changes)
      if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
        return 'react-vendor';
      }
      // Framer Motion (large animation library)
      if (id.includes('node_modules/framer-motion/')) {
        return 'framer-motion';
      }
      // TanStack ecosystem
      if (id.includes('node_modules/@tanstack/')) {
        return 'tanstack-vendor';
      }
      // Storybook addons - split into separate chunks
      if (id.includes('node_modules/@storybook/addon-docs/')) {
        return 'storybook-docs';
      }
      if (
        id.includes('node_modules/@storybook/addon-a11y/') ||
        id.includes('node_modules/axe-core/')
      ) {
        return 'storybook-a11y';
      }
      // Storybook core
      if (id.includes('node_modules/@storybook/')) {
        return 'storybook-core';
      }
    };

    // Get existing output config (handle array case)
    const existingOutput = config.build?.rollupOptions?.output;
    const baseOutput = Array.isArray(existingOutput) ? existingOutput[0] : existingOutput;

    // Ignore "use client" directive warnings from dependencies during build.
    const onwarn = (warning: RollupWarning, warn: RollupWarn) => {
      if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
        return;
      }

      warn(warning);
    };

    config.build = {
      ...config.build,
      // Storybook bundles are large; avoid noisy warnings in CI logs.
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        ...config.build?.rollupOptions,
        onwarn,
        output: {
          ...baseOutput,
          manualChunks,
        },
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
