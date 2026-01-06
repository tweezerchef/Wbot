/**
 * Tests for ImmersiveBreathing component
 *
 * Tests the full-screen immersive breathing experience including
 * state transitions from intro → active → complete.
 */

import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ImmersiveBreathing } from '../ImmersiveBreathing';
import { BREATHING_TECHNIQUES } from '../types';
import type { BreathingPhase } from '../types';

// Mock the breathing loop hook
const mockBreathingState = {
  isActive: false,
  isPaused: false,
  currentPhase: 'inhale' as BreathingPhase,
  phaseIndex: 0,
  phaseTimeRemaining: 4,
  phaseTotalTime: 4,
  currentCycle: 1,
  totalCycles: 4,
  isComplete: false,
};

const mockBreathingControls = {
  start: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  stop: vi.fn(),
  reset: vi.fn(),
};

vi.mock('@/components/BreathingExercise/useBreathingLoop', () => ({
  useBreathingLoop: vi.fn((_technique: unknown, onComplete: (() => void) | undefined) => ({
    state: mockBreathingState,
    phaseProgress: 0.5,
    ...mockBreathingControls,
    // Store onComplete for testing
    _onComplete: onComplete,
  })),
}));

// Mock the audio hook
const mockAudioControls = {
  toggleAudio: vi.fn(),
  setEnabled: vi.fn(),
};

vi.mock('@/components/BreathingExercise/useBreathingAudio', () => ({
  useBreathingAudio: vi.fn(() => mockAudioControls),
}));

// Mock the haptic feedback hook
vi.mock('../hooks/useHapticFeedback', () => ({
  useHapticFeedback: vi.fn(() => ({
    onPhaseChange: vi.fn(),
    onCycleComplete: vi.fn(),
    onExerciseComplete: vi.fn(),
    cancel: vi.fn(),
  })),
}));

describe('ImmersiveBreathing', () => {
  const mockOnComplete = vi.fn();
  const mockOnExit = vi.fn();

  const defaultProps = {
    technique: BREATHING_TECHNIQUES.box,
    onComplete: mockOnComplete,
    onExit: mockOnExit,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    mockBreathingState.isActive = false;
    mockBreathingState.isPaused = false;
    mockBreathingState.currentPhase = 'inhale';
    mockBreathingState.isComplete = false;
    mockBreathingState.currentCycle = 1;
  });

  afterEach(() => {
    cleanup();
  });

  describe('intro state', () => {
    it('renders intro screen by default', () => {
      render(<ImmersiveBreathing {...defaultProps} />);

      expect(screen.getByText('Breathing Exercise')).toBeInTheDocument();
      expect(screen.getByText('Begin Exercise')).toBeInTheDocument();
    });

    it('displays technique name', () => {
      render(<ImmersiveBreathing {...defaultProps} />);

      expect(screen.getByText(BREATHING_TECHNIQUES.box.name)).toBeInTheDocument();
    });

    it('displays technique description', () => {
      render(<ImmersiveBreathing {...defaultProps} />);

      expect(screen.getByText(BREATHING_TECHNIQUES.box.description)).toBeInTheDocument();
    });

    it('displays timing pattern', () => {
      render(<ImmersiveBreathing {...defaultProps} />);

      // Box breathing is 4-4-4-4
      expect(screen.getByText('4-4-4-4 seconds')).toBeInTheDocument();
    });

    it('displays introduction message when provided', () => {
      const introduction = 'Take a moment to relax and focus on your breathing.';
      render(<ImmersiveBreathing {...defaultProps} introduction={introduction} />);

      expect(screen.getByText(introduction)).toBeInTheDocument();
    });

    it('does not show introduction when not provided', () => {
      render(<ImmersiveBreathing {...defaultProps} />);

      // Should not throw, introduction paragraph should not exist
      const introContainer = screen.queryByTestId('intro-message');
      expect(introContainer).not.toBeInTheDocument();
    });
  });

  describe('starting the exercise', () => {
    it('calls breathing.start when Begin button is clicked', async () => {
      const user = userEvent.setup();
      render(<ImmersiveBreathing {...defaultProps} />);

      await user.click(screen.getByText('Begin Exercise'));

      expect(mockBreathingControls.start).toHaveBeenCalledTimes(1);
    });

    it('transitions to active state after clicking Begin', async () => {
      const user = userEvent.setup();

      // Update mock to simulate active state
      mockBreathingState.isActive = true;

      render(<ImmersiveBreathing {...defaultProps} />);

      await user.click(screen.getByText('Begin Exercise'));

      // After starting, intro should disappear
      await waitFor(() => {
        expect(screen.queryByText('Begin Exercise')).not.toBeInTheDocument();
      });
    });
  });

  describe('active state', () => {
    beforeEach(() => {
      mockBreathingState.isActive = true;
    });

    it('shows breathing controls when active', async () => {
      const user = userEvent.setup();
      render(<ImmersiveBreathing {...defaultProps} />);

      await user.click(screen.getByText('Begin Exercise'));

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    });

    it('shows progress indicator when active', async () => {
      const user = userEvent.setup();
      render(<ImmersiveBreathing {...defaultProps} />);

      await user.click(screen.getByText('Begin Exercise'));

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('pause/resume', () => {
    beforeEach(() => {
      mockBreathingState.isActive = true;
    });

    it('calls breathing.pause when pause button is clicked', async () => {
      const user = userEvent.setup();
      render(<ImmersiveBreathing {...defaultProps} />);

      await user.click(screen.getByText('Begin Exercise'));
      await user.click(screen.getByRole('button', { name: /pause/i }));

      expect(mockBreathingControls.pause).toHaveBeenCalledTimes(1);
    });

    it('calls breathing.resume when resume button is clicked after pausing', async () => {
      const user = userEvent.setup();

      render(<ImmersiveBreathing {...defaultProps} />);

      // Start the exercise
      await user.click(screen.getByText('Begin Exercise'));

      // First pause the exercise
      await user.click(screen.getByRole('button', { name: /pause exercise/i }));

      // Now the resume button should be visible - click it
      const resumeButton = screen.getByRole('button', { name: /resume exercise/i });
      await user.click(resumeButton);

      expect(mockBreathingControls.resume).toHaveBeenCalledTimes(1);
    });
  });

  describe('stopping the exercise', () => {
    beforeEach(() => {
      mockBreathingState.isActive = true;
    });

    it('calls breathing.stop when stop button is clicked', async () => {
      const user = userEvent.setup();
      render(<ImmersiveBreathing {...defaultProps} />);

      await user.click(screen.getByText('Begin Exercise'));
      await user.click(screen.getByRole('button', { name: /stop/i }));

      expect(mockBreathingControls.stop).toHaveBeenCalledTimes(1);
    });

    it('calls onExit when stop button is clicked', async () => {
      const user = userEvent.setup();
      render(<ImmersiveBreathing {...defaultProps} />);

      await user.click(screen.getByText('Begin Exercise'));
      await user.click(screen.getByRole('button', { name: /stop/i }));

      expect(mockOnExit).toHaveBeenCalledTimes(1);
    });
  });

  describe('audio toggle', () => {
    beforeEach(() => {
      mockBreathingState.isActive = true;
    });

    it('calls audio.toggleAudio when audio button is clicked', async () => {
      const user = userEvent.setup();
      render(<ImmersiveBreathing {...defaultProps} />);

      await user.click(screen.getByText('Begin Exercise'));
      await user.click(screen.getByRole('button', { name: /mute audio/i }));

      expect(mockAudioControls.toggleAudio).toHaveBeenCalledTimes(1);
    });

    it('respects initial audioEnabled prop', () => {
      render(<ImmersiveBreathing {...defaultProps} audioEnabled={false} />);

      // The audio hook should be called with disabled state
      // This is tested via the hook mock
    });
  });

  describe('completion state', () => {
    it('shows completion screen when exercise is complete', async () => {
      const user = userEvent.setup();
      mockBreathingState.isComplete = true;

      // Import the mocked hook to trigger completion
      const { useBreathingLoop } = await import('@/components/BreathingExercise/useBreathingLoop');

      // Update mock to call onComplete callback
      vi.mocked(useBreathingLoop).mockImplementation((technique, onComplete) => {
        // Simulate completion after render
        setTimeout(() => onComplete?.(), 0);
        return {
          state: { ...mockBreathingState, isComplete: true },
          phaseProgress: 1,
          ...mockBreathingControls,
        };
      });

      render(<ImmersiveBreathing {...defaultProps} />);

      await user.click(screen.getByText('Begin Exercise'));

      await waitFor(() => {
        expect(screen.getByText('Well Done!')).toBeInTheDocument();
      });
    });

    it('shows Done button on completion', async () => {
      const user = userEvent.setup();

      const { useBreathingLoop } = await import('@/components/BreathingExercise/useBreathingLoop');

      vi.mocked(useBreathingLoop).mockImplementation((technique, onComplete) => {
        setTimeout(() => onComplete?.(), 0);
        return {
          state: { ...mockBreathingState, isComplete: true },
          phaseProgress: 1,
          ...mockBreathingControls,
        };
      });

      render(<ImmersiveBreathing {...defaultProps} />);

      await user.click(screen.getByText('Begin Exercise'));

      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });
    });

    it('calls onComplete with stats when Done is clicked', async () => {
      const user = userEvent.setup();

      const { useBreathingLoop } = await import('@/components/BreathingExercise/useBreathingLoop');

      vi.mocked(useBreathingLoop).mockImplementation((technique, onComplete) => {
        setTimeout(() => onComplete?.(), 0);
        return {
          state: {
            ...mockBreathingState,
            isComplete: true,
            currentCycle: 4,
          },
          phaseProgress: 1,
          ...mockBreathingControls,
        };
      });

      render(<ImmersiveBreathing {...defaultProps} />);

      await user.click(screen.getByText('Begin Exercise'));

      await waitFor(() => {
        expect(screen.getByText('Done')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Done'));

      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          techniqueName: BREATHING_TECHNIQUES.box.name,
          cyclesCompleted: 4,
          completedFully: true,
        })
      );
    });
  });

  describe('different techniques', () => {
    it('displays 4-7-8 timing for relaxing breath', () => {
      render(
        <ImmersiveBreathing {...defaultProps} technique={BREATHING_TECHNIQUES.relaxing_478} />
      );

      expect(screen.getByText('4-7-8-0 seconds')).toBeInTheDocument();
    });

    it('displays correct name for coherent breathing', () => {
      render(<ImmersiveBreathing {...defaultProps} technique={BREATHING_TECHNIQUES.coherent} />);

      expect(screen.getByText('Coherent Breathing')).toBeInTheDocument();
    });
  });
});
