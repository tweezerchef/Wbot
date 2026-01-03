import type { Meta, StoryObj } from '@storybook/react-vite';

import { NotFound } from '@/components/NotFound/NotFound';

/**
 * 404 Not Found error page.
 * Displayed when a user navigates to a route that doesn't exist.
 */
const meta: Meta<typeof NotFound> = {
  title: 'Components/NotFound',
  component: NotFound,
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '404 error page shown when a route is not found.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof NotFound>;

/**
 * Default 404 Not Found page.
 */
export const Default: Story = {};
