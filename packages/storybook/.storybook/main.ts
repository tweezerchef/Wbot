// This file has been automatically migrated to valid ESM format by Storybook.
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

import type { StorybookConfig } from '@storybook/react-vite';

const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));
const webAppPath = resolve(__dirname, '../../../apps/web');

// Detect Chromatic builds via STORYBOOK_ prefixed environment variable
// Storybook auto-exposes STORYBOOK_* vars at build time
// Chromatic CLI doesn't pass regular env vars to the build subprocess
// Reference: https://github.com/chromaui/chromatic-cli/issues/532
const isChromatic = !!process.env.STORYBOOK_IS_CHROMATIC;

interface RollupLogLike {
  code?: string;
  message: string;
}

type RollupWarningLike = RollupLogLike | string | (() => string | RollupLogLike);

type RollupDefaultHandler = (warning: RollupWarningLike) => void;

type RollupWarningHandler = (
  warning: RollupWarningLike,
  defaultHandler: RollupDefaultHandler
) => void;

// Build addons array - vitest addon is always included as it provides 'storybook/test' module
// that stories import from. The addon handles production builds gracefully.
const addons: StorybookConfig['addons'] = [
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
];

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons,

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
    const onwarn: RollupWarningHandler = (warning, defaultHandler) => {
      if (
        typeof warning !== 'string' &&
        typeof warning !== 'function' &&
        warning.code === 'MODULE_LEVEL_DIRECTIVE'
      ) {
        return;
      }

      defaultHandler(warning);
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

    // For Chromatic builds, inject stubs for Storybook module globals BEFORE the vitest mocker entry.
    // The vitest addon injects vite-inject-mocker-entry.js as the first script in <head>, which tries to
    // access __STORYBOOK_MODULE_TEST__.spyOn before Storybook's preview runtime sets it up.
    // This causes "Error: __STORYBOOK_MODULE_TEST__ is not defined" in Chromatic.
    if (isChromatic) {
      config.plugins = config.plugins ?? [];
      config.plugins.push({
        name: 'storybook:chromatic-test-stubs',
        enforce: 'post',
        transformIndexHtml(html) {
          // Inject stubs BEFORE any other scripts by inserting right after <head>
          // These provide the minimum API surface needed by the vitest mocker entry
          const stubScript = `<script>
// Chromatic test stubs - provides Storybook module globals before vitest mocker loads
// __STORYBOOK_MODULE_TEST__ - Testing utilities (fn, spyOn, expect, userEvent, etc.)
window.__STORYBOOK_MODULE_TEST__ = {
  fn: function() { var f = function() {}; f.mockClear = function() { return f; }; f.mockReset = function() { return f; }; f.mockReturnValue = function() { return f; }; f.mockImplementation = function() { return f; }; f.mockResolvedValue = function() { return f; }; f.mockRejectedValue = function() { return f; }; return f; },
  spyOn: function() { return window.__STORYBOOK_MODULE_TEST__.fn(); },
  expect: function() { var chain = { toBe: function() { return chain; }, toEqual: function() { return chain; }, toBeTruthy: function() { return chain; }, toBeFalsy: function() { return chain; }, toHaveBeenCalled: function() { return chain; }, toHaveBeenCalledWith: function() { return chain; }, toHaveBeenCalledTimes: function() { return chain; }, toContain: function() { return chain; }, toHaveLength: function() { return chain; }, toBeNull: function() { return chain; }, toBeUndefined: function() { return chain; }, toBeDefined: function() { return chain; }, toBeInstanceOf: function() { return chain; }, toThrow: function() { return chain; }, toThrowError: function() { return chain; }, resolves: chain, rejects: chain, not: {} }; chain.not = { toBe: function() { return chain; }, toEqual: function() { return chain; }, toHaveBeenCalled: function() { return chain; }, toContain: function() { return chain; } }; return chain; },
  userEvent: { click: async function() {}, type: async function() {}, clear: async function() {}, hover: async function() {}, unhover: async function() {}, tab: async function() {}, keyboard: async function() {}, setup: function() { return window.__STORYBOOK_MODULE_TEST__.userEvent; } },
  within: function() { return { getByRole: function() { return document.createElement('div'); }, getByText: function() { return document.createElement('div'); }, getByLabelText: function() { return document.createElement('div'); }, getByTestId: function() { return document.createElement('div'); }, getByPlaceholderText: function() { return document.createElement('div'); }, queryByRole: function() { return null; }, queryByText: function() { return null; }, queryByTestId: function() { return null; }, findByRole: async function() { return document.createElement('div'); }, findByText: async function() { return document.createElement('div'); } }; },
  waitFor: async function(fn) { if (typeof fn === 'function') { return fn(); } },
  fireEvent: { click: function() {}, change: function() {}, submit: function() {}, focus: function() {}, blur: function() {} }
};
// __STORYBOOK_MODULE_CORE_EVENTS_PREVIEW_ERRORS__ - Error types for preview
window.__STORYBOOK_MODULE_CORE_EVENTS_PREVIEW_ERRORS__ = {
  MissingStoryAfterHmrError: function(data) { this.name = 'MissingStoryAfterHmrError'; this.message = 'Story missing after HMR'; this.data = data; },
  ImplicitActionsDuringRendering: function(data) { this.name = 'ImplicitActionsDuringRendering'; this.message = 'Implicit actions during rendering'; this.data = data; },
  CalledExtractOnStoreError: function(data) { this.name = 'CalledExtractOnStoreError'; this.message = 'Called extract on store'; this.data = data; },
  MissingStoryFromCsfFileError: function(data) { this.name = 'MissingStoryFromCsfFileError'; this.message = 'Missing story from CSF file'; this.data = data; },
  StoryIndexFetchError: function(data) { this.name = 'StoryIndexFetchError'; this.message = 'Story index fetch error'; this.data = data; },
  StoryStoreAccessedBeforeInitializationError: function(data) { this.name = 'StoryStoreAccessedBeforeInitializationError'; this.message = 'Store accessed before init'; this.data = data; },
  NoStoryMatchError: function(data) { this.name = 'NoStoryMatchError'; this.message = 'No story match'; this.data = data; },
  EmptyIndexError: function(data) { this.name = 'EmptyIndexError'; this.message = 'Empty index'; this.data = data; }
};
</script>`;
          // Insert at the very beginning of <head> so it runs before vitest mocker entry
          return html.replace('<head>', '<head>' + stubScript);
        },
      });
    }

    return config;
  },

  // Include web app's public assets (audio files, etc.)
  staticDirs: [{ from: join(webAppPath, 'public'), to: '/' }],
};

export default config;

function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}
