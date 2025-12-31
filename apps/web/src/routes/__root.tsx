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
// ============================================================================

/// <reference types="vite/client" />
import {
  HeadContent,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router';
import * as React from 'react';

// Import global styles - applies CSS reset and variables
import '../styles/globals.css';

// ----------------------------------------------------------------------------
// Root Route Definition
// ----------------------------------------------------------------------------
export const Route = createRootRoute({
  // Head configuration for the HTML document
  head: () => ({
    meta: [
      // Character encoding for proper text rendering
      { charSet: 'utf-8' },
      // Responsive viewport - essential for mobile full-screen experience
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      // App description for SEO and social sharing
      { name: 'description', content: 'TBot - Your personal therapy companion' },
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
  return (
    <html lang="en">
      <head>
        {/* TanStack Router injects meta tags from route.head() */}
        <HeadContent />
      </head>
      <body>
        {/*
          The app container fills the entire viewport.
          This is important for mobile full-screen experience.
          Using dvh (dynamic viewport height) to account for mobile browser chrome.
        */}
        <div
          id="app"
          style={{
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Child routes render here (landing or chat) */}
          {children}
        </div>

        {/* TanStack Start scripts for client-side hydration */}
        <Scripts />
      </body>
    </html>
  );
}
