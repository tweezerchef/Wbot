/**
 * ImmersiveBreathing Types
 *
 * Type definitions for the full-screen immersive breathing experience.
 * Re-exports existing types from BreathingExercise and adds new types
 * specific to the immersive overlay context.
 */

// Import types for local use
import type {
  BreathingPhase as BreathingPhaseType,
  BreathingTechnique as BreathingTechniqueType,
} from '@/components/BreathingExercise/types';

// Re-export existing types for convenience
export type {
  BreathingPhase,
  BreathingTechnique,
  BreathingExerciseState,
  BreathingActivityData,
  BreathingAudioSettings,
} from '@/components/BreathingExercise/types';

export {
  PHASE_LABELS,
  PHASE_TIMING_FUNCTIONS,
  BREATHING_TECHNIQUES,
} from '@/components/BreathingExercise/types';

/** Statistics from a completed breathing session */
export interface BreathingStats {
  /** Technique used */
  techniqueName: string;
  /** Technique ID */
  techniqueId: string;
  /** Number of cycles completed */
  cyclesCompleted: number;
  /** Total duration in seconds */
  totalDuration: number;
  /** Whether the exercise was completed fully or stopped early */
  completedFully: boolean;
  /** Optional user mood rating before (1-5) */
  moodBefore?: number;
  /** Optional user mood rating after (1-5) */
  moodAfter?: number;
}

/** Props for the ImmersiveBreathing component */
export interface ImmersiveBreathingProps {
  /** Breathing technique configuration */
  technique: BreathingTechniqueType;
  /** Optional introduction text from the AI */
  introduction?: string;
  /** Callback when the exercise completes */
  onComplete: (stats: BreathingStats) => void;
  /** Callback when user exits early */
  onExit: () => void;
  /** Whether audio is enabled by default */
  audioEnabled?: boolean;
  /** User's mood before starting (from confirmation screen) */
  moodBefore?: number;
  /** Skip intro screen and start exercise immediately (when coming from confirmation flow) */
  autoStart?: boolean;
}

/** Props for BreathingBackground component */
export interface BreathingBackgroundProps {
  /** Current breathing phase for color theming */
  phase: BreathingPhaseType;
  /** Whether animation is active */
  isActive: boolean;
}

/** Props for BreathingCircle component */
export interface BreathingCircleProps {
  /** Current breathing phase */
  phase: BreathingPhaseType;
  /** Progress through current phase (0-1) */
  progress: number;
  /** Duration of current phase in seconds */
  duration: number;
  /** Whether the exercise is active */
  isActive: boolean;
  /** Seconds remaining in current phase */
  timeRemaining: number;
}

/** Props for BreathingControls component */
export interface BreathingControlsProps {
  /** Whether the exercise is paused */
  isPaused: boolean;
  /** Pause callback */
  onPause: () => void;
  /** Resume callback */
  onResume: () => void;
  /** Stop callback */
  onStop: () => void;
  /** Whether audio is enabled */
  audioEnabled: boolean;
  /** Toggle audio callback */
  onToggleAudio: () => void;
}

/** Props for BreathingProgress component */
export interface BreathingProgressProps {
  /** Current cycle number (1-based) */
  currentCycle: number;
  /** Total cycles to complete */
  totalCycles: number;
}

/** Internal state for ImmersiveBreathing component */
export type ImmersiveBreathingState =
  | 'intro' // Showing introduction and technique info
  | 'active' // Exercise in progress
  | 'paused' // Exercise paused
  | 'complete'; // Exercise finished, showing celebration

/** Props for ImmersiveBreathingConfirmation (HITL) component */
export interface ImmersiveBreathingConfirmationProps {
  /** The technique proposed by the AI */
  proposedTechnique: BreathingTechniqueType;
  /** Message from the AI explaining the recommendation */
  message: string;
  /** All available techniques for selection */
  availableTechniques: BreathingTechniqueType[];
  /** Callback when user confirms with selected technique and optional mood */
  onConfirm: (technique: BreathingTechniqueType, moodBefore?: number) => void;
  /** Callback when user declines */
  onDecline: () => void;
  /** Whether to show mood check before starting */
  showMoodCheck?: boolean;
}
