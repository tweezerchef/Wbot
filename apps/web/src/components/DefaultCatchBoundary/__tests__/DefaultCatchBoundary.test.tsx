/**
 * DefaultCatchBoundary Component Tests
 *
 * Tests the error boundary component's rendering and interactions.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock TanStack Router hooks
const mockInvalidate = vi.fn();
const mockUseRouter = vi.fn(() => ({ invalidate: mockInvalidate }));
const mockUseRouterState = vi.fn(() => '/chat');

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    useRouter: () => mockUseRouter(),
    useRouterState: (opts: { select: (s: { location: { pathname: string } }) => string }) =>
      opts.select({ location: { pathname: mockUseRouterState() } }),
    Link: ({
      to,
      children,
      className,
    }: {
      to: string;
      children: React.ReactNode;
      className?: string;
    }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
    ErrorComponent: ({ error }: { error: Error }) => (
      <div data-testid="error-component">Error: {error.message}</div>
    ),
  };
});

import { DefaultCatchBoundary } from '../DefaultCatchBoundary';

describe('DefaultCatchBoundary', () => {
  // Create a noop reset function for tests that don't need it
  const noopReset = vi.fn();
  // Mock error info object with required componentStack property
  const mockErrorInfo = { componentStack: 'Test component stack' };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to non-root path
    mockUseRouterState.mockReturnValue('/chat');
  });

  describe('rendering', () => {
    it('renders the error message', () => {
      const testError = new Error('Test error message');

      render(<DefaultCatchBoundary error={testError} reset={noopReset} info={mockErrorInfo} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('displays the ErrorComponent with the error', () => {
      const testError = new Error('Test error message');

      render(<DefaultCatchBoundary error={testError} reset={noopReset} info={mockErrorInfo} />);

      expect(screen.getByTestId('error-component')).toBeInTheDocument();
      expect(screen.getByText(/Test error message/)).toBeInTheDocument();
    });

    it('renders Try Again button', () => {
      const testError = new Error('Test error');

      render(<DefaultCatchBoundary error={testError} reset={noopReset} info={mockErrorInfo} />);

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  describe('navigation options', () => {
    it('shows Go Back button when not at root route', () => {
      mockUseRouterState.mockReturnValue('/chat');
      const testError = new Error('Test error');

      render(<DefaultCatchBoundary error={testError} reset={noopReset} info={mockErrorInfo} />);

      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /go home/i })).not.toBeInTheDocument();
    });

    it('shows Go Home link when at root route', () => {
      mockUseRouterState.mockReturnValue('/');
      const testError = new Error('Test error');

      render(<DefaultCatchBoundary error={testError} reset={noopReset} info={mockErrorInfo} />);

      expect(screen.getByRole('link', { name: /go home/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /go back/i })).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls router.invalidate when Try Again is clicked', async () => {
      const user = userEvent.setup();
      const testError = new Error('Test error');

      render(<DefaultCatchBoundary error={testError} reset={noopReset} info={mockErrorInfo} />);

      await user.click(screen.getByRole('button', { name: /try again/i }));

      expect(mockInvalidate).toHaveBeenCalledTimes(1);
    });

    it('calls window.history.back when Go Back is clicked', async () => {
      const user = userEvent.setup();
      const mockHistoryBack = vi.spyOn(window.history, 'back').mockImplementation(vi.fn());
      mockUseRouterState.mockReturnValue('/chat');
      const testError = new Error('Test error');

      render(<DefaultCatchBoundary error={testError} reset={noopReset} info={mockErrorInfo} />);

      await user.click(screen.getByRole('button', { name: /go back/i }));

      expect(mockHistoryBack).toHaveBeenCalledTimes(1);

      mockHistoryBack.mockRestore();
    });

    it('Go Home link points to root path', () => {
      mockUseRouterState.mockReturnValue('/');
      const testError = new Error('Test error');

      render(<DefaultCatchBoundary error={testError} reset={noopReset} info={mockErrorInfo} />);

      const homeLink = screen.getByRole('link', { name: /go home/i });
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });
});
