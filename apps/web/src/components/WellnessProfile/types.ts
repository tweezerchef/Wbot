/* ============================================================================
   WellnessProfile Types
   ============================================================================
   Type definitions for the wellness profile component.
   ============================================================================ */

import type { Tables } from '@wbot/shared';

/** User wellness profile from database */
export type WellnessProfile = Tables<'user_wellness_profiles'>;

/** Activity effectiveness record from database */
export type ActivityEffectiveness = Tables<'activity_effectiveness'>;

/** Emotional snapshot from database */
export type EmotionalSnapshot = Tables<'emotional_snapshots'>;

/** Formatted wellness stats for display */
export interface WellnessStats {
  /** Total conversations */
  totalConversations: number;
  /** Total activities completed */
  totalActivitiesCompleted: number;
  /** Total engagement time in minutes */
  totalEngagementMinutes: number;
  /** Current emotional baseline */
  emotionalBaseline: string;
  /** First interaction date */
  firstInteractionAt: Date | null;
  /** Days since first interaction */
  daysActive: number;
}

/** Props for the WellnessProfile component */
export interface WellnessProfileProps {
  /** User ID to fetch profile for */
  userId?: string;
  /** Optional callback when profile loads */
  onLoaded?: (profile: WellnessProfile | null) => void;
  /** Whether to show loading state */
  showLoading?: boolean;
  /** Compact mode for sidebar display */
  compact?: boolean;
}

/** Emotional baseline labels for display */
export const EMOTIONAL_BASELINE_LABELS: Record<string, string> = {
  very_positive: 'Very Positive',
  positive: 'Positive',
  neutral: 'Neutral',
  stressed: 'Stressed',
  anxious: 'Anxious',
  struggling: 'Struggling',
};

/** Emotional baseline colors */
export const EMOTIONAL_BASELINE_COLORS: Record<string, string> = {
  very_positive: '#22c55e',
  positive: '#84cc16',
  neutral: '#6b7280',
  stressed: '#f59e0b',
  anxious: '#ef4444',
  struggling: '#dc2626',
};

/** Get display label for emotional baseline */
export function getBaselineLabel(baseline: string | null): string {
  if (!baseline) {
    return 'Not yet determined';
  }
  return EMOTIONAL_BASELINE_LABELS[baseline] ?? baseline;
}

/** Get color for emotional baseline */
export function getBaselineColor(baseline: string | null): string {
  if (!baseline) {
    return '#6b7280';
  }
  return EMOTIONAL_BASELINE_COLORS[baseline] ?? '#6b7280';
}
