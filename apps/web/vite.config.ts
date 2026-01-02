// ============================================================================
// Vite Configuration for TanStack Start
// ============================================================================
// TanStack Start uses Vite with special plugins for:
// - File-based routing
// - Server-side rendering (SSR)
// - Server functions
// - Bundling and code splitting
//
// IMPORTANT: The TanStack Start plugin must come BEFORE the React plugin
// ============================================================================

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const monorepoRoot = resolve(__dirname, '../..');

export default defineConfig({
  // Load `.env*` files from the monorepo root instead of `apps/web/`
  envDir: monorepoRoot,
  plugins: [
    // TanStack Start plugin - handles routing, SSR, server functions
    // Must come before React plugin
    tanstackStart(),

    // React plugin - handles JSX transform and Fast Refresh
    react(),

    // TypeScript path aliases (e.g., @/components -> src/components)
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],

  // Server configuration
  server: {
    // Disable auto-opening browser to prevent spam on errors
    open: false,
  },
});
