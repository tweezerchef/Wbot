import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { BadgeUnlock } from '../BadgeUnlock';

describe('BadgeUnlock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('renders badge emoji', () => {
      render(<BadgeUnlock badgeName="Test Badge" badgeEmoji="🏆" />);
      expect(screen.getByText('🏆')).toBeInTheDocument();
    });

    it('renders "Badge Earned!" title', () => {
      render(<BadgeUnlock badgeName="Test Badge" badgeEmoji="🏆" />);
      expect(screen.getByText('Badge Earned!')).toBeInTheDocument();
    });

    it('renders badge name', () => {
      render(<BadgeUnlock badgeName="Week of Calm" badgeEmoji="🧘" />);
      expect(screen.getByText('Week of Calm')).toBeInTheDocument();
    });

    it('renders congratulations message', () => {
      render(<BadgeUnlock badgeName="Test Badge" badgeEmoji="🏆" />);
      expect(screen.getByText('Congratulations on completing this milestone!')).toBeInTheDocument();
    });

    it('renders confetti particles', () => {
      const { container } = render(<BadgeUnlock badgeName="Test Badge" badgeEmoji="🏆" />);
      const particles = container.querySelectorAll('[class*="particle"]');
      expect(particles.length).toBe(20);
    });
  });

  describe('callbacks', () => {
    it('calls onClose when Continue is clicked', () => {
      const onClose = vi.fn();
      const { container } = render(<BadgeUnlock badgeName="Test Badge" badgeEmoji="🏆" onClose={onClose} />);
      
      const button = container.querySelector('[class*="button"]');
      if (button) {fireEvent.click(button);}
      
      act(() => {
        vi.advanceTimersByTime(300);
      });
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('auto-closes after delay when autoClose is true', () => {
      const onClose = vi.fn();
      render(
        <BadgeUnlock
          badgeName="Test Badge"
          badgeEmoji="🏆"
          onClose={onClose}
          autoClose
          autoCloseDelay={3000}
        />
      );

      expect(onClose).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(3300);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not auto-close when autoClose is false', () => {
      const onClose = vi.fn();
      render(
        <BadgeUnlock
          badgeName="Test Badge"
          badgeEmoji="🏆"
          onClose={onClose}
          autoClose={false}
        />
      );

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('animations', () => {
    it('adds visible class after mount', () => {
      const { container } = render(<BadgeUnlock badgeName="Test Badge" badgeEmoji="🏆" />);
      
      act(() => {
        vi.advanceTimersByTime(100);
      });

      const overlay = container.querySelector('[class*="overlay"]');
      expect(overlay?.className).toContain('visible');
    });
  });
});
