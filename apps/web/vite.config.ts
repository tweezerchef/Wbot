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
import { visualizer } from 'rollup-plugin-visualizer';
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

    // React plugin with React Compiler for automatic optimization
    react({
      babel: {
        plugins: [
          [
            'babel-plugin-react-compiler',
            {
              // Compile all components and hooks for maximum optimization
              // The compiler automatically memoizes to prevent unnecessary re-renders
            },
          ],
        ],
      },
    }),

    // TypeScript path aliases (e.g., @/components -> src/components)
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),

    // Bundle analyzer - generates stats.html to visualize bundle composition
    visualizer({
      filename: './dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  // Build optimization
  build: {
    rollupOptions: {
      output: {
        // Manual chunks for better code splitting and caching
        manualChunks: {
          // React core libraries (stable, rarely changes)
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime'],

          // TanStack ecosystem (routing, queries, forms)
          'tanstack-vendor': [
            '@tanstack/react-query',
            '@tanstack/react-router',
            '@tanstack/react-start',
          ],

          // Supabase client library (large, stable)
          'supabase-vendor': ['@supabase/supabase-js'],

          // Shared utilities and types
          'shared-vendor': ['zod'],
        },
      },
    },
  },

  // Server configuration
  server: {
    // Disable auto-opening browser to prevent spam on errors
    open: false,
  },
});
