/**
 * Shared types for breathing exercise sessions
 *
 * These types are used across frontend and backend for type-safe
 * session data handling.
 */

/**
 * Round data for a single Wim Hof round
 */
export interface WimHofRoundData {
  /** Round number (1-based) */
  round: number;
  /** Number of breaths completed (usually 30) */
  breathCount: number;
  /** Breath retention duration in seconds */
  retentionSeconds: number;
  /** Whether the inhale hold was completed */
  inhaleHoldCompleted: boolean;
}

/**
 * Session data for Wim Hof Method exercises
 */
export interface WimHofSessionData {
  /** Array of round data */
  rounds: WimHofRoundData[];
  /** Average retention time across all rounds */
  averageRetention: number;
  /** Best (longest) retention time */
  bestRetention: number;
  /** Total session duration in seconds */
  totalDuration?: number;
  /** Whether all rounds were completed */
  completedAllRounds: boolean;
  /** Whether the session was stopped early */
  stoppedEarly?: boolean;
  /** If stopped early, which phase */
  stoppedAt?: {
    round: number;
    phase: 'rapid_breathing' | 'retention' | 'recovery_inhale' | 'recovery_pause';
  };
}

/**
 * Session data for continuous breathing exercises
 */
export interface ContinuousSessionData {
  /** Number of cycles completed */
  cyclesCompleted: number;
  /** Total number of cycles intended */
  totalCycles: number;
  /** Technique ID (box, 4-7-8, etc.) */
  techniqueId: string;
  /** Total session duration in seconds */
  totalDuration?: number;
  /** Whether session was completed fully */
  completedFully: boolean;
  /** Optional user mood rating before (1-5) */
  moodBefore?: number;
  /** Optional user mood rating after (1-5) */
  moodAfter?: number;
}

/**
 * Union type for all breathing session data
 */
export type BreathingSessionData = WimHofSessionData | ContinuousSessionData;

/**
 * Type guard to check if session data is Wim Hof
 */
export function isWimHofSessionData(data: BreathingSessionData): data is WimHofSessionData {
  return 'rounds' in data && Array.isArray(data.rounds);
}

/**
 * Type guard to check if session data is continuous breathing
 */
export function isContinuousSessionData(data: BreathingSessionData): data is ContinuousSessionData {
  return 'cyclesCompleted' in data && !('rounds' in data);
}
