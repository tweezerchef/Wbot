/* ============================================================================
   MoodCheck Component
   ============================================================================
   A simple mood rating selector for before/after meditation.

   Features:
   - 1-5 scale with emoji indicators
   - Optional skip button
   - Compact design for inline use
   - Accessible with keyboard navigation

   Used to track mood changes before and after meditation sessions.
   ============================================================================ */

import { useState, useCallback } from 'react';

import styles from './MoodCheck.module.css';
import { MOOD_OPTIONS } from './moodHelpers';
import type { MoodRating } from './types';

export interface MoodCheckProps {
  /** Label shown above the mood selector */
  label: string;
  /** Callback when a mood is selected */
  onSelect: (mood: MoodRating) => void;
  /** Optional callback when user skips */
  onSkip?: () => void;
  /** Whether skipping is allowed */
  allowSkip?: boolean;
  /** Currently selected mood (controlled mode) */
  value?: MoodRating;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** Compact mode for smaller spaces */
  compact?: boolean;
}

/**
 * Mood rating selector for meditation sessions
 *
 * Provides a simple 1-5 scale with emoji indicators.
 * Used to track mood changes before and after meditation.
 */
export function MoodCheck({
  label,
  onSelect,
  onSkip,
  allowSkip = true,
  value,
  disabled = false,
  compact = false,
}: MoodCheckProps) {
  const [selectedMood, setSelectedMood] = useState<MoodRating | null>(value ?? null);
  const [hoveredMood, setHoveredMood] = useState<MoodRating | null>(null);

  const handleSelect = useCallback(
    (mood: MoodRating) => {
      if (disabled) {return;}
      setSelectedMood(mood);
      onSelect(mood);
    },
    [disabled, onSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, mood: MoodRating) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSelect(mood);
      }
    },
    [handleSelect]
  );

  const handleSkip = useCallback(() => {
    if (onSkip) {
      onSkip();
    }
  }, [onSkip]);

  const currentMood = value ?? selectedMood;
  const displayMood = hoveredMood ?? currentMood;

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''}`}>
      <p className={styles.label}>{label}</p>

      <div className={styles.moodSelector} role="radiogroup" aria-label={label}>
        {MOOD_OPTIONS.map(({ rating, emoji, label: moodLabel }) => {
          const isSelected = currentMood === rating;
          const isHovered = hoveredMood === rating;

          return (
            <button
              key={rating}
              type="button"
              className={`${styles.moodButton} ${isSelected ? styles.selected : ''} ${isHovered ? styles.hovered : ''}`}
              onClick={() => { handleSelect(rating); }}
              onKeyDown={(e) => { handleKeyDown(e, rating); }}
              onMouseEnter={() => { setHoveredMood(rating); }}
              onMouseLeave={() => { setHoveredMood(null); }}
              disabled={disabled}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${moodLabel} (${String(rating)} out of 5)`}
              title={moodLabel}
            >
              <span className={styles.emoji} aria-hidden="true">
                {emoji}
              </span>
              {!compact && <span className={styles.rating}>{rating}</span>}
            </button>
          );
        })}
      </div>

      {/* Mood description */}
      {displayMood && !compact && (
        <p className={styles.description}>
          {MOOD_OPTIONS.find((m) => m.rating === displayMood)?.label}
        </p>
      )}

      {/* Skip button */}
      {allowSkip && onSkip && (
        <button
          type="button"
          className={styles.skipButton}
          onClick={handleSkip}
          disabled={disabled}
        >
          Skip
        </button>
      )}
    </div>
  );
}
