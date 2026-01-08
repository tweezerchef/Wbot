/**
 * Streak Display Component
 *
 * Large streak display with flame icon and milestone celebrations.
 * Shows current streak count with encouraging messages.
 */

import { useState, useEffect } from 'react';

import styles from './StreakDisplay.module.css';

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

interface StreakDisplayProps {
  /** Current streak count in days */
  streakDays: number;
  /** Whether to use compact styling */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

/* ----------------------------------------------------------------------------
   Flame Icon
   ---------------------------------------------------------------------------- */

function FlameIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.517 1.282-4.88 3.5-6.5-.5 2 .5 3.5 1.5 4 0-3 1.5-5.5 4-7.5.5 1.5 1.5 2.5 2.5 3 1-2 2-3.5 1.5-5.5 3.5 2 5 5.5 5 9 0 5.523-4.477 10-10 10z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/* ----------------------------------------------------------------------------
   Helper Functions
   ---------------------------------------------------------------------------- */

const milestones = [7, 14, 30, 60, 90, 180, 365];

function isMilestone(days: number): boolean {
  return milestones.includes(days);
}

function getEncouragementMessage(days: number): string {
  if (days === 0) {
    return 'Start your wellness journey today!';
  }
  if (days === 1) {
    return 'Great start! Keep it going!';
  }
  if (days === 7) {
    return 'One week strong! Amazing dedication!';
  }
  if (days === 14) {
    return "Two weeks! You're building a habit!";
  }
  if (days === 30) {
    return "One month! You're unstoppable!";
  }
  if (days === 60) {
    return 'Two months of wellness! Incredible!';
  }
  if (days === 90) {
    return 'Three months! A true wellness warrior!';
  }
  if (days >= 180) {
    return "Half a year! You're an inspiration!";
  }
  if (days >= 365) {
    return 'A full year! Legendary achievement!';
  }
  if (days < 7) {
    return `${(7 - days).toString()} more days to your first milestone!`;
  }
  // Find next milestone
  const nextMilestone = milestones.find((m) => m > days) ?? 365;
  const daysToNext = nextMilestone - days;
  return `${daysToNext.toString()} days until your next milestone!`;
}

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function StreakDisplay({ streakDays, compact = false, className }: StreakDisplayProps) {
  const [celebrating, setCelebrating] = useState(false);
  const showMilestoneBadge = isMilestone(streakDays);

  // Trigger celebration animation on milestone
  useEffect(() => {
    if (showMilestoneBadge) {
      setCelebrating(true);
      const timer = setTimeout(() => {
        setCelebrating(false);
      }, 500);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [showMilestoneBadge, streakDays]);

  const containerClasses = [
    styles.container,
    compact && styles.compact,
    celebrating && styles.celebrating,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (compact) {
    return (
      <div className={containerClasses}>
        <div className={styles.flameContainer}>
          <div className={styles.flame}>
            <FlameIcon size={24} />
          </div>
        </div>
        <div className={styles.compactInfo}>
          <span className={styles.streakNumber}>{streakDays}</span>
          <span className={styles.streakLabel}>day streak</span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={styles.flameContainer}>
        <div className={styles.flame}>
          <FlameIcon />
        </div>
        {showMilestoneBadge && (
          <div className={styles.milestoneBadge}>
            <CheckIcon />
          </div>
        )}
      </div>

      <span className={styles.streakNumber}>{streakDays}</span>
      <span className={styles.streakLabel}>day{streakDays !== 1 ? 's' : ''} streak</span>

      <p className={styles.encouragement}>{getEncouragementMessage(streakDays)}</p>
    </div>
  );
}
