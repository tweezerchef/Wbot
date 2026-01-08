import type { Meta, StoryObj } from '@storybook/react-vite';

// Create a mock component that doesn't depend on router hooks
// The actual DefaultCatchBoundary uses TanStack Router hooks which aren't available in Storybook

/**
 * MockDefaultCatchBoundary - A visual representation for Storybook
 * The actual component uses TanStack Router hooks that require router context.
 * This mock shows the UI without the router dependencies.
 */
function MockDefaultCatchBoundary({
  errorMessage = 'An unexpected error occurred',
  isRoot = false,
  onTryAgain,
  onGoBack,
}: {
  errorMessage?: string;
  isRoot?: boolean;
  onTryAgain?: () => void;
  onGoBack?: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 'var(--spacing-lg)',
        backgroundColor: 'var(--color-background)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--spacing-lg)',
          maxWidth: '500px',
          textAlign: 'center',
        }}
      >
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)',
            margin: 0,
          }}
        >
          Something went wrong
        </h1>

        <div
          style={{
            width: '100%',
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--color-error-light)',
            borderRadius: 'var(--radius-md)',
            overflow: 'auto',
            maxHeight: '200px',
          }}
        >
          <pre
            style={{
              margin: 0,
              fontFamily: 'var(--font-family-mono)',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-error)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            Error: {errorMessage}
          </pre>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-md)',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={onTryAgain}
            style={{
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-medium)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>

          {isRoot ? (
            <a
              href="/"
              style={{
                padding: 'var(--spacing-sm) var(--spacing-lg)',
                backgroundColor: 'var(--color-neutral-200)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-medium)',
                borderRadius: 'var(--radius-md)',
                textDecoration: 'none',
              }}
            >
              Go Home
            </a>
          ) : (
            <button
              type="button"
              onClick={onGoBack}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-lg)',
                backgroundColor: 'var(--color-neutral-200)',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-medium)',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * DefaultCatchBoundary - Global error boundary component.
 *
 * Displays a user-friendly error message with recovery options when an
 * unhandled error occurs in the application.
 *
 * Features:
 * - Shows the error message in a styled container
 * - "Try Again" button to invalidate the router and retry
 * - Context-aware navigation: "Go Home" at root, "Go Back" elsewhere
 *
 * Note: This Storybook story uses a mock component because the actual
 * DefaultCatchBoundary requires TanStack Router context.
 */
const meta: Meta<typeof MockDefaultCatchBoundary> = {
  title: 'Components/DefaultCatchBoundary',
  component: MockDefaultCatchBoundary,
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
        component: 'Global error boundary component shown when an unhandled error occurs.',
      },
    },
  },
  argTypes: {
    errorMessage: {
      control: 'text',
      description: 'The error message to display',
    },
    isRoot: {
      control: 'boolean',
      description: 'Whether the error occurred at the root route',
    },
    onTryAgain: {
      action: 'tryAgain',
      description: 'Called when the "Try Again" button is clicked',
    },
    onGoBack: {
      action: 'goBack',
      description: 'Called when the "Go Back" button is clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof MockDefaultCatchBoundary>;

/**
 * Default error state with a generic error message.
 */
export const Default: Story = {
  args: {
    errorMessage: 'An unexpected error occurred',
    isRoot: false,
  },
};

/**
 * Error at root route - shows "Go Home" link instead of "Go Back" button.
 */
export const AtRootRoute: Story = {
  args: {
    errorMessage: 'Failed to load the application',
    isRoot: true,
  },
};

/**
 * Network error - common error type.
 */
export const NetworkError: Story = {
  args: {
    errorMessage: 'Failed to fetch: NetworkError when attempting to fetch resource.',
    isRoot: false,
  },
};

/**
 * Long error message - tests text wrapping and container scrolling.
 */
export const LongErrorMessage: Story = {
  args: {
    errorMessage:
      'TypeError: Cannot read properties of undefined (reading "data"). This error occurred in the component stack: at ChatPage (http://localhost:3000/assets/index-abc123.js:1234:56) at Route (http://localhost:3000/assets/vendor-def456.js:7890:12) at RouterProvider (http://localhost:3000/assets/vendor-def456.js:9999:99)',
    isRoot: false,
  },
};

/**
 * 404 style error - resource not found.
 */
export const NotFoundError: Story = {
  args: {
    errorMessage: 'The requested resource was not found. Please check the URL and try again.',
    isRoot: false,
  },
};
