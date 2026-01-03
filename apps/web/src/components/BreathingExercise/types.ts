/* ============================================================================
   Breathing Exercise Types
   ============================================================================
   Type definitions for the interactive breathing exercise component.
   These types define the structure for techniques, phases, and exercise state.
   ============================================================================ */

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
