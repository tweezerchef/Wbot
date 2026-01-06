import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MeditationSeries } from '../MeditationSeries';
import type { MeditationSeries as SeriesType, SeriesProgress } from '../types';

const mockSeries: SeriesType = {
  id: '7_day_calm',
  title: '7 Day Calm',
  description: 'A week of daily meditations to build your calm practice.',
  trackIds: ['track1', 'track2', 'track3', 'track4', 'track5', 'track6', 'track7'],
  badgeName: 'Week of Calm',
  badgeEmoji: '🧘',
  totalDurationSeconds: 2820,
  difficulty: 'beginner',
};

const mockProgress: SeriesProgress = {
  seriesId: '7_day_calm',
  completedTrackIds: ['track1', 'track2'],
  currentTrackIndex: 2,
  startedAt: '2024-01-01T00:00:00Z',
  completedAt: null,
  badgeEarned: false,
};

describe('MeditationSeries', () => {
  describe('rendering', () => {
    it('renders series title', () => {
      render(<MeditationSeries series={mockSeries} />);
      expect(screen.getByRole('heading', { name: '7 Day Calm' })).toBeInTheDocument();
    });

    it('renders series description', () => {
      render(<MeditationSeries series={mockSeries} />);
      expect(
        screen.getByText('A week of daily meditations to build your calm practice.')
      ).toBeInTheDocument();
    });

    it('renders badge emoji', () => {
      render(<MeditationSeries series={mockSeries} />);
      expect(screen.getByText('🧘')).toBeInTheDocument();
    });
  });

  describe('progress display', () => {
    it('shows 0 of N complete when no progress', () => {
      render(<MeditationSeries series={mockSeries} />);
      expect(screen.getByText('0 of 7 complete')).toBeInTheDocument();
    });

    it('shows correct progress count', () => {
      render(<MeditationSeries series={mockSeries} progress={mockProgress} />);
      expect(screen.getByText('2 of 7 complete')).toBeInTheDocument();
    });

    it('shows complete badge when all tracks done', () => {
      const completedProgress: SeriesProgress = {
        ...mockProgress,
        completedTrackIds: mockSeries.trackIds,
        completedAt: '2024-01-07T00:00:00Z',
        badgeEarned: true,
      };
      render(<MeditationSeries series={mockSeries} progress={completedProgress} />);
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });

  describe('buttons', () => {
    it('shows Start Series button when no progress', () => {
      render(<MeditationSeries series={mockSeries} />);
      expect(screen.getByText('Start Series')).toBeInTheDocument();
    });

    it('shows Continue button when in progress', () => {
      render(<MeditationSeries series={mockSeries} progress={mockProgress} />);
      expect(screen.getByText('Continue')).toBeInTheDocument();
    });

    it('shows Restart Series button when complete', () => {
      const completedProgress: SeriesProgress = {
        ...mockProgress,
        completedTrackIds: mockSeries.trackIds,
      };
      render(<MeditationSeries series={mockSeries} progress={completedProgress} />);
      expect(screen.getByText('Restart Series')).toBeInTheDocument();
    });
  });

  describe('callbacks', () => {
    it('calls onStartSession with index 0 when starting', () => {
      const onStartSession = vi.fn();
      const { container } = render(
        <MeditationSeries series={mockSeries} onStartSession={onStartSession} />
      );
      const primaryButton = container.querySelector('[class*="primaryButton"]');
      if (primaryButton) {
        fireEvent.click(primaryButton);
      }
      expect(onStartSession).toHaveBeenCalledWith(0);
    });

    it('calls onStartSession with current index when continuing', () => {
      const onStartSession = vi.fn();
      const { container } = render(
        <MeditationSeries
          series={mockSeries}
          progress={mockProgress}
          onStartSession={onStartSession}
        />
      );
      const primaryButton = container.querySelector('[class*="primaryButton"]');
      if (primaryButton) {
        fireEvent.click(primaryButton);
      }
      expect(onStartSession).toHaveBeenCalledWith(2);
    });
  });
});
