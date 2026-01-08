import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import { SignupPage } from '@/features/auth';

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
 * User signup/registration page.
 * Where new users create their accounts.
 */
const meta: Meta<typeof SignupPage> = {
  title: 'Pages/SignupPage',
  component: SignupPage,
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
        component: 'Signup page for creating new user accounts.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SignupPage>;

/**
 * Default signup page view.
 */
export const Default: Story = {};
