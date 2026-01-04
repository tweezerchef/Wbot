// Main components
export { ImmersiveBreathing } from './ImmersiveBreathing';
export { ImmersiveBreathingConfirmation } from './ImmersiveBreathingConfirmation';

// Sub-components
export { BreathingBackground } from './BreathingBackground';
export { BreathingCircle } from './BreathingCircle';
export { BreathingControls } from './BreathingControls';
export { BreathingProgress } from './BreathingProgress';

// Hooks
export { useHapticFeedback } from './hooks/useHapticFeedback';

// Types
export type {
  BreathingStats,
  ImmersiveBreathingProps,
  BreathingBackgroundProps,
  BreathingCircleProps,
  BreathingControlsProps,
  BreathingProgressProps,
  ImmersiveBreathingState,
  ImmersiveBreathingConfirmationProps,
} from './types';

// Re-export common types from BreathingExercise
export type {
  BreathingPhase,
  BreathingTechnique,
  BreathingExerciseState,
  BreathingActivityData,
  BreathingAudioSettings,
} from './types';

export { PHASE_LABELS, PHASE_TIMING_FUNCTIONS, BREATHING_TECHNIQUES } from './types';
