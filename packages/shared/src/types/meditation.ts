/**
 * Shared types for guided meditation sessions
 *
 * These types are used across frontend and backend for type-safe
 * meditation track and session data handling.
 */

/**
 * Types of guided meditation available
 */
export type MeditationType =
  | 'body_scan'
  | 'loving_kindness'
  | 'breathing_focus'
  | 'sleep'
  | 'anxiety_relief'
  | 'daily_mindfulness';

/**
 * Duration presets for meditation tracks
 */
export type MeditationDuration = 'short' | 'medium' | 'long';

/**
 * A guided meditation track configuration
 */
export interface MeditationTrack {
  /** Unique identifier for the track */
  id: string;
  /** Display name of the meditation */
  name: string;
  /** Type/category of meditation */
  type: MeditationType;
  /** Duration in seconds */
  durationSeconds: number;
  /** Duration preset (short/medium/long) */
  durationPreset: MeditationDuration;
  /** Description of the meditation and its benefits */
  description: string;
  /** URL to the audio file */
  audioUrl: string;
  /** Instructor/narrator name */
  narrator?: string;
  /** Language code (e.g., 'en', 'es', 'zh') */
  language: string;
  /** Use cases this meditation is good for */
  bestFor: string[];
  /** Attribution text for CC-licensed content */
  attribution?: string;
}

/**
 * Session data for completed meditation sessions
 */
export interface MeditationSessionData {
  /** ID of the track that was played */
  trackId: string;
  /** Duration actually listened (seconds) */
  listenedDuration: number;
  /** Total duration of the track (seconds) */
  totalDuration: number;
  /** Whether the meditation was completed to the end */
  completedFully: boolean;
  /** If stopped early, percentage through the track */
  stoppedAtPercent?: number;
  /** Optional user mood rating before (1-5) */
  moodBefore?: number;
  /** Optional user mood rating after (1-5) */
  moodAfter?: number;
}

/**
 * Duration thresholds for categorizing tracks
 */
export const DURATION_THRESHOLDS = {
  /** Short: up to 5 minutes */
  short: 300,
  /** Medium: 5-15 minutes */
  medium: 900,
  /** Long: 15+ minutes */
  long: Infinity,
} as const;

/**
 * Helper to determine duration preset from seconds
 */
export function getDurationPreset(seconds: number): MeditationDuration {
  if (seconds <= DURATION_THRESHOLDS.short) {
    return 'short';
  }
  if (seconds <= DURATION_THRESHOLDS.medium) {
    return 'medium';
  }
  return 'long';
}

/**
 * Human-readable labels for meditation types
 */
export const MEDITATION_TYPE_LABELS: Record<MeditationType, string> = {
  body_scan: 'Body Scan',
  loving_kindness: 'Loving Kindness',
  breathing_focus: 'Breathing Focus',
  sleep: 'Sleep',
  anxiety_relief: 'Anxiety Relief',
  daily_mindfulness: 'Daily Mindfulness',
};

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${String(minutes)} min`;
  }
  return `${String(minutes)}:${remainingSeconds.toString().padStart(2, '0')}`;
}
