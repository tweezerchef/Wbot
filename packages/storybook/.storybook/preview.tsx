import type { Preview } from '@storybook/react';
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router';
import type { ReactElement } from 'react';

// Import global CSS variables from web app
import '../../../apps/web/src/styles/variables.css';

// Import Storybook decorators
import { AuthDecorator } from './decorators/AuthDecorator';
import { QueryDecorator } from './decorators/QueryDecorator';

// Store the current Story component in a module-level ref
// This allows the router's route component to always render the current Story
let currentStoryRef: React.ComponentType | null = null;

/**
 * Route component that renders the current Story.
 * Uses the module-level ref to always get the latest Story.
 */
function StoryRoute(): ReactElement {
  const Story = currentStoryRef;
  if (!Story) {
    return <div>No story loaded</div>;
  }
  return (
    <>
      <Story />
      <Outlet />
    </>
  );
}

// Create a single router instance for all stories
const rootRoute = createRootRoute({
  component: StoryRoute,
});

const storyRouter = createRouter({
  routeTree: rootRoute,
  history: createMemoryHistory({ initialEntries: ['/'] }),
});

/**
 * Creates a Storybook decorator that provides TanStack Router context.
 * This allows components using Link, useNavigate, etc. to work in Storybook.
 *
 * Note: This creates a minimal router for basic navigation context.
 * Components requiring loader data (like ChatPage) need their own decorator.
 */
function RouterDecorator(Story: React.ComponentType): ReactElement {
  // Update the current story ref so StoryRoute can render it
  currentStoryRef = Story;

  return <RouterProvider router={storyRouter} />;
}

const preview: Preview = {
  decorators: [
    // Authentication - auto-login test user and provide session context
    AuthDecorator,
    // TanStack Query - provides QueryClient for real data fetching
    QueryDecorator,
    // TanStack Router - provides router context for Link, useNavigate, etc.
    RouterDecorator,
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    backgrounds: {
      options: {
        light: { name: 'light', value: '#ffffff' },
        dark: { name: 'dark', value: '#1a1a1a' },
        wellness: { name: 'wellness', value: '#f5f7fa' },
      },
    },

    layout: 'centered',

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },

  initialGlobals: {
    backgrounds: {
      value: 'wellness',
    },
  },

  tags: ['autodocs'],
};

export default preview;
