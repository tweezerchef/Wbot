/**
 * Tests for BreathingProgress component
 *
 * Tests the cycle progress indicator showing completed,
 * current, and remaining cycles.
 */

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';

import { BreathingProgress } from '../BreathingProgress';

describe('BreathingProgress', () => {
  afterEach(() => {
    cleanup();
  });

  describe('rendering dots', () => {
    it('renders correct number of dots for total cycles', () => {
      const { container } = render(<BreathingProgress currentCycle={1} totalCycles={4} />);

      const dots = container.querySelectorAll('[class*="dot"]');
      expect(dots).toHaveLength(4);
    });

    it('renders single dot for single cycle', () => {
      const { container } = render(<BreathingProgress currentCycle={1} totalCycles={1} />);

      const dots = container.querySelectorAll('[class*="dot"]');
      expect(dots).toHaveLength(1);
    });
  });

  describe('dot states', () => {
    it('marks completed cycles with complete class', () => {
      const { container } = render(<BreathingProgress currentCycle={3} totalCycles={5} />);

      const dots = container.querySelectorAll('[class*="dot"]');
      // Cycles 1 and 2 should be complete
      expect(dots[0].className).toContain('dotComplete');
      expect(dots[1].className).toContain('dotComplete');
    });

    it('marks current cycle with current class', () => {
      const { container } = render(<BreathingProgress currentCycle={3} totalCycles={5} />);

      const dots = container.querySelectorAll('[class*="dot"]');
      // Cycle 3 should be current
      expect(dots[2].className).toContain('dotCurrent');
    });

    it('marks pending cycles with pending class', () => {
      const { container } = render(<BreathingProgress currentCycle={3} totalCycles={5} />);

      const dots = container.querySelectorAll('[class*="dot"]');
      // Cycles 4 and 5 should be pending
      expect(dots[3].className).toContain('dotPending');
      expect(dots[4].className).toContain('dotPending');
    });

    it('first cycle is current when starting', () => {
      const { container } = render(<BreathingProgress currentCycle={1} totalCycles={4} />);

      const dots = container.querySelectorAll('[class*="dot"]');
      expect(dots[0].className).toContain('dotCurrent');
      expect(dots[1].className).toContain('dotPending');
      expect(dots[2].className).toContain('dotPending');
      expect(dots[3].className).toContain('dotPending');
    });

    it('last cycle is current when almost complete', () => {
      const { container } = render(<BreathingProgress currentCycle={4} totalCycles={4} />);

      const dots = container.querySelectorAll('[class*="dot"]');
      expect(dots[0].className).toContain('dotComplete');
      expect(dots[1].className).toContain('dotComplete');
      expect(dots[2].className).toContain('dotComplete');
      expect(dots[3].className).toContain('dotCurrent');
    });
  });

  describe('accessibility', () => {
    it('has progressbar role', () => {
      render(<BreathingProgress currentCycle={2} totalCycles={4} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('has correct aria-valuenow', () => {
      render(<BreathingProgress currentCycle={2} totalCycles={4} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '2');
    });

    it('has correct aria-valuemin', () => {
      render(<BreathingProgress currentCycle={2} totalCycles={4} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemin', '1');
    });

    it('has correct aria-valuemax', () => {
      render(<BreathingProgress currentCycle={2} totalCycles={4} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuemax', '4');
    });

    it('has accessible label with cycle info', () => {
      render(<BreathingProgress currentCycle={2} totalCycles={4} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'Cycle 2 of 4');
    });

    it('dots are hidden from assistive technology', () => {
      const { container } = render(<BreathingProgress currentCycle={2} totalCycles={4} />);

      const dots = container.querySelectorAll('[class*="dot"]');
      dots.forEach((dot) => {
        expect(dot).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('includes visible cycle text for screen readers', () => {
      render(<BreathingProgress currentCycle={2} totalCycles={4} />);

      expect(screen.getByText('Cycle 2 of 4')).toBeInTheDocument();
    });
  });

  describe('state updates', () => {
    it('updates dot states when currentCycle changes', () => {
      const { container, rerender } = render(
        <BreathingProgress currentCycle={1} totalCycles={4} />
      );

      // Initial state: cycle 1 is current
      let dots = container.querySelectorAll('[class*="dot"]');
      expect(dots[0].className).toContain('dotCurrent');

      // Update to cycle 2
      rerender(<BreathingProgress currentCycle={2} totalCycles={4} />);

      dots = container.querySelectorAll('[class*="dot"]');
      expect(dots[0].className).toContain('dotComplete');
      expect(dots[1].className).toContain('dotCurrent');
    });
  });
});
