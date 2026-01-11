/* ============================================================================
   Navigation Feature Types
   ============================================================================
   Type definitions for the navigation feature including direct component access.
   ============================================================================ */

/**
 * Represents a component that can be accessed directly from the sidebar.
 * These components render immediately - backend integration for tracking/state
 * will be added in a future iteration.
 */
export type DirectComponent =
  | { type: 'breathing'; variant: 'box' | 'relaxing_478' | 'coherent' | 'deep_calm' | 'wimhof' }
  | { type: 'meditation'; variant: 'timer' | 'guided' | 'library' }
  | { type: 'wellness'; variant: 'profile' | 'moodcheck' }
  | { type: 'gamification'; variant: 'badges' | 'streak' | 'goals' };

/**
 * Extract the variant type for a specific component type
 */
export type BreathingVariant = Extract<DirectComponent, { type: 'breathing' }>['variant'];
export type MeditationVariant = Extract<DirectComponent, { type: 'meditation' }>['variant'];
export type WellnessVariant = Extract<DirectComponent, { type: 'wellness' }>['variant'];
export type GamificationVariant = Extract<DirectComponent, { type: 'gamification' }>['variant'];
