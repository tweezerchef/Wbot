import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SeriesProgressBar } from '../SeriesProgressBar';

describe('SeriesProgressBar', () => {
  it('renders correct progress text', () => {
    render(<SeriesProgressBar completed={3} total={7} currentIndex={3} />);
    expect(screen.getByText('3 of 7 complete')).toBeInTheDocument();
  });

  it('renders correct number of dots', () => {
    const { container } = render(<SeriesProgressBar completed={2} total={5} currentIndex={2} />);
    const dots = container.querySelectorAll('[class*="progressDot"]');
    expect(dots.length).toBe(5);
  });

  it('marks completed dots correctly', () => {
    const { container } = render(<SeriesProgressBar completed={3} total={5} currentIndex={3} />);
    const completedDots = container.querySelectorAll('[class*="completed"]');
    expect(completedDots.length).toBe(3);
  });

  it('marks current dot correctly', () => {
    const { container } = render(<SeriesProgressBar completed={2} total={5} currentIndex={2} />);
    const currentDots = container.querySelectorAll('[class*="current"]');
    expect(currentDots.length).toBe(1);
  });

  it('renders progress bar with correct width', () => {
    const { container } = render(<SeriesProgressBar completed={2} total={4} currentIndex={2} />);
    const fill = container.querySelector('[class*="progressFill"]');
    expect(fill).not.toBeNull();
    expect((fill as HTMLElement).style.width).toBe('50%');
  });

  it('handles zero total gracefully', () => {
    const { container } = render(<SeriesProgressBar completed={0} total={0} currentIndex={0} />);
    const fill = container.querySelector('[class*="progressFill"]');
    expect(fill).not.toBeNull();
    expect((fill as HTMLElement).style.width).toBe('0%');
  });
});
