/* ============================================================================
   Guided Meditation Types
   ============================================================================
   Type definitions for the guided meditation component.
   These types define the structure for tracks, playback state, and props.
   ============================================================================ */

import type { MeditationSessionData, MeditationTrack, MeditationType } from '@wbot/shared';

// Re-export shared types for convenience
export type { MeditationSessionData, MeditationTrack, MeditationType };

/** Available ambient sound types for meditation */
export type AmbientSoundType = 'none' | 'ocean' | 'rain' | 'forest';

/** Mood rating scale (1-5) */
export type MoodRating = 1 | 2 | 3 | 4 | 5;

/** Playback state of the meditation */
export type MeditationPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'complete';

/** Current state of a meditation session */
export interface MeditationState {
  /** Current playback state */
  playbackState: MeditationPlaybackState;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration of the track in seconds */
  duration: number;
  /** Progress as a percentage (0-100) */
  progress: number;
  /** Whether audio is currently loading */
  isLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
}

/** Props for the main GuidedMeditation component */
export interface GuidedMeditationProps {
  /** The meditation track to play */
  track: MeditationTrack;
  /** Optional introduction text from the AI */
  introduction?: string;
  /** Callback when the meditation completes */
  onComplete?: (sessionData: MeditationSessionData) => void;
  /** Callback when user stops the meditation early */
  onStop?: (sessionData: MeditationSessionData) => void;
  /** Whether to enable ambient background sounds */
  enableAmbient?: boolean;
}

/** Props for the MeditationPlayer component */
export interface MeditationPlayerProps {
  /** Current playback state */
  state: MeditationState;
  /** Track being played */
  track: MeditationTrack;
  /** Play the audio */
  onPlay: () => void;
  /** Pause the audio */
  onPause: () => void;
  /** Stop and reset */
  onStop: () => void;
  /** Seek to position (0-1) */
  onSeek: (position: number) => void;
  /** Current volume (0-1) */
  volume: number;
  /** Set volume */
  onVolumeChange: (volume: number) => void;
  /** Ambient sound controls (optional) */
  ambientControls?: {
    /** Current ambient sound type */
    sound: AmbientSoundType;
    /** Ambient volume (0-1) */
    volume: number;
    /** Whether ambient is playing */
    isPlaying: boolean;
    /** Change ambient sound */
    onSoundChange: (sound: AmbientSoundType) => void;
    /** Change ambient volume */
    onVolumeChange: (volume: number) => void;
  };
}

/** Audio settings for meditation playback */
export interface MeditationAudioSettings {
  /** Enable/disable audio */
  enabled: boolean;
  /** Main audio volume (0-1) */
  volume: number;
  /** Enable ambient background sounds */
  enableAmbient: boolean;
  /** Ambient sound type */
  ambientSound: 'none' | 'ocean' | 'rain' | 'forest' | 'white_noise';
  /** Ambient sound volume (0-1) */
  ambientVolume: number;
}

/** Activity data parsed from AI message content */
export interface MeditationActivityData {
  type: 'activity';
  activity: 'meditation';
  status: 'ready' | 'in_progress' | 'complete';
  track: MeditationTrack;
  introduction: string;
}
