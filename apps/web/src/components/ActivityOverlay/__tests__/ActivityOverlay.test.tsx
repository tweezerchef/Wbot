import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ActivityOverlay } from '../ActivityOverlay';

// Mock framer-motion to avoid animation timing issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      onClick,
      onKeyDown,
      role,
      tabIndex,
      ...props
    }: React.HTMLProps<HTMLDivElement> & { 'data-activity-type'?: string }) => (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- Test mock, actual component has proper a11y
      <div
        className={className}
        onClick={onClick}
        onKeyDown={onKeyDown}
        role={role}
        tabIndex={tabIndex}
        data-testid={props['data-activity-type'] ? 'overlay' : undefined}
        {...props}
      >
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('ActivityOverlay', () => {
  const mockOnClose = vi.fn();
  const mockOnExitComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset body overflow after each test
    document.body.style.overflow = '';
  });

  describe('rendering', () => {
    it('renders when isOpen is true', () => {
      render(
        <ActivityOverlay isOpen={true} onClose={mockOnClose} activityType="breathing">
          <div>Activity Content</div>
        </ActivityOverlay>
      );

      expect(screen.getByText('Activity Content')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <ActivityOverlay isOpen={false} onClose={mockOnClose} activityType="breathing">
          <div>Activity Content</div>
        </ActivityOverlay>
      );

      expect(screen.queryByText('Activity Content')).not.toBeInTheDocument();
    });

    it('renders children content', () => {
      render(
        <ActivityOverlay isOpen={true} onClose={mockOnClose} activityType="meditation">
          <div data-testid="child-content">Meditation Session</div>
        </ActivityOverlay>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Meditation Session')).toBeInTheDocument();
    });

    it('renders close button', () => {
      render(
        <ActivityOverlay isOpen={true} onClose={mockOnClose} activityType="breathing">
          <div>Content</div>
        </ActivityOverlay>
      );

      expect(screen.getByRole('button', { name: /close activity/i })).toBeInTheDocument();
    });

    it('sets correct activity type data attribute', () => {
      render(
        <ActivityOverlay isOpen={true} onClose={mockOnClose} activityType="library">
          <div>Content</div>
        </ActivityOverlay>
      );

      const overlay = screen.getByTestId('overlay');
      expect(overlay).toHaveAttribute('data-activity-type', 'library');
    });
  });

  describe('accessibility', () => {
    it('has dialog role and aria-modal', () => {
      render(
        <ActivityOverlay isOpen={true} onClose={mockOnClose} activityType="breathing">
          <div>Content</div>
        </ActivityOverlay>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('has appropriate aria-label for activity type', () => {
      render(
        <ActivityOverlay isOpen={true} onClose={mockOnClose} activityType="meditation">
          <div>Content</div>
        </ActivityOverlay>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'meditation activity');
    });

    it('close button has accessible name', () => {
      render(
        <ActivityOverlay isOpen={true} onClose={mockOnClose} activityType="breathing">
          <div>Content</div>
        </ActivityOverlay>
      );

      const closeButton = screen.getByRole('button', {
        name: /close activity/i,
      });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('close interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ActivityOverlay isOpen={true} onClose={mockOnClose} activityType="breathing">
          <div>Content</div>
        </ActivityOverlay>
      );

      const closeButton = screen.getByRole('button', {
        name: /close activity/i,
      });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ActivityOverlay isOpen={true} onClose={mockOnClose} activityType="breathing">
          <div>Content</div>
        </ActivityOverlay>
      );

      // The backdrop is the element with aria-hidden="true"
      const backdrop = document.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();

      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('calls onClose when Escape key is pressed', () => {
      render(
        <ActivityOverlay isOpen={true} onClose={mockOnClose} activityType="breathing">
          <div>Content</div>
        </ActivityOverlay>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when Escape is pressed and overlay is closed', () => {
      render(
        <ActivityOverlay isOpen={false} onClose={mockOnClose} activityType="breathing">
          <div>Content</div>
        </ActivityOverlay>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('does not close when clicking inside content area', async () => {
      const user = userEvent.setup();

      render(
        <ActivityOverlay isOpen={true} onClose={mockOnClose} activityType="breathing">
          <div data-testid="inner-content">Content</div>
        </ActivityOverlay>
      );

      await user.click(screen.getByTestId('inner-content'));

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('handles Enter key on close button', () => {
      render(
        <ActivityOverlay isOpen={true} onClose={mockOnClose} activityType="breathing">
          <div>Content</div>
        </ActivityOverlay>
      );

      const closeButton = screen.getByRole('button', {
        name: /close activity/i,
      });
      fireEvent.keyDown(closeButton, { key: 'Enter' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('handles Space key on close button', () => {
      render(
        <ActivityOverlay isOpen={true} onClose={mockOnClose} activityType="breathing">
          <div>Content</div>
        </ActivityOverlay>
      );

      const closeButton = screen.getByRole('button', {
        name: /close activity/i,
      });
      fireEvent.keyDown(closeButton, { key: ' ' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('body scroll lock', () => {
    it('prevents body scroll when open', () => {
      render(
        <ActivityOverlay isOpen={true} onClose={mockOnClose} activityType="breathing">
          <div>Content</div>
        </ActivityOverlay>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
      const { rerender } = render(
        <ActivityOverlay isOpen={true} onClose={mockOnClose} activityType="breathing">
          <div>Content</div>
        </ActivityOverlay>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <ActivityOverlay isOpen={false} onClose={mockOnClose} activityType="breathing">
          <div>Content</div>
        </ActivityOverlay>
      );

      expect(document.body.style.overflow).toBe('');
    });

    it('restores body scroll on unmount', () => {
      const { unmount } = render(
        <ActivityOverlay isOpen={true} onClose={mockOnClose} activityType="breathing">
          <div>Content</div>
        </ActivityOverlay>
      );

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('onExitComplete callback', () => {
    it('accepts onExitComplete callback prop', () => {
      // Just testing that it doesn't error when provided
      expect(() => {
        render(
          <ActivityOverlay
            isOpen={true}
            onClose={mockOnClose}
            activityType="breathing"
            onExitComplete={mockOnExitComplete}
          >
            <div>Content</div>
          </ActivityOverlay>
        );
      }).not.toThrow();
    });
  });

  describe('activity types', () => {
    it.each(['breathing', 'meditation', 'library', 'series'] as const)(
      'renders correctly for %s activity type',
      (activityType) => {
        render(
          <ActivityOverlay isOpen={true} onClose={mockOnClose} activityType={activityType}>
            <div>{activityType} content</div>
          </ActivityOverlay>
        );

        expect(screen.getByText(`${activityType} content`)).toBeInTheDocument();
        expect(screen.getByTestId('overlay')).toHaveAttribute('data-activity-type', activityType);
      }
    );
  });
});
