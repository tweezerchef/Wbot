/**
 * Tests for BreathingControls component
 *
 * Tests the floating control bar with pause/resume, stop, and audio toggle buttons.
 */

import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';

import { BreathingControls } from '../BreathingControls';

describe('BreathingControls', () => {
  const mockOnPause = vi.fn();
  const mockOnResume = vi.fn();
  const mockOnStop = vi.fn();
  const mockOnToggleAudio = vi.fn();

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const defaultProps = {
    isPaused: false,
    onPause: mockOnPause,
    onResume: mockOnResume,
    onStop: mockOnStop,
    audioEnabled: true,
    onToggleAudio: mockOnToggleAudio,
  };

  describe('rendering', () => {
    it('renders all control buttons', () => {
      render(<BreathingControls {...defaultProps} />);

      expect(screen.getByRole('button', { name: /stop exercise/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pause exercise/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mute audio/i })).toBeInTheDocument();
    });

    it('renders as a toolbar with accessible name', () => {
      render(<BreathingControls {...defaultProps} />);

      const toolbar = screen.getByRole('toolbar');
      expect(toolbar).toHaveAttribute('aria-label', 'Exercise controls');
    });
  });

  describe('pause/resume button', () => {
    it('shows pause button when not paused', () => {
      render(<BreathingControls {...defaultProps} isPaused={false} />);

      expect(screen.getByRole('button', { name: /pause exercise/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /resume exercise/i })).not.toBeInTheDocument();
    });

    it('shows resume button when paused', () => {
      render(<BreathingControls {...defaultProps} isPaused={true} />);

      expect(screen.getByRole('button', { name: /resume exercise/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /pause exercise/i })).not.toBeInTheDocument();
    });

    it('calls onPause when pause button is clicked', async () => {
      const user = userEvent.setup();
      render(<BreathingControls {...defaultProps} isPaused={false} />);

      await user.click(screen.getByRole('button', { name: /pause exercise/i }));

      expect(mockOnPause).toHaveBeenCalledTimes(1);
    });

    it('calls onResume when resume button is clicked', async () => {
      const user = userEvent.setup();
      render(<BreathingControls {...defaultProps} isPaused={true} />);

      await user.click(screen.getByRole('button', { name: /resume exercise/i }));

      expect(mockOnResume).toHaveBeenCalledTimes(1);
    });
  });

  describe('stop button', () => {
    it('calls onStop when stop button is clicked', async () => {
      const user = userEvent.setup();
      render(<BreathingControls {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /stop exercise/i }));

      expect(mockOnStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('audio toggle button', () => {
    it('shows mute audio label when audio is enabled', () => {
      render(<BreathingControls {...defaultProps} audioEnabled={true} />);

      const audioButton = screen.getByRole('button', { name: /mute audio/i });
      expect(audioButton).toBeInTheDocument();
    });

    it('shows enable audio label when audio is disabled', () => {
      render(<BreathingControls {...defaultProps} audioEnabled={false} />);

      const audioButton = screen.getByRole('button', { name: /enable audio/i });
      expect(audioButton).toBeInTheDocument();
    });

    it('calls onToggleAudio when audio button is clicked', async () => {
      const user = userEvent.setup();
      render(<BreathingControls {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /mute audio/i }));

      expect(mockOnToggleAudio).toHaveBeenCalledTimes(1);
    });

    it('has aria-pressed attribute reflecting audio state', () => {
      const { rerender } = render(<BreathingControls {...defaultProps} audioEnabled={true} />);

      const audioButton = screen.getByRole('button', { name: /mute audio/i });
      expect(audioButton).toHaveAttribute('aria-pressed', 'true');

      rerender(<BreathingControls {...defaultProps} audioEnabled={false} />);

      const mutedButton = screen.getByRole('button', { name: /enable audio/i });
      expect(mutedButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('keyboard accessibility', () => {
    it('buttons are focusable via tab', async () => {
      const user = userEvent.setup();
      render(<BreathingControls {...defaultProps} />);

      const stopButton = screen.getByRole('button', { name: /stop exercise/i });
      const pauseButton = screen.getByRole('button', { name: /pause exercise/i });
      const audioButton = screen.getByRole('button', { name: /mute audio/i });

      // Start with no focus
      expect(document.activeElement).toBe(document.body);

      // Tab to first button
      await user.tab();
      expect(document.activeElement).toBe(stopButton);

      // Tab to second button
      await user.tab();
      expect(document.activeElement).toBe(pauseButton);

      // Tab to third button
      await user.tab();
      expect(document.activeElement).toBe(audioButton);
    });

    it('pause button can be activated with Enter key', async () => {
      const user = userEvent.setup();
      render(<BreathingControls {...defaultProps} isPaused={false} />);

      const pauseButton = screen.getByRole('button', { name: /pause exercise/i });
      pauseButton.focus();

      await user.keyboard('{Enter}');

      expect(mockOnPause).toHaveBeenCalledTimes(1);
    });

    it('pause button can be activated with Space key', async () => {
      const user = userEvent.setup();
      render(<BreathingControls {...defaultProps} isPaused={false} />);

      const pauseButton = screen.getByRole('button', { name: /pause exercise/i });
      pauseButton.focus();

      await user.keyboard(' ');

      expect(mockOnPause).toHaveBeenCalledTimes(1);
    });
  });
});
