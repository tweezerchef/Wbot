/* ============================================================================
   Wellness Feature
   ============================================================================
   Main entry point for the wellness feature.
   Re-exports components, hooks, and types.
   ============================================================================ */

// Components
export {
  WellnessProfile,
  MoodCheck,
  getBaselineLabel,
  getBaselineColor,
  EMOTIONAL_BASELINE_LABELS,
  EMOTIONAL_BASELINE_COLORS,
} from './components';

// Types
export type {
  WellnessProfileProps,
  WellnessStats,
  MoodCheckProps,
  MoodRating,
  WellnessProfile as WellnessProfileData,
  ActivityEffectiveness,
  EmotionalSnapshot,
} from './types';

// Also export types directly from components for backwards compatibility
export type { WellnessProfileProps as WellnessProfileComponentProps } from './components/WellnessProfile';
export type { MoodCheckProps as MoodCheckComponentProps } from './components/MoodCheck';
