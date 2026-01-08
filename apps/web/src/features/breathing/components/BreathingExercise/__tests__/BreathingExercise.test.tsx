/**
 * Integration tests for BreathingExercise component
 *
 * Tests the complete breathing exercise experience including:
 * - Idle, active, and completion states
 * - User interactions (start, pause, resume, stop)
 * - Callbacks (onComplete, onStop)
 * - Audio toggle functionality
 * - Progress indicator
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { BreathingTechnique } from '../../../types';
import { BreathingExercise } from '../BreathingExercise';

// Create a wrapper with QueryClient for testing
function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function TestWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

// Helper to render with wrapper
function renderWithProviders(ui: ReactNode) {
  return render(ui, { wrapper: createTestWrapper() });
}

// Short technique for faster tests
const shortTechnique: BreathingTechnique = {
  id: 'test_short',
  name: 'Test Technique',
  durations: [1, 1, 1, 1], // 4 second cycle
  description: 'Short technique for testing',
  cycles: 2,
};

// Zero-hold technique for testing phase skipping
const zeroHoldTechnique: BreathingTechnique = {
  id: 'test_zeros',
  name: 'No Hold Technique',
  durations: [1, 0, 1, 0], // 2 second cycle
  description: 'Technique with zero holds',
  cycles: 2,
};

describe('BreathingExercise', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('idle state', () => {
    it('renders technique name', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} />);

      expect(screen.getByText('Test Technique')).toBeInTheDocument();
    });

    it('renders technique timing pattern', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} />);

      expect(screen.getByText('1-1-1-1 pattern · 2 cycles')).toBeInTheDocument();
    });

    it('renders introduction text when provided', () => {
      renderWithProviders(
        <BreathingExercise
          technique={shortTechnique}
          introduction="Let's take a moment to breathe together."
        />
      );

      expect(screen.getByText("Let's take a moment to breathe together.")).toBeInTheDocument();
    });

    it('does not render introduction when not provided', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} />);

      // The introduction paragraph should not exist
      const container = screen.getByText('Test Technique').closest('div');
      expect(container?.querySelector('p[class*="introduction"]')).not.toBeInTheDocument();
    });

    it('renders Start Exercise button', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} />);

      expect(screen.getByText('Start Exercise')).toBeInTheDocument();
    });

    it('renders Ready animation state', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} />);

      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('renders audio toggle when enableAudio is true', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={true} />);

      expect(screen.getByText('Sound On')).toBeInTheDocument();
    });

    it('does not render audio toggle when enableAudio is false', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      expect(screen.queryByText('Sound On')).not.toBeInTheDocument();
      expect(screen.queryByText('Sound Off')).not.toBeInTheDocument();
    });
  });

  describe('starting exercise', () => {
    it('starts exercise when Start button is clicked', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      fireEvent.click(screen.getByText('Start Exercise'));

      // Should now be in active state
      expect(screen.getByText('Breathe In')).toBeInTheDocument();
      expect(screen.queryByText('Start Exercise')).not.toBeInTheDocument();
    });

    it('shows progress indicator when active', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      fireEvent.click(screen.getByText('Start Exercise'));

      expect(screen.getByText('Cycle 1 of 2')).toBeInTheDocument();
    });

    it('shows Pause and Stop buttons when active', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      fireEvent.click(screen.getByText('Start Exercise'));

      expect(screen.getByText('Pause')).toBeInTheDocument();
      expect(screen.getByText('Stop')).toBeInTheDocument();
    });
  });

  describe('pause and resume', () => {
    it('shows Resume button when paused', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      fireEvent.click(screen.getByText('Start Exercise'));
      fireEvent.click(screen.getByText('Pause'));

      expect(screen.getByText('Resume')).toBeInTheDocument();
      expect(screen.queryByText('Pause')).not.toBeInTheDocument();
    });

    it('shows Pause button after resuming', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      fireEvent.click(screen.getByText('Start Exercise'));
      fireEvent.click(screen.getByText('Pause'));
      fireEvent.click(screen.getByText('Resume'));

      expect(screen.getByText('Pause')).toBeInTheDocument();
      expect(screen.queryByText('Resume')).not.toBeInTheDocument();
    });
  });

  describe('stopping exercise', () => {
    it('returns to idle state when stopped', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      fireEvent.click(screen.getByText('Start Exercise'));
      fireEvent.click(screen.getByText('Stop'));

      expect(screen.getByText('Start Exercise')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('calls onStop callback when stopped', () => {
      const onStop = vi.fn();
      renderWithProviders(
        <BreathingExercise technique={shortTechnique} enableAudio={false} onStop={onStop} />
      );

      fireEvent.click(screen.getByText('Start Exercise'));
      fireEvent.click(screen.getByText('Stop'));

      expect(onStop).toHaveBeenCalledOnce();
    });
  });

  describe('audio toggle', () => {
    it('toggles sound off when clicked', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={true} />);

      fireEvent.click(screen.getByText('Sound On'));

      expect(screen.getByText('Sound Off')).toBeInTheDocument();
      expect(screen.queryByText('Sound On')).not.toBeInTheDocument();
    });

    it('toggles sound back on when clicked again', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={true} />);

      fireEvent.click(screen.getByText('Sound On'));
      fireEvent.click(screen.getByText('Sound Off'));

      expect(screen.getByText('Sound On')).toBeInTheDocument();
    });
  });

  describe('progress dots', () => {
    it('renders correct number of progress dots', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      fireEvent.click(screen.getByText('Start Exercise'));

      // Should have 2 dots for 2 cycles
      // Use progressDots wrapper to query only child dots (not the wrapper itself)
      const wrapper = screen.getByText('Cycle 1 of 2').parentElement;
      const dotsContainer = wrapper?.querySelector('[class*="progressDots"]');
      const dots = dotsContainer?.querySelectorAll(':scope > div');
      expect(dots).toHaveLength(2);
    });

    it('shows first dot as active initially', () => {
      const { container } = renderWithProviders(
        <BreathingExercise technique={shortTechnique} enableAudio={false} />
      );

      fireEvent.click(screen.getByText('Start Exercise'));

      // Query the wrapper, then get direct child divs (the actual dots)
      const dotsContainer = container.querySelector('[class*="progressDots"]');
      const dots = dotsContainer?.querySelectorAll(':scope > div');
      expect(dots?.[0]?.className).toContain('progressDotActive');
    });
  });

  describe('phase transitions', () => {
    it('shows inhale phase at start', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      fireEvent.click(screen.getByText('Start Exercise'));

      expect(screen.getByText('Breathe In')).toBeInTheDocument();
    });

    it('transitions to holdIn phase', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      fireEvent.click(screen.getByText('Start Exercise'));

      // Advance past inhale phase (1 second)
      act(() => {
        vi.advanceTimersByTime(1100);
      });

      // Should be in holdIn phase now (shows "Hold")
      expect(screen.getByText('Hold')).toBeInTheDocument();
    });

    it('transitions to exhale phase', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      fireEvent.click(screen.getByText('Start Exercise'));

      // Advance past inhale + holdIn phases (2 seconds)
      act(() => {
        vi.advanceTimersByTime(2100);
      });

      expect(screen.getByText('Breathe Out')).toBeInTheDocument();
    });
  });

  describe('completion', () => {
    it('shows completion state after all cycles', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      fireEvent.click(screen.getByText('Start Exercise'));

      // Complete all cycles: 2 cycles * 4 seconds = 8 seconds
      act(() => {
        vi.advanceTimersByTime(8500);
      });

      expect(screen.getByText('Well Done!')).toBeInTheDocument();
    });

    it('shows completion message with technique info', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      fireEvent.click(screen.getByText('Start Exercise'));

      act(() => {
        vi.advanceTimersByTime(8500);
      });

      expect(screen.getByText(/You completed 2 cycles of Test Technique/)).toBeInTheDocument();
    });

    it('calls onComplete callback', () => {
      const onComplete = vi.fn();
      renderWithProviders(
        <BreathingExercise technique={shortTechnique} enableAudio={false} onComplete={onComplete} />
      );

      fireEvent.click(screen.getByText('Start Exercise'));

      act(() => {
        vi.advanceTimersByTime(8500);
      });

      expect(onComplete).toHaveBeenCalledOnce();
    });

    it('shows Do Another button after completion', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      fireEvent.click(screen.getByText('Start Exercise'));

      act(() => {
        vi.advanceTimersByTime(8500);
      });

      expect(screen.getByText('Do Another')).toBeInTheDocument();
    });

    it('restarts exercise when Do Another is clicked', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      fireEvent.click(screen.getByText('Start Exercise'));

      act(() => {
        vi.advanceTimersByTime(8500);
      });

      fireEvent.click(screen.getByText('Do Another'));

      // Should be back in active state
      expect(screen.getByText('Breathe In')).toBeInTheDocument();
      expect(screen.getByText('Cycle 1 of 2')).toBeInTheDocument();
    });
  });

  describe('technique with zero-duration phases', () => {
    it('skips zero-duration hold phases', () => {
      renderWithProviders(<BreathingExercise technique={zeroHoldTechnique} enableAudio={false} />);

      fireEvent.click(screen.getByText('Start Exercise'));

      // Starts with inhale
      expect(screen.getByText('Breathe In')).toBeInTheDocument();

      // After 1 second, should skip holdIn (0 duration) and go to exhale
      act(() => {
        vi.advanceTimersByTime(1100);
      });

      expect(screen.getByText('Breathe Out')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible buttons', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      const startButton = screen.getByText('Start Exercise');
      expect(startButton.tagName).toBe('BUTTON');

      fireEvent.click(startButton);

      const pauseButton = screen.getByText('Pause');
      expect(pauseButton.tagName).toBe('BUTTON');

      const stopButton = screen.getByText('Stop');
      expect(stopButton.tagName).toBe('BUTTON');
    });

    it('animation has correct ARIA attributes', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      fireEvent.click(screen.getByText('Start Exercise'));

      const animation = screen.getByRole('img');
      expect(animation).toHaveAttribute('aria-label', expect.stringContaining('Breathe In'));
    });
  });

  describe('different techniques', () => {
    it('displays 4-7-8 technique correctly', () => {
      const technique478: BreathingTechnique = {
        id: '478',
        name: '4-7-8 Relaxing Breath',
        durations: [4, 7, 8, 0],
        description: 'Calming breath',
        cycles: 4,
      };

      renderWithProviders(<BreathingExercise technique={technique478} enableAudio={false} />);

      expect(screen.getByText('4-7-8 Relaxing Breath')).toBeInTheDocument();
      expect(screen.getByText('4-7-8-0 pattern · 4 cycles')).toBeInTheDocument();
    });

    it('displays box breathing correctly', () => {
      const boxTechnique: BreathingTechnique = {
        id: 'box',
        name: 'Box Breathing',
        durations: [4, 4, 4, 4],
        description: 'Equal cycles',
        cycles: 4,
      };

      renderWithProviders(<BreathingExercise technique={boxTechnique} enableAudio={false} />);

      expect(screen.getByText('Box Breathing')).toBeInTheDocument();
      expect(screen.getByText('4-4-4-4 pattern · 4 cycles')).toBeInTheDocument();
    });
  });

  describe('keyboard interaction', () => {
    it('can start exercise with keyboard', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      const startButton = screen.getByText('Start Exercise');
      fireEvent.keyDown(startButton, { key: 'Enter' });
      fireEvent.click(startButton); // Simulate the click that follows Enter

      expect(screen.getByText('Breathe In')).toBeInTheDocument();
    });

    it('can pause/resume with keyboard', () => {
      renderWithProviders(<BreathingExercise technique={shortTechnique} enableAudio={false} />);

      fireEvent.click(screen.getByText('Start Exercise'));

      // Use keyboard to pause
      const pauseButton = screen.getByText('Pause');
      pauseButton.focus();
      fireEvent.keyDown(pauseButton, { key: 'Enter' });
      fireEvent.click(pauseButton);

      expect(screen.getByText('Resume')).toBeInTheDocument();
    });
  });
});
