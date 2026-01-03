// ============================================================================
// Vitest Configuration
// ============================================================================
// Separate from vite.config.ts because:
// - We don't need TanStack Start plugins for unit tests
// - Tests run in happy-dom, not a full browser
// - We need testing-specific settings (coverage, setup files)
// ============================================================================

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import tsConfigPaths from 'vite-tsconfig-paths';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const monorepoRoot = resolve(__dirname, '../..');

export default defineConfig({
  // Load `.env*` files from the monorepo root for consistency with Vite
  envDir: monorepoRoot,

  plugins: [
    // React plugin for JSX transform in tests
    react(),

    // TypeScript path aliases (e.g., @/components -> src/components)
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],

  test: {
    // Use happy-dom for faster tests (lighter than jsdom)
    environment: 'happy-dom',

    // Setup file for global test utilities (jest-dom matchers, etc.)
    setupFiles: ['./vitest.setup.ts'],

    // Include test files matching these patterns
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // Exclude node_modules and build output
    exclude: ['node_modules', '.output', 'dist'],

    // Global test timeout (10 seconds)
    testTimeout: 10000,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/routes/**', // Route files are tested via integration tests
        'src/routeTree.gen.ts', // Auto-generated file
      ],
    },

    // Reporter configuration
    reporters: ['verbose'],
  },
});
