/**
 * Activity Card Component
 *
 * Card for displaying wellness activities like breathing exercises,
 * meditations, journaling, and sleep stories.
 *
 * Features:
 * - Gradient background based on activity type
 * - Icon, title, description
 * - Duration and difficulty metadata
 * - Start button with hover effects
 */

import type React from 'react';

import styles from './ActivityCard.module.css';

/* ----------------------------------------------------------------------------
   Types
   ---------------------------------------------------------------------------- */

export type ActivityCardType = 'breathing' | 'meditation' | 'journal' | 'sleep';

export interface ActivityCardProps {
  /** Type of activity - determines colors and icon */
  type: ActivityCardType;
  /** Activity title */
  title: string;
  /** Activity description */
  description: string;
  /** Duration in minutes */
  duration?: number;
  /** Difficulty level */
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  /** Whether to use compact styling */
  compact?: boolean;
  /** Callback when card or start button is clicked */
  onStart?: () => void;
  /** Custom className */
  className?: string;
}

/* ----------------------------------------------------------------------------
   Icons
   ---------------------------------------------------------------------------- */

function BreathingIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l2 2" />
    </svg>
  );
}

function MeditationIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z" />
      <path d="M8 14v1a4 4 0 0 0 8 0v-1" />
      <path d="M12 19v3" />
      <path d="M8 22h8" />
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="M8 7h6" />
      <path d="M8 11h8" />
    </svg>
  );
}

function SleepIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function LevelIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  );
}

const iconMap = {
  breathing: BreathingIcon,
  meditation: MeditationIcon,
  journal: JournalIcon,
  sleep: SleepIcon,
};

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function ActivityCard({
  type,
  title,
  description,
  duration,
  difficulty,
  compact = false,
  onStart,
  className,
}: ActivityCardProps) {
  const Icon = iconMap[type];

  const cardClasses = [styles.card, styles[type], compact && styles.compact, className]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onStart?.();
    }
  };

  return (
    <div
      className={cardClasses}
      onClick={() => {
        onStart?.();
      }}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      {/* Icon */}
      <div className={`${styles.icon} ${styles[type]}`}>
        <Icon />
      </div>

      {/* Title */}
      <h3 className={styles.title}>{title}</h3>

      {/* Description */}
      <p className={styles.description}>{description}</p>

      {/* Metadata */}
      {(duration ?? difficulty) && (
        <div className={styles.meta}>
          {duration && (
            <span className={styles.metaItem}>
              <ClockIcon />
              {duration} min
            </span>
          )}
          {difficulty && (
            <span className={styles.metaItem}>
              <LevelIcon />
              {difficulty}
            </span>
          )}
        </div>
      )}

      {/* Start Button */}
      <button
        className={styles.startButton}
        onClick={(e) => {
          e.stopPropagation();
          onStart?.();
        }}
        type="button"
      >
        Start
      </button>
    </div>
  );
}
