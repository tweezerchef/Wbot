/**
 * Badge Component
 *
 * Achievement badge with locked/unlocked states and progress tracking.
 */

import type React from 'react';

import styles from './Badge.module.css';

/* ----------------------------------------------------------------------------
   Types
   ---------------------------------------------------------------------------- */

export type BadgeCategory = 'consistency' | 'exploration' | 'milestone' | 'mastery';

export interface BadgeData {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: 'flame' | 'star' | 'moon' | 'sun' | 'heart' | 'check' | 'medal' | 'crown';
  isUnlocked: boolean;
  progress?: number; // 0-100
  unlockedAt?: Date;
}

export interface BadgeProps {
  badge: BadgeData;
  showProgress?: boolean;
  justUnlocked?: boolean;
  onClick?: () => void;
}

/* ----------------------------------------------------------------------------
   Icons
   ---------------------------------------------------------------------------- */

const icons = {
  flame: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.517 1.282-4.88 3.5-6.5-.5 2 .5 3.5 1.5 4 0-3 1.5-5.5 4-7.5.5 1.5 1.5 2.5 2.5 3 1-2 2-3.5 1.5-5.5 3.5 2 5 5.5 5 9 0 5.523-4.477 10-10 10z" />
    </svg>
  ),
  star: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  moon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  sun: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  heart: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  check: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  medal: (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  ),
  crown: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 14h14v2H5v-2z" />
    </svg>
  ),
};

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function Badge({ badge, showProgress = false, justUnlocked = false, onClick }: BadgeProps) {
  const { name, category, icon, isUnlocked, progress } = badge;

  const iconCircleClasses = [
    styles.iconCircle,
    isUnlocked ? styles.unlocked : styles.locked,
    isUnlocked && styles[category],
    justUnlocked && styles.justUnlocked,
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  const interactiveProps = onClick
    ? {
        onClick,
        onKeyDown: handleKeyDown,
        role: 'button' as const,
        tabIndex: 0,
      }
    : {};

  return (
    <div
      className={`${styles.badge} ${!isUnlocked ? styles.locked : ''}`}
      title={badge.description}
      {...interactiveProps}
    >
      <div className={iconCircleClasses}>{icons[icon]}</div>

      <span className={styles.name}>{name}</span>

      {showProgress && !isUnlocked && progress !== undefined && (
        <div className={styles.progress}>
          <div className={styles.progressFill} style={{ width: `${progress.toString()}%` }} />
        </div>
      )}
    </div>
  );
}
