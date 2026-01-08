/**
 * Breathing Feature Hooks
 *
 * Centralized exports for all breathing-related hooks.
 */

export { useBreathingLoop } from './useBreathingLoop';
export { useBreathingAudio } from './useBreathingAudio';
export { useWimHofLoop } from './useWimHofLoop';
export { useHapticFeedback } from './useHapticFeedback';
export { useBreathingSession, formatWimHofSessionData } from './useBreathingSession';

// Re-export types from hooks
export type { WimHofState } from './useWimHofLoop';
