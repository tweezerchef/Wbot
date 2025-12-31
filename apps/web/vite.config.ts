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

import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
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
