import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import { LandingPage } from '@/components/pages/LandingPage/LandingPage';

// Create a client for Storybook stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

/**
 * Landing page for the Wbot application.
 * First page users see when they visit the site.
 */
const meta: Meta<typeof LandingPage> = {
  title: 'Pages/LandingPage',
  component: LandingPage,
  decorators: [
    (Story): ReactElement => (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Main landing page for Wbot - the wellness chatbot.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LandingPage>;

/**
 * Default landing page view.
 */
export const Default: Story = {};
