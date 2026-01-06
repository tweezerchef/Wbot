import { render, screen, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { MeditationStreakBadge } from '../MeditationStreakBadge';

describe('MeditationStreakBadge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders nothing when streak is 0', () => {
      const { container } = render(<MeditationStreakBadge streak={0} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when streak is negative', () => {
      const { container } = render(<MeditationStreakBadge streak={-1} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders streak count', () => {
      render(<MeditationStreakBadge streak={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders singular "day" for streak of 1', () => {
      render(<MeditationStreakBadge streak={1} variant="expanded" />);
      expect(screen.getByText('day')).toBeInTheDocument();
    });

    it('renders plural "days" for streak > 1', () => {
      render(<MeditationStreakBadge streak={3} variant="expanded" />);
      expect(screen.getByText('days')).toBeInTheDocument();
    });
  });

  describe('emoji display', () => {
    it('shows fire emoji for streaks under 7', () => {
      render(<MeditationStreakBadge streak={3} />);
      expect(screen.getByText('🔥')).toBeInTheDocument();
    });

    it('shows star emoji for streaks 7-13', () => {
      render(<MeditationStreakBadge streak={7} />);
      expect(screen.getByText('🌟')).toBeInTheDocument();
    });

    it('shows gold star for streaks 14-29', () => {
      render(<MeditationStreakBadge streak={14} />);
      expect(screen.getByText('⭐')).toBeInTheDocument();
    });

    it('shows trophy for streaks 30+', () => {
      render(<MeditationStreakBadge streak={30} />);
      expect(screen.getByText('🏆')).toBeInTheDocument();
    });
  });

  describe('messages', () => {
    it('shows "Great start!" for small streaks', () => {
      render(<MeditationStreakBadge streak={2} variant="expanded" />);
      expect(screen.getByText('Great start!')).toBeInTheDocument();
    });

    it('shows "Building momentum!" for streak of 3+', () => {
      render(<MeditationStreakBadge streak={3} variant="expanded" />);
      expect(screen.getByText('Building momentum!')).toBeInTheDocument();
    });

    it('shows "One week strong!" for streak of 7+', () => {
      render(<MeditationStreakBadge streak={7} variant="expanded" />);
      expect(screen.getByText('One week strong!')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('renders compact variant without message', () => {
      render(<MeditationStreakBadge streak={5} variant="compact" />);
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.queryByText('Building momentum!')).not.toBeInTheDocument();
    });

    it('renders expanded variant with message', () => {
      render(<MeditationStreakBadge streak={5} variant="expanded" />);
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('Building momentum!')).toBeInTheDocument();
    });
  });

  describe('celebration', () => {
    it('calls onCelebrationComplete after animation', () => {
      const onComplete = vi.fn();
      render(
        <MeditationStreakBadge streak={5} showCelebration onCelebrationComplete={onComplete} />
      );

      expect(onComplete).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(2500);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
