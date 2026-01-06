/**
 * ============================================================================
 * Shared Mood Types
 * ============================================================================
 * Standardized mood tracking types used consistently across:
 * - Breathing exercises
 * - Meditation sessions
 * - Emotional snapshots
 * - Activity effectiveness
 *
 * Mood Scale: 1-5 integers
 *   1 = Very low, 2 = Low, 3 = Neutral, 4 = Good, 5 = Great
 * ============================================================================
 */

/**
 * Mood rating on a 1-5 scale.
 * Used for before/after activity tracking and emotional snapshots.
 */
export type MoodRating = 1 | 2 | 3 | 4 | 5;

/**
 * Mood option for UI display with emoji and label.
 */
export interface MoodOption {
  /** Numeric rating (1-5) */
  rating: MoodRating;
  /** Emoji representation */
  emoji: string;
  /** Human-readable label */
  label: string;
}

/**
 * Standard mood options - consistent across all components.
 * Order: worst to best mood.
 */
export const MOOD_OPTIONS: readonly MoodOption[] = [
  { rating: 1, emoji: '😔', label: 'Very low' },
  { rating: 2, emoji: '😕', label: 'Low' },
  { rating: 3, emoji: '😐', label: 'Neutral' },
  { rating: 4, emoji: '🙂', label: 'Good' },
  { rating: 5, emoji: '😊', label: 'Great' },
] as const;

/**
 * Get mood label for a given rating.
 *
 * @param rating - Mood rating (1-5)
 * @returns Human-readable label
 *
 * @example
 * getMoodLabel(3) // "Neutral"
 */
export function getMoodLabel(rating: MoodRating): string {
  return MOOD_OPTIONS.find((m) => m.rating === rating)?.label ?? 'Unknown';
}

/**
 * Get mood emoji for a given rating.
 *
 * @param rating - Mood rating (1-5)
 * @returns Emoji representation
 *
 * @example
 * getMoodEmoji(5) // "😊"
 */
export function getMoodEmoji(rating: MoodRating): string {
  return MOOD_OPTIONS.find((m) => m.rating === rating)?.emoji ?? '😐';
}

/**
 * Calculate mood change between before and after ratings.
 *
 * @param before - Mood rating before activity
 * @param after - Mood rating after activity
 * @returns Change value (-4 to +4)
 *
 * @example
 * calculateMoodChange(2, 4) // 2 (improved)
 * calculateMoodChange(4, 2) // -2 (declined)
 */
export function calculateMoodChange(before: MoodRating, after: MoodRating): number {
  return after - before;
}

/**
 * Describe mood change in human-readable terms.
 *
 * @param before - Mood rating before activity
 * @param after - Mood rating after activity
 * @returns Description of change
 *
 * @example
 * describeMoodChange(2, 4) // "improved"
 * describeMoodChange(4, 4) // "stayed the same"
 */
export function describeMoodChange(before: MoodRating, after: MoodRating): string {
  const change = calculateMoodChange(before, after);
  if (change > 0) {
    return 'improved';
  }
  if (change < 0) {
    return 'declined';
  }
  return 'stayed the same';
}

/**
 * Get a mood change summary with emoji indicator.
 *
 * @param before - Mood rating before activity
 * @param after - Mood rating after activity
 * @returns Object with change value, direction, and emoji
 *
 * @example
 * getMoodChangeSummary(2, 4) // { change: 2, direction: "improved", emoji: "📈" }
 */
export function getMoodChangeSummary(
  before: MoodRating,
  after: MoodRating
): { change: number; direction: string; emoji: string } {
  const change = calculateMoodChange(before, after);
  if (change > 0) {
    return { change, direction: 'improved', emoji: '📈' };
  }
  if (change < 0) {
    return { change, direction: 'declined', emoji: '📉' };
  }
  return { change: 0, direction: 'stayed the same', emoji: '➡️' };
}

/**
 * Type guard to check if a value is a valid MoodRating.
 *
 * @param value - Value to check
 * @returns True if value is a valid MoodRating (1-5)
 */
export function isMoodRating(value: unknown): value is MoodRating {
  return typeof value === 'number' && value >= 1 && value <= 5 && Number.isInteger(value);
}
