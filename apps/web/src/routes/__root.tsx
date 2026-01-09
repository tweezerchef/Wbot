// ============================================================================
// Root Layout Component
// ============================================================================
// This is the root layout that wraps all pages in the application.
//
// App Architecture:
// - The chatbot is the PRIMARY interface (full-screen on mobile & desktop)
// - Interactive activities (breathing, meditation, journaling) are displayed
//   INSIDE the chatbot, triggered by the AI during conversation
// - No traditional navigation - the AI guides the user through activities
//
// Routes:
// - "/" (index): Landing page with login (when not authenticated)
// - "/chat": Full-screen chatbot interface (when authenticated)
//
// TanStack Router file conventions:
// - __root.tsx: Root layout wrapping all pages
// - index.tsx: Index route for a directory
// - _authed.tsx: Pathless layout for protected routes
// ============================================================================

/// <reference types="vite/client" />
import { QueryClientProvider } from '@tanstack/react-query';
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import * as React from 'react';

import { ThemeProvider } from '../features/settings';
import type { RouterContext } from '../types';

// Import global styles - applies CSS reset and variables
import '../styles/globals.css';

// ----------------------------------------------------------------------------
// Root Route Definition
// ----------------------------------------------------------------------------
// Use createRootRouteWithContext to receive the QueryClient from router context.
// This is the TanStack-recommended pattern for SSR-safe Query integration.
export const Route = createRootRouteWithContext<RouterContext>()({
  // Head configuration for the HTML document
  head: () => ({
    meta: [
      // Character encoding for proper text rendering
      { charSet: 'utf-8' },
      // Responsive viewport - essential for mobile full-screen experience
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      // App description for SEO and social sharing
      { name: 'description', content: 'Wbot - Your personal wellness companion' },
      // Theme color for browser chrome (mobile)
      { name: 'theme-color', content: '#4a9d9a' },
      // Prevent phone number detection (can interfere with chat)
      { name: 'format-detection', content: 'telephone=no' },
    ],
    links: [
      // Favicon
      { rel: 'icon', href: '/favicon.ico' },
      // Apple touch icon for iOS home screen
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
    ],
  }),

  // Use shellComponent for the HTML document shell
  // This wraps the entire application and provides the document structure
  shellComponent: RootDocument,
});

// ----------------------------------------------------------------------------
// Root Document Component
// ----------------------------------------------------------------------------

/**
 * The root document component.
 *
 * This is a minimal layout since the chatbot takes up the full screen.
 * No navigation header - the chat IS the interface.
 *
 * The children prop renders the current route:
 * - Landing page (/) when not logged in
 * - Chat interface (/chat) when logged in
 */
function RootDocument({ children }: { children: React.ReactNode }) {
  // Get QueryClient from router context (created per-request for SSR safety)

  const { queryClient } = Route.useRouteContext();

  return (
    <html lang="en">
      <head>
        {/* TanStack Router injects meta tags from route.head() */}
        <HeadContent />
        {/*
          Critical CSS: Inline essential styles to prevent FOUC.

          These styles are embedded directly in the HTML response so the page
          looks styled immediately, before JavaScript loads CSS modules.

          Includes:
          1. Essential CSS variables (colors, fonts, spacing)
          2. CSS reset (box-sizing, margins)
          3. Body and html base styles
          4. FOUC visibility transition
        */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* === Critical CSS Variables (ALL from variables.css) === */
              :root {
                /* Primary colors */
                --color-primary: #4a9d9a;
                --color-primary-hover: #3d8583;
                --color-primary-light: #e8f4f3;

                /* Secondary colors */
                --color-secondary: #7c6f9c;
                --color-secondary-hover: #685d84;
                --color-secondary-light: #f0edf5;

                /* Accent colors */
                --color-accent: #e07a5f;
                --color-accent-hover: #c96a51;

                /* Neutral palette */
                --color-neutral-50: #fafafa;
                --color-neutral-100: #f5f5f5;
                --color-neutral-200: #e5e5e5;
                --color-neutral-300: #d4d4d4;
                --color-neutral-400: #a3a3a3;
                --color-neutral-500: #737373;
                --color-neutral-600: #525252;
                --color-neutral-700: #404040;
                --color-neutral-800: #262626;
                --color-neutral-900: #171717;

                /* Semantic colors */
                --color-success: #22c55e;
                --color-success-light: #dcfce7;
                --color-warning: #eab308;
                --color-warning-light: #fef9c3;
                --color-error: #ef4444;
                --color-error-light: #fee2e2;

                /* Background/Surface colors */
                --color-background: #ffffff;
                --color-background-secondary: #fafafa;
                --color-surface: #ffffff;

                /* Text colors */
                --color-text-primary: #262626;
                --color-text-secondary: #737373;
                --color-text-muted: #a3a3a3;
                --color-text-inverse: #ffffff;

                /* Spacing scale */
                --spacing-xs: 4px;
                --spacing-sm: 8px;
                --spacing-md: 16px;
                --spacing-lg: 24px;
                --spacing-xl: 32px;
                --spacing-2xl: 48px;
                --spacing-3xl: 64px;

                /* Typography */
                --font-family-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                --font-family-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
                --font-size-xs: 0.75rem;
                --font-size-sm: 0.875rem;
                --font-size-base: 1rem;
                --font-size-lg: 1.125rem;
                --font-size-xl: 1.25rem;
                --font-size-2xl: 1.5rem;
                --font-size-3xl: 1.875rem;
                --font-size-4xl: 2.25rem;
                --font-weight-normal: 400;
                --font-weight-medium: 500;
                --font-weight-semibold: 600;
                --font-weight-bold: 700;
                --line-height-tight: 1.25;
                --line-height-normal: 1.5;
                --line-height-relaxed: 1.75;

                /* Borders & Radius */
                --border-width: 1px;
                --border-color: #e5e5e5;
                --radius-sm: 4px;
                --radius-md: 8px;
                --radius-lg: 12px;
                --radius-xl: 16px;
                --radius-full: 9999px;

                /* Shadows */
                --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
                --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
                --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

                /* Transitions */
                --transition-fast: 150ms ease;
                --transition-normal: 250ms ease;
                --transition-slow: 350ms ease;

                /* Layout */
                --max-width-content: 800px;
                --max-width-wide: 1200px;
                --header-height: 64px;
                --sidebar-width: 280px;
              }

              /* === CSS Reset === */
              *, *::before, *::after { box-sizing: border-box; }
              * { margin: 0; }
              html {
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
                -webkit-text-size-adjust: 100%;
              }

              /* === Body Base Styles === */
              body {
                font-family: var(--font-family-sans);
                font-size: var(--font-size-base);
                line-height: var(--line-height-normal);
                color: var(--color-text-primary);
                background-color: var(--color-background);
              }

              /* === Smooth Loading Transition === */
              /* Content is visible immediately with critical CSS above */
              /* This class just provides a smooth transition when full CSS loads */
              body.loaded { transition: none; }

              /* === Button Reset === */
              button { cursor: pointer; border: none; background: none; padding: 0; font: inherit; }
              button:disabled { cursor: not-allowed; opacity: 0.5; }

              /* === Link Styles === */
              a { color: var(--color-primary); text-decoration: none; }
              a:hover { color: var(--color-primary-hover); }

              /* === Critical Layout: Sidebar Hidden by Default === */
              /*
               * The sidebar must be hidden initially to match React's useState(false).
               * Without this, the sidebar renders visible then jumps to hidden.
               */
              [class*="_sidebar_"]:not([class*="_sidebarOpen_"]) {
                transform: translateX(-100%);
              }

              /* Desktop: sidebar collapses to 0 width when closed */
              @media (min-width: 768px) {
                [class*="_sidebar_"]:not([class*="_sidebarOpen_"]) {
                  position: relative;
                  transform: translateX(0);
                  width: 0;
                  overflow: hidden;
                }
              }
            `,
          }}
        />
      </head>
      <body>
        {/* QueryClientProvider enables TanStack Query throughout the app */}
        {}
        <QueryClientProvider client={queryClient}>
          {/* ThemeProvider manages light/dark/system theme preferences */}
          <ThemeProvider>
            {/*
              The app container fills the entire viewport.
              This is important for mobile full-screen experience.
              Using dvh (dynamic viewport height) to account for mobile browser chrome.

              Critical layout styles are inlined to prevent layout shift while
              CSS module chunks load asynchronously.
            */}
            <div
              id="app"
              style={{
                minHeight: '100dvh',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-text-primary)',
              }}
            >
              {/* Child routes render here (landing or chat) */}
              {children}
            </div>
          </ThemeProvider>
        </QueryClientProvider>

        {/* TanStack Start scripts for client-side hydration */}
        <Scripts />

        {/*
          Mark body as loaded after hydration.
          The 'loaded' class can be used for CSS transitions if needed.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.body.classList.add('loaded');`,
          }}
        />
      </body>
    </html>
  );
}
