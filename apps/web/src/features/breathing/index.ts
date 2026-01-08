/**
 * Breathing Feature
 *
 * Complete breathing exercise feature including components, hooks, and types.
 *
 * @example
 * ```tsx
 * import { BreathingExercise, useBreathingLoop, BREATHING_TECHNIQUES } from '@/features/breathing';
 *
 * function MyComponent() {
 *   const technique = BREATHING_TECHNIQUES.box;
 *   return <BreathingExercise technique={technique} />;
 * }
 * ```
 */

// Components
export {
  BreathingExercise,
  BreathingAnimation,
  BreathingConfirmation,
  ImmersiveBreathing,
  ImmersiveBreathingConfirmation,
  BreathingBackground,
  BreathingCircle,
  BreathingControls,
  BreathingProgress,
  WimHofExercise,
} from './components';

// Hooks
export {
  useBreathingLoop,
  useBreathingAudio,
  useWimHofLoop,
  useHapticFeedback,
  useBreathingSession,
  formatWimHofSessionData,
} from './hooks';

// Types
export type {
  BreathingPhase,
  BreathingTechnique,
  BreathingExerciseState,
  BreathingActivityData,
  BreathingAudioSettings,
  BreathingExerciseProps,
  BreathingAnimationProps,
  BreathingStats,
  ImmersiveBreathingProps,
  ImmersiveBreathingState,
  ImmersiveBreathingConfirmationProps,
  BreathingBackgroundProps,
  BreathingCircleProps,
  BreathingControlsProps,
  BreathingProgressProps,
  WimHofPhase,
  WimHofTechnique,
  WimHofExerciseProps,
  CompletionStats,
  StartSessionParams,
  CompleteSessionParams,
} from './types';

// Constants
export { BREATHING_TECHNIQUES, PHASE_LABELS, PHASE_TIMING_FUNCTIONS } from './types';

// Re-export hook state types
export type { WimHofState } from './hooks';
