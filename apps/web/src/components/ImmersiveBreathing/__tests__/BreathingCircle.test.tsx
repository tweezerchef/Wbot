/**
 * Tests for BreathingCircle component
 *
 * Tests the Apple Watch-inspired breathing visualization with
 * animated flower petals and phase-specific styling.
 */

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';

import { BreathingCircle } from '../BreathingCircle';
import { PHASE_LABELS } from '../types';
import type { BreathingPhase } from '../types';

describe('BreathingCircle', () => {
  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    phase: 'inhale' as BreathingPhase,
    progress: 0.5,
    duration: 4,
    isActive: true,
    timeRemaining: 2,
  };

  describe('phase display', () => {
    it.each([
      ['inhale', PHASE_LABELS.inhale],
      ['holdIn', PHASE_LABELS.holdIn],
      ['exhale', PHASE_LABELS.exhale],
      ['holdOut', PHASE_LABELS.holdOut],
    ] as const)('displays correct label for %s phase', (phase, expectedLabel) => {
      render(<BreathingCircle {...defaultProps} phase={phase} isActive={true} />);

      expect(screen.getByText(expectedLabel)).toBeInTheDocument();
    });

    it('displays "Ready" when not active', () => {
      render(<BreathingCircle {...defaultProps} isActive={false} />);

      expect(screen.getByText('Ready')).toBeInTheDocument();
    });
  });

  describe('timer display', () => {
    it('displays time remaining when active', () => {
      render(<BreathingCircle {...defaultProps} timeRemaining={3} isActive={true} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('displays "Press Start" when not active', () => {
      render(<BreathingCircle {...defaultProps} timeRemaining={3} isActive={false} />);

      expect(screen.getByText('Press Start')).toBeInTheDocument();
    });

    it('rounds up time remaining', () => {
      render(<BreathingCircle {...defaultProps} timeRemaining={2.3} isActive={true} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has role="img" for the container', () => {
      render(<BreathingCircle {...defaultProps} />);

      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('has accessible label when active with time remaining', () => {
      render(
        <BreathingCircle {...defaultProps} phase="inhale" isActive={true} timeRemaining={2} />
      );

      const circle = screen.getByRole('img');
      expect(circle).toHaveAttribute(
        'aria-label',
        'Breathing circle: Breathe In, 2 seconds remaining'
      );
    });

    it('has accessible label when inactive', () => {
      render(<BreathingCircle {...defaultProps} isActive={false} />);

      const circle = screen.getByRole('img');
      expect(circle).toHaveAttribute('aria-label', 'Breathing circle: Ready');
    });
  });

  describe('visual styling', () => {
    it('applies circleInhale class when active and inhale phase', () => {
      const { container } = render(
        <BreathingCircle {...defaultProps} phase="inhale" isActive={true} />
      );

      const circle = container.querySelector('[class*="circle"]');
      expect(circle?.className).toContain('circleInhale');
    });

    it('applies circleExhale class for exhale phase', () => {
      const { container } = render(
        <BreathingCircle {...defaultProps} phase="exhale" isActive={true} />
      );

      const circle = container.querySelector('[class*="circle"]');
      expect(circle?.className).toContain('circleExhale');
    });

    it('applies circleHoldIn class for holdIn phase', () => {
      const { container } = render(
        <BreathingCircle {...defaultProps} phase="holdIn" isActive={true} />
      );

      const circle = container.querySelector('[class*="circle"]');
      expect(circle?.className).toContain('circleHoldIn');
    });

    it('applies circleHoldOut class for holdOut phase', () => {
      const { container } = render(
        <BreathingCircle {...defaultProps} phase="holdOut" isActive={true} />
      );

      const circle = container.querySelector('[class*="circle"]');
      expect(circle?.className).toContain('circleHoldOut');
    });

    it('applies circleIdle class when not active', () => {
      const { container } = render(<BreathingCircle {...defaultProps} isActive={false} />);

      const circle = container.querySelector('[class*="circle"]');
      expect(circle?.className).toContain('circleIdle');
    });
  });

  describe('transition timing', () => {
    it('sets transition duration to 90% of phase duration when active', () => {
      const { container } = render(
        <BreathingCircle {...defaultProps} duration={4} isActive={true} />
      );

      const circle = container.querySelector('[class*="circle"]');
      expect(circle).toHaveStyle({ transitionDuration: '3.6s' }); // 4 * 0.9
    });

    it('uses shorter transition when not active', () => {
      const { container } = render(
        <BreathingCircle {...defaultProps} duration={4} isActive={false} />
      );

      const circle = container.querySelector('[class*="circle"]');
      expect(circle).toHaveStyle({ transitionDuration: '0.5s' });
    });
  });

  describe('petals', () => {
    it('renders 6 petal elements', () => {
      const { container } = render(<BreathingCircle {...defaultProps} />);

      // Select only individual petal elements (not the container)
      const petals = container.querySelectorAll('[class*="petal"]:not([class*="petals"])');
      expect(petals).toHaveLength(6);
    });

    it('applies petalsExpanded class during inhale', () => {
      const { container } = render(
        <BreathingCircle {...defaultProps} phase="inhale" isActive={true} />
      );

      const petalsContainer = container.querySelector('[class*="petals"]');
      expect(petalsContainer?.className).toContain('petalsExpanded');
    });

    it('applies petalsExpanded class during holdIn', () => {
      const { container } = render(
        <BreathingCircle {...defaultProps} phase="holdIn" isActive={true} />
      );

      const petalsContainer = container.querySelector('[class*="petals"]');
      expect(petalsContainer?.className).toContain('petalsExpanded');
    });

    it('does not apply petalsExpanded class during exhale', () => {
      const { container } = render(
        <BreathingCircle {...defaultProps} phase="exhale" isActive={true} />
      );

      const petalsContainer = container.querySelector('[class*="petals"]');
      expect(petalsContainer?.className).not.toContain('petalsExpanded');
    });
  });
});
