// ============================================================================
// Root Layout Component
// ============================================================================
// This is the root layout that wraps all pages in the application.
//
// App Architecture:
// - The chatbot is the PRIMARY interface (full-screen on mobile & desktop)
// - Interactive activities (breathing, meditation, journaling) are displayed
//   INSIDE the chatbot, triggered by the AI during conversation or by navigation with the user
// - Sidebar provides navigation on the client side
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
import { TanStackDevtools } from '@tanstack/react-devtools';
import { QueryClientProvider, QueryErrorResetBoundary } from '@tanstack/react-query';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';
import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import * as React from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import { ThemeProvider } from '../features/settings';
import type { RouterContext } from '../types';

// Import global styles - applies CSS reset and variables
import '../styles/globals.css';
// Import CSS module for root layout components
import styles from './__root.module.css';

// ----------------------------------------------------------------------------
// Query Error Fallback Component
// ----------------------------------------------------------------------------

/**
 * Error fallback for TanStack Query errors.
 *
 * Displays when a query fails and allows the user to retry.
 * Integrates with QueryErrorResetBoundary to reset failed queries on retry.
 */
function QueryErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" className={styles.errorFallback}>
      <h2 className={styles.errorHeading}>Something went wrong</h2>
      <p className={styles.errorMessage}>
        {error instanceof Error ? error.message : 'An unexpected error occurred'}
      </p>
      <button onClick={resetErrorBoundary} className={styles.retryButton}>
        Try Again
      </button>
    </div>
  );
}

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
          Critical CSS: Minimal inline styles to prevent mobile sidebar FOUC.

          CSS variables, reset, and base styles are loaded via globals.css.
          ChatPage critical layout is loaded via the chat route bundle (chat.css).

          Only sidebar hide logic remains inline because:
          - React initializes sidebar state to closed (useState(false))
          - Without this, sidebar briefly appears then jumps to hidden
          - This ~15 lines prevents that layout shift on all routes
        */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Sidebar must be hidden initially to match React useState(false) */
              [class*="_sidebar_"]:not([class*="_sidebarOpen_"]) {
                transform: translateX(-100%);
              }
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
        <QueryClientProvider client={queryClient}>
          {/*
            QueryErrorResetBoundary + ErrorBoundary provides graceful error handling
            for TanStack Query errors. When a query fails, users see a friendly
            error message with a retry button that resets failed queries.
          */}
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary onReset={reset} FallbackComponent={QueryErrorFallback}>
                {/* ThemeProvider manages light/dark/system theme preferences */}
                <ThemeProvider>
                  {/*
                    The app container fills the entire viewport.
                    This is important for mobile full-screen experience.
                    Using dvh (dynamic viewport height) to account for mobile browser chrome.
                  */}
                  <div id="app" className={styles.appContainer}>
                    {/* Child routes render here (landing or chat) */}
                    {children}
                  </div>
                </ThemeProvider>
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        </QueryClientProvider>

        {/* TanStack Start scripts for client-side hydration */}
        <Scripts />
        <TanStackDevtools
          plugins={[
            {
              name: 'TanStack Query',
              render: <ReactQueryDevtoolsPanel />,
              defaultOpen: true,
            },
            {
              name: 'TanStack Router',
              render: <TanStackRouterDevtoolsPanel />,
              defaultOpen: false,
            },
          ]}
        />
      </body>
    </html>
  );
}
