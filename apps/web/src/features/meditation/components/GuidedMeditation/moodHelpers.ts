/* ============================================================================
   Mood Check Helper Functions
   ============================================================================
   Utilities for working with mood ratings.
   Separated from MoodCheck.tsx for React Fast Refresh compatibility.
   ============================================================================ */

import type { MoodRating } from '../../types';

/** Mood emoji and label mapping */
export const MOOD_OPTIONS: { rating: MoodRating; emoji: string; label: string }[] = [
  { rating: 1, emoji: '😔', label: 'Very low' },
  { rating: 2, emoji: '😕', label: 'Low' },
  { rating: 3, emoji: '😐', label: 'Neutral' },
  { rating: 4, emoji: '🙂', label: 'Good' },
  { rating: 5, emoji: '😊', label: 'Great' },
];

/**
 * Get mood label for a given rating
 */
export function getMoodLabel(rating: MoodRating): string {
  return MOOD_OPTIONS.find((m) => m.rating === rating)?.label ?? 'Unknown';
}

/**
 * Get mood emoji for a given rating
 */
export function getMoodEmoji(rating: MoodRating): string {
  return MOOD_OPTIONS.find((m) => m.rating === rating)?.emoji ?? '😐';
}
