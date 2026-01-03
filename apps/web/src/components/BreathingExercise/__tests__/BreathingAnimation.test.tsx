/**
 * Tests for BreathingAnimation component
 *
 * Tests the visual representation of the breathing exercise -
 * an animated circle with phase-specific styling and accessibility.
 */

import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';

import { BreathingAnimation } from '../BreathingAnimation';
import type { BreathingPhase } from '../types';
import { PHASE_LABELS } from '../types';

describe('BreathingAnimation', () => {
  afterEach(() => {
    cleanup();
  });

  describe('idle state', () => {
    it('renders with idle class when not active', () => {
      const { container } = render(
        <BreathingAnimation phase="inhale" progress={0} duration={4} isActive={false} />
      );

      const circle = container.querySelector('[role="img"]');
      expect(circle?.className).toContain('circleIdle');
      expect(circle?.className).not.toContain('circleInhale');
    });

    it('displays "Ready" label when idle', () => {
      render(<BreathingAnimation phase="inhale" progress={0} duration={4} isActive={false} />);

      expect(screen.getByText('Ready')).toBeInTheDocument();
    });

    it('has correct ARIA label when idle', () => {
      render(<BreathingAnimation phase="inhale" progress={0} duration={4} isActive={false} />);

      const circle = screen.getByRole('img');
      expect(circle).toHaveAttribute('aria-label', 'Breathing exercise ready');
    });

    it('uses 0.5s transition duration when idle', () => {
      const { container } = render(
        <BreathingAnimation phase="inhale" progress={0} duration={4} isActive={false} />
      );

      const circle = container.querySelector('[role="img"]');
      expect(circle).toHaveStyle({ transitionDuration: '0.5s' });
    });

    it('does not show timer when idle', () => {
      render(<BreathingAnimation phase="inhale" progress={0} duration={4} isActive={false} />);

      // The timer should not be rendered
      const phaseTimer = screen.queryByText('4');
      expect(phaseTimer).not.toBeInTheDocument();
    });
  });

  describe('active state - phase classes', () => {
    const phases: BreathingPhase[] = ['inhale', 'holdIn', 'exhale', 'holdOut'];

    it.each(phases)('applies correct class for %s phase', (phase) => {
      const { container } = render(
        <BreathingAnimation phase={phase} progress={0} duration={4} isActive={true} />
      );

      const circle = container.querySelector('[role="img"]');
      const expectedClass = `circle${phase.charAt(0).toUpperCase()}${phase.slice(1)}`;
      expect(circle?.className).toContain(expectedClass);
    });

    it.each(phases)('displays correct label for %s phase', (phase) => {
      render(<BreathingAnimation phase={phase} progress={0} duration={4} isActive={true} />);

      expect(screen.getByText(PHASE_LABELS[phase])).toBeInTheDocument();
    });
  });

  describe('transition duration', () => {
    it('sets transition duration based on phase duration', () => {
      const { container } = render(
        <BreathingAnimation phase="inhale" progress={0} duration={4} isActive={true} />
      );

      const circle = container.querySelector('[role="img"]');
      // duration * 0.9 = 4 * 0.9 = 3.6s
      expect(circle).toHaveStyle({ transitionDuration: '3.6s' });
    });

    it('uses minimum 0.5s transition duration for short phases', () => {
      const { container } = render(
        <BreathingAnimation phase="inhale" progress={0} duration={0.3} isActive={true} />
      );

      const circle = container.querySelector('[role="img"]');
      // Math.max(0.5, 0.3 * 0.9) = Math.max(0.5, 0.27) = 0.5s
      expect(circle).toHaveStyle({ transitionDuration: '0.5s' });
    });

    it('applies phase-specific timing function', () => {
      const { container } = render(
        <BreathingAnimation phase="inhale" progress={0} duration={4} isActive={true} />
      );

      const circle = container.querySelector('[role="img"]');
      // Inhale uses cubic-bezier(0.4, 0, 0.2, 1)
      expect(circle).toHaveStyle({ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' });
    });
  });

  describe('time display', () => {
    it('shows time remaining at start of phase', () => {
      render(<BreathingAnimation phase="inhale" progress={0} duration={4} isActive={true} />);

      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('shows time remaining mid-phase', () => {
      render(<BreathingAnimation phase="inhale" progress={0.5} duration={4} isActive={true} />);

      // 4 * (1 - 0.5) = 2, ceil(2) = 2
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('rounds time up for display', () => {
      render(<BreathingAnimation phase="inhale" progress={0.6} duration={4} isActive={true} />);

      // 4 * (1 - 0.6) = 1.6, ceil(1.6) = 2
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('shows 1 near end of phase', () => {
      render(<BreathingAnimation phase="inhale" progress={0.9} duration={4} isActive={true} />);

      // 4 * (1 - 0.9) = 0.4, ceil(0.4) = 1
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('does not show timer when phase duration is 0', () => {
      render(<BreathingAnimation phase="holdIn" progress={0} duration={0} isActive={true} />);

      // No timer should be shown for zero-duration phases
      const timerRegex = /^\d+$/;
      expect(screen.queryByText(timerRegex)).not.toBeInTheDocument();
    });

    it('handles large durations', () => {
      render(<BreathingAnimation phase="exhale" progress={0} duration={10} isActive={true} />);

      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has correct ARIA label during inhale', () => {
      render(<BreathingAnimation phase="inhale" progress={0} duration={4} isActive={true} />);

      const circle = screen.getByRole('img');
      expect(circle).toHaveAttribute('aria-label', 'Breathe In: 4 seconds remaining');
    });

    it('has correct ARIA label during exhale', () => {
      render(<BreathingAnimation phase="exhale" progress={0.5} duration={8} isActive={true} />);

      const circle = screen.getByRole('img');
      // 8 * (1 - 0.5) = 4
      expect(circle).toHaveAttribute('aria-label', 'Breathe Out: 4 seconds remaining');
    });

    it('has correct ARIA label during hold phases', () => {
      render(<BreathingAnimation phase="holdIn" progress={0} duration={7} isActive={true} />);

      const circle = screen.getByRole('img');
      expect(circle).toHaveAttribute('aria-label', 'Hold: 7 seconds remaining');
    });

    it('marks decorative elements as aria-hidden', () => {
      const { container } = render(
        <BreathingAnimation phase="inhale" progress={0} duration={4} isActive={true} />
      );

      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      // Should have at least the pulsing ring and inner glow
      expect(hiddenElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ring effect', () => {
    it('has active class on ring when active', () => {
      const { container } = render(
        <BreathingAnimation phase="inhale" progress={0} duration={4} isActive={true} />
      );

      // The ring should have the active class
      const ring = container.querySelector('[aria-hidden="true"]');
      expect(ring?.className).toContain('breathRingActive');
    });

    it('does not have active class on ring when idle', () => {
      const { container } = render(
        <BreathingAnimation phase="inhale" progress={0} duration={4} isActive={false} />
      );

      const ring = container.querySelector('[aria-hidden="true"]');
      expect(ring?.className).not.toContain('breathRingActive');
    });
  });

  describe('all phases render correctly', () => {
    it('renders inhale phase with label', () => {
      render(<BreathingAnimation phase="inhale" progress={0.25} duration={4} isActive={true} />);

      expect(screen.getByText('Breathe In')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // ceil(4 * 0.75)
    });

    it('renders holdIn phase with label', () => {
      render(<BreathingAnimation phase="holdIn" progress={0.5} duration={7} isActive={true} />);

      expect(screen.getByText('Hold')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument(); // ceil(7 * 0.5)
    });

    it('renders exhale phase with label', () => {
      render(<BreathingAnimation phase="exhale" progress={0.75} duration={8} isActive={true} />);

      expect(screen.getByText('Breathe Out')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // ceil(8 * 0.25)
    });

    it('renders holdOut phase with label', () => {
      render(<BreathingAnimation phase="holdOut" progress={0} duration={4} isActive={true} />);

      // holdIn and holdOut both have "Hold" label
      expect(screen.getByText('Hold')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles progress exactly at 1', () => {
      render(<BreathingAnimation phase="inhale" progress={1} duration={4} isActive={true} />);

      // 4 * (1 - 1) = 0, ceil(0) = 0, which is falsy so timer not shown
      // This tests the timeDisplay logic - when remaining is 0, it returns empty string
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('handles progress slightly over 1', () => {
      // This can happen due to floating point errors
      render(<BreathingAnimation phase="inhale" progress={1.01} duration={4} isActive={true} />);

      // Should handle gracefully - negative remaining becomes empty
      expect(screen.queryByText('-')).not.toBeInTheDocument();
    });

    it('handles zero duration phase', () => {
      const { container } = render(
        <BreathingAnimation phase="holdIn" progress={0} duration={0} isActive={true} />
      );

      // Should render without crashing
      expect(container.querySelector('[role="img"]')).toBeInTheDocument();
      expect(screen.getByText('Hold')).toBeInTheDocument();
    });
  });
});
