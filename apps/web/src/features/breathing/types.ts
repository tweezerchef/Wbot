/* ============================================================================
   Breathing Feature Types
   ============================================================================
   Consolidated type definitions for the breathing feature.
   Includes types for techniques, phases, exercise state, and components.
   ============================================================================ */

// Re-export MoodRating from shared types
export type { MoodRating } from '@wbot/shared';

/* ----------------------------------------------------------------------------
   Core Breathing Types
   ---------------------------------------------------------------------------- */

/** The four phases of a breathing cycle */
export type BreathingPhase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

/** Human-readable labels for each phase */
export const PHASE_LABELS: Record<BreathingPhase, string> = {
  inhale: 'Breathe In',
  holdIn: 'Hold',
  exhale: 'Breathe Out',
  holdOut: 'Hold',
};

/** CSS timing functions for natural breathing animation curves */
export const PHASE_TIMING_FUNCTIONS: Record<BreathingPhase, string> = {
  inhale: 'cubic-bezier(0.4, 0, 0.2, 1)', // Gentle start, strong finish
  holdIn: 'linear', // Steady
  exhale: 'cubic-bezier(0.0, 0, 0.2, 1)', // Quick release, gentle end
  holdOut: 'linear', // Steady
};

/** Configuration for a breathing technique */
export interface BreathingTechnique {
  /** Unique identifier for the technique */
  id: string;
  /** Display name */
  name: string;
  /** Duration for each phase in seconds: [inhale, holdIn, exhale, holdOut] */
  durations: [number, number, number, number];
  /** Brief description of the technique and its benefits */
  description: string;
  /** Recommended number of cycles to complete */
  cycles: number;
}

/** Available breathing techniques */
export const BREATHING_TECHNIQUES: Record<string, BreathingTechnique> = {
  box: {
    id: 'box',
    name: 'Box Breathing',
    durations: [4, 4, 4, 4],
    description: 'Equal 4-second cycles for stress relief and improved focus',
    cycles: 4,
  },
  relaxing_478: {
    id: 'relaxing_478',
    name: '4-7-8 Relaxing Breath',
    durations: [4, 7, 8, 0],
    description: 'Calming breath pattern for anxiety relief and better sleep',
    cycles: 4,
  },
  coherent: {
    id: 'coherent',
    name: 'Coherent Breathing',
    durations: [6, 0, 6, 0],
    description: 'Balanced breathing for heart rate variability and calm',
    cycles: 6,
  },
  deep_calm: {
    id: 'deep_calm',
    name: 'Deep Calm',
    durations: [5, 2, 7, 2],
    description: 'Extended exhale pattern for deep relaxation',
    cycles: 5,
  },
};

/* ----------------------------------------------------------------------------
   Exercise State Types
   ---------------------------------------------------------------------------- */

/** Current state of a breathing exercise session */
export interface BreathingExerciseState {
  /** Whether the exercise is currently running */
  isActive: boolean;
  /** Whether the exercise is paused */
  isPaused: boolean;
  /** Current phase of the breathing cycle */
  currentPhase: BreathingPhase;
  /** Index of the current phase (0-3) */
  phaseIndex: number;
  /** Seconds remaining in the current phase */
  phaseTimeRemaining: number;
  /** Total seconds for the current phase */
  phaseTotalTime: number;
  /** Current cycle number (1-based) */
  currentCycle: number;
  /** Total number of cycles to complete */
  totalCycles: number;
  /** Whether the exercise has completed */
  isComplete: boolean;
}

/** Activity data parsed from AI message content */
export interface BreathingActivityData {
  type: 'activity';
  activity: 'breathing';
  status: 'ready' | 'in_progress' | 'complete';
  technique: BreathingTechnique;
  introduction: string;
}

/** Audio settings for the breathing exercise */
export interface BreathingAudioSettings {
  /** Enable/disable audio */
  enabled: boolean;
  /** Volume level (0-1) */
  volume: number;
  /** Type of ambient sound */
  ambientSound: 'ocean' | 'rain' | 'forest' | 'none';
  /** Enable phase transition chimes */
  enableChimes: boolean;
}

/* ----------------------------------------------------------------------------
   Component Props Types
   ---------------------------------------------------------------------------- */

/** Props for the main BreathingExercise component */
export interface BreathingExerciseProps {
  /** The technique configuration to use */
  technique: BreathingTechnique;
  /** Optional introduction text from the AI */
  introduction?: string;
  /** Callback when the exercise completes */
  onComplete?: () => void;
  /** Callback when user stops the exercise early */
  onStop?: () => void;
  /** Whether to enable audio (ocean waves, etc.) */
  enableAudio?: boolean;
}

/** Props for the BreathingAnimation component */
export interface BreathingAnimationProps {
  /** Current phase of the breathing cycle */
  phase: BreathingPhase;
  /** Progress through the current phase (0-1) */
  progress: number;
  /** Duration of the current phase in seconds */
  duration: number;
  /** Whether the exercise is active */
  isActive: boolean;
}

/* ----------------------------------------------------------------------------
   Immersive Breathing Types
   ---------------------------------------------------------------------------- */

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
  technique: BreathingTechnique;
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
  phase: BreathingPhase;
  /** Whether animation is active */
  isActive: boolean;
}

/** Props for BreathingCircle component */
export interface BreathingCircleProps {
  /** Current breathing phase */
  phase: BreathingPhase;
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
  proposedTechnique: BreathingTechnique;
  /** Message from the AI explaining the recommendation */
  message: string;
  /** All available techniques for selection */
  availableTechniques: BreathingTechnique[];
  /** Callback when user confirms with selected technique and optional mood */
  onConfirm: (technique: BreathingTechnique, moodBefore?: number) => void;
  /** Callback when user declines */
  onDecline: () => void;
  /** Whether to show mood check before starting */
  showMoodCheck?: boolean;
}

/* ----------------------------------------------------------------------------
   Wim Hof Types
   ---------------------------------------------------------------------------- */

/**
 * Phases within each Wim Hof round
 */
export type WimHofPhase =
  | 'rapid_breathing' // Fast in/out breaths with counter
  | 'retention' // Holding breath (exhale and hold)
  | 'recovery_inhale' // Deep inhale and 15s hold
  | 'recovery_pause'; // Rest between rounds

/**
 * Wim Hof technique configuration
 * NOTE: Uses snake_case to match AI backend response format
 */
export interface WimHofTechnique {
  id: 'wim_hof';
  name: string;
  type: 'wim_hof';
  description: string;
  best_for: string[];
  rounds: number;
  breaths_per_round: number;
  breath_tempo_ms: number;
  retention_target_seconds: number;
  recovery_pause_seconds: number;
  inhale_hold_seconds: number;
}

/** Props for WimHofExercise component */
export interface WimHofExerciseProps {
  technique: WimHofTechnique;
  introduction?: string;
  isFirstTime?: boolean;
  onComplete?: (stats: CompletionStats) => void;
  onStop?: () => void;
}

/** Completion statistics for Wim Hof exercise */
export interface CompletionStats {
  roundRetentions: number[];
  totalDuration: number;
  averageRetention: number;
  bestRetention: number;
}

/* ----------------------------------------------------------------------------
   Session Tracking Types
   ---------------------------------------------------------------------------- */

/** Parameters for starting a new breathing session */
export interface StartSessionParams {
  techniqueId: string;
  techniqueName: string;
  techniqueType: 'continuous' | 'wim_hof';
  conversationId?: string;
  moodBefore?: string;
}

/** Parameters for completing a breathing session */
export interface CompleteSessionParams {
  sessionId: string;
  sessionData: unknown; // WimHofSessionData or ContinuousSessionData
  moodAfter?: string;
}
