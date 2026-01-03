/* ============================================================================
   BreathingExercise Module Exports
   ============================================================================ */

// Main component
export { BreathingExercise } from './BreathingExercise';

// Sub-components
export { BreathingAnimation } from './BreathingAnimation';

// Hooks
export { useBreathingLoop } from './useBreathingLoop';
export { useBreathingAudio } from './useBreathingAudio';

// Types
export type {
  BreathingPhase,
  BreathingTechnique,
  BreathingExerciseState,
  BreathingExerciseProps,
  BreathingAnimationProps,
  BreathingActivityData,
  BreathingAudioSettings,
} from './types';

// Constants
export { PHASE_LABELS, PHASE_TIMING_FUNCTIONS, BREATHING_TECHNIQUES } from './types';
