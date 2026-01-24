/**
 * ErrorFallback Stories
 *
 * Simple error fallback for lazy-loaded components wrapped in ErrorBoundary.
 * Displays a user-friendly error message with a retry option.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';

import { ErrorFallback } from '@/components/feedback/ErrorFallback/ErrorFallback';

/**
 * ErrorFallback displays when a lazy-loaded component fails to load.
 * Shows a warning icon, error message, optional details (in dev), and retry button.
 */
const meta: Meta<typeof ErrorFallback> = {
  title: 'Components/Feedback/ErrorFallback',
  component: ErrorFallback,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `Error fallback component for use with react-error-boundary.

Features:
- Warning icon with accessible hiding
- User-friendly error message
- Error details shown in development mode only
- Retry button to reset the error boundary`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    resetErrorBoundary: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ErrorFallback>;

// =============================================================================
// Basic Variants
// =============================================================================

/**
 * Default error state with generic error message.
 */
export const Default: Story = {
  args: {
    error: new Error('Failed to load component'),
  },
};

/**
 * Network error - common case for lazy-loaded chunks.
 */
export const NetworkError: Story = {
  args: {
    error: new Error('Network request failed: Unable to fetch module'),
  },
};

/**
 * Module not found error.
 */
export const ModuleError: Story = {
  args: {
    error: new Error("Cannot find module '@/features/missing/Component'"),
  },
};

/**
 * Timeout error.
 */
export const TimeoutError: Story = {
  args: {
    error: new Error('Request timeout: The server took too long to respond'),
  },
};

/**
 * Permission error.
 */
export const PermissionError: Story = {
  args: {
    error: new Error('Access denied: You do not have permission to view this content'),
  },
};

// =============================================================================
// Container Context
// =============================================================================

/**
 * Error in a card-like container context.
 */
export const InCardContainer: Story = {
  args: {
    error: new Error('Failed to load content'),
  },
  decorators: [
    (Story) => (
      <div
        style={{
          maxWidth: '400px',
          padding: '24px',
          background: 'var(--color-surface, #fff)',
          borderRadius: '12px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

/**
 * Error in sidebar context.
 */
export const InSidebarContext: Story = {
  args: {
    error: new Error('Failed to load sidebar content'),
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '280px',
          padding: '16px',
          background: 'var(--color-surface, #fff)',
          borderRight: '1px solid var(--color-border, #e5e5e5)',
          minHeight: '200px',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

/**
 * Error in message bubble context (inline in chat).
 */
export const InMessageBubble: Story = {
  args: {
    error: new Error('Failed to load activity component'),
  },
  decorators: [
    (Story) => (
      <div
        style={{
          maxWidth: '420px',
          padding: '16px',
          background: 'var(--color-background-alt, #f5f5f5)',
          borderRadius: '16px',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

// =============================================================================
// Mobile Views
// =============================================================================

/**
 * Mobile viewport.
 */
export const Mobile: Story = {
  args: {
    error: new Error('Failed to load content'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '16px' }}>
        <Story />
      </div>
    ),
  ],
};

// =============================================================================
// Interactive Test Stories
// =============================================================================

/**
 * Test: Retry button calls resetErrorBoundary.
 */
export const TestRetryButton: Story = {
  args: {
    error: new Error('Test error'),
    resetErrorBoundary: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find and click retry button
    const retryButton = canvas.getByRole('button', { name: /try again/i });
    await expect(retryButton).toBeInTheDocument();
    await userEvent.click(retryButton);

    // Verify callback was called
    await expect(args.resetErrorBoundary).toHaveBeenCalledTimes(1);
  },
};

/**
 * Test: Alert role for accessibility.
 */
export const TestAccessibility: Story = {
  args: {
    error: new Error('Accessibility test error'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Container should have alert role
    const alert = canvas.getByRole('alert');
    await expect(alert).toBeInTheDocument();

    // Error message should be present
    const message = canvas.getByText(/something went wrong/i);
    await expect(message).toBeInTheDocument();

    // Retry button should be accessible
    const retryButton = canvas.getByRole('button', { name: /try again/i });
    await expect(retryButton).toBeInTheDocument();
  },
};

// =============================================================================
// Documentation
// =============================================================================

/**
 * Usage documentation.
 */
export const Documentation: StoryObj = {
  render: () => (
    <div style={{ padding: '24px', maxWidth: '600px' }}>
      <h2 style={{ marginBottom: '16px' }}>ErrorFallback Usage</h2>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Basic Usage</h3>
        <pre
          style={{
            padding: '16px',
            background: '#1e293b',
            color: '#e2e8f0',
            borderRadius: '8px',
            fontSize: '13px',
            overflow: 'auto',
          }}
        >
          {`import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '@/components/feedback';

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <LazyLoadedComponent />
</ErrorBoundary>`}
        </pre>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Props (from FallbackProps)</h3>
        <ul style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
          <li>
            <code>error</code>: The error that was thrown
          </li>
          <li>
            <code>resetErrorBoundary</code>: Function to reset the error boundary and retry
          </li>
        </ul>
      </div>

      <div>
        <h3 style={{ marginBottom: '8px', fontSize: '16px' }}>Behavior</h3>
        <ul style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
          <li>Shows user-friendly error message</li>
          <li>In development, shows error.message for debugging</li>
          <li>In production, hides technical details</li>
          <li>"Try Again" button calls resetErrorBoundary to retry loading</li>
        </ul>
      </div>
    </div>
  ),
};
