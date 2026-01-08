import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { TimerMeditation } from '../TimerMeditation';

// Mock the hooks
vi.mock('../useAmbientMixer', () => ({
  useAmbientMixer: () => ({
    play: vi.fn(),
    stop: vi.fn(),
    fadeOut: vi.fn(),
    isPlaying: false,
  }),
}));

vi.mock('../useBinauralBeats', () => ({
  useBinauralBeats: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    fadeOut: vi.fn(),
    isPlaying: false,
    frequency: 'theta',
    volume: 0.3,
    setFrequency: vi.fn(),
    setVolume: vi.fn(),
    getDescription: () => 'Deep meditation (6 Hz)',
  }),
}));

// Mock MeditationVisual
vi.mock('../MeditationVisual', () => ({
  MeditationVisual: ({ playbackState }: { playbackState: string }) => (
    <div data-testid="meditation-visual">{playbackState}</div>
  ),
}));

describe('TimerMeditation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('setup screen', () => {
    it('renders setup screen initially', () => {
      render(<TimerMeditation enableAmbient={false} enableBinaural={false} />);
      expect(screen.getByText('Silent Meditation Timer')).toBeInTheDocument();
    });

    it('shows duration options', () => {
      render(<TimerMeditation enableAmbient={false} enableBinaural={false} />);
      expect(screen.getByText('3 min')).toBeInTheDocument();
      expect(screen.getByText('5 min')).toBeInTheDocument();
      expect(screen.getByText('10 min')).toBeInTheDocument();
    });

    it('selects default duration of 10 minutes', () => {
      render(<TimerMeditation enableAmbient={false} enableBinaural={false} />);
      const button = screen.getByText('10 min');
      // CSS modules transform 'selected' to '_selected_...'
      expect(button.className).toContain('selected');
    });

    it('allows selecting different duration', () => {
      render(<TimerMeditation enableAmbient={false} enableBinaural={false} />);
      const button5 = screen.getByText('5 min');
      fireEvent.click(button5);
      // CSS modules transform 'selected' to '_selected_...'
      expect(button5.className).toContain('selected');
    });
  });

  describe('running state', () => {
    it('shows timer display after starting', () => {
      const { container } = render(
        <TimerMeditation initialMinutes={5} enableAmbient={false} enableBinaural={false} />
      );
      const startButton = container.querySelector('button[class*="startButton"]');
      if (startButton) {
        fireEvent.click(startButton);
      }
      expect(screen.getByText('5:00')).toBeInTheDocument();
    });

    it('counts down the timer', () => {
      const { container } = render(
        <TimerMeditation initialMinutes={1} enableAmbient={false} enableBinaural={false} />
      );
      const startButton = container.querySelector('button[class*="startButton"]');
      if (startButton) {
        fireEvent.click(startButton);
      }

      expect(screen.getByText('1:00')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText('0:59')).toBeInTheDocument();
    });
  });

  describe('completion', () => {
    it('shows completion screen when timer ends', () => {
      const { container } = render(
        <TimerMeditation initialMinutes={1} enableAmbient={false} enableBinaural={false} />
      );
      const startButton = container.querySelector('button[class*="startButton"]');
      if (startButton) {
        fireEvent.click(startButton);
      }

      act(() => {
        vi.advanceTimersByTime(60000);
      });

      expect(screen.getByText('Well Done!')).toBeInTheDocument();
    });

    it('calls onComplete callback', () => {
      const onComplete = vi.fn();
      const { container } = render(
        <TimerMeditation
          initialMinutes={1}
          onComplete={onComplete}
          enableAmbient={false}
          enableBinaural={false}
        />
      );
      const startButton = container.querySelector('button[class*="startButton"]');
      if (startButton) {
        fireEvent.click(startButton);
      }

      act(() => {
        vi.advanceTimersByTime(60000);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
