/* ============================================================================
   Meditation Feature Types
   ============================================================================
   Consolidated type definitions for the meditation feature.
   These types are used across components, hooks, and the feature API.
   ============================================================================ */

import type {
  MeditationSessionData,
  MeditationTrack,
  MeditationType,
  MoodRating,
} from '@wbot/shared';

// Re-export shared types for convenience
export type { MeditationSessionData, MeditationTrack, MeditationType, MoodRating };

// =============================================================================
// Core Meditation Types
// =============================================================================

/** Available ambient sound types for meditation */
export type AmbientSoundType = 'none' | 'ocean' | 'rain' | 'forest';

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

// =============================================================================
// Personalized/TTS Meditation Types
// =============================================================================

/** A personalized meditation script with placeholders */
export interface PersonalizedScript {
  /** Unique identifier */
  id: string;
  /** Display name */
  title: string;
  /** Type/category */
  type: MeditationType;
  /** Estimated duration in seconds */
  durationEstimateSeconds: number;
  /** Raw script content with placeholders like {{USER_NAME}} */
  scriptContent?: string;
  /** Available placeholders in the script */
  placeholders?: Record<string, string>;
  /** Language code */
  language: string;
}

/** Result of TTS generation */
export interface GeneratedMeditationResult {
  /** Script ID that was generated */
  scriptId: string;
  /** URL to the generated audio file */
  audioUrl: string;
  /** Actual duration of generated audio in seconds */
  durationSeconds: number;
  /** Voice ID used for generation */
  voiceId: string;
  /** Whether this was served from cache */
  cached: boolean;
}

/** Personalization options for TTS meditation */
export interface MeditationPersonalization {
  /** User's name for script placeholders */
  userName?: string;
  /** User's current goal for placeholders */
  userGoal?: string;
}

/** State during TTS generation */
export type TTSGenerationState = 'idle' | 'generating' | 'ready' | 'error';

/** Props for the PersonalizedMeditation component */
export interface PersonalizedMeditationProps {
  /** The script to generate and play */
  script: PersonalizedScript;
  /** Personalization options for the user */
  personalization?: MeditationPersonalization;
  /** Optional introduction text from the AI */
  introduction?: string;
  /** Callback when the meditation completes */
  onComplete?: (sessionData: MeditationSessionData) => void;
  /** Callback when user stops the meditation early */
  onStop?: (sessionData: MeditationSessionData) => void;
  /** Whether to enable ambient background sounds */
  enableAmbient?: boolean;
  /** Pre-generated audio URL (skip generation if provided) */
  preGeneratedAudioUrl?: string;
  /**
   * Auth token for API calls.
   * If provided, skips Supabase session check.
   * Useful for Storybook/testing where Supabase session isn't available.
   */
  authToken?: string;
}

/** Activity data for personalized/TTS meditation */
export interface PersonalizedMeditationActivityData {
  type: 'activity';
  activity: 'meditation_personalized';
  status: 'ready' | 'generating' | 'in_progress' | 'complete';
  script: PersonalizedScript;
  personalization?: MeditationPersonalization;
  introduction: string;
  /** If already generated, the audio URL */
  audioUrl?: string;
}

// =============================================================================
// AI-Generated Meditation Types (Using Claude + ElevenLabs TTS)
// =============================================================================

/** A voice option for AI-generated meditations */
export interface AIMeditationVoice {
  /** Voice ID (key or ElevenLabs ID) */
  id: string;
  /** Display name */
  name: string;
  /** Description of the voice */
  description: string;
  /** Meditation types this voice works best for */
  best_for: string[];
  /** Optional URL to preview the voice */
  preview_url?: string | null;
}

/** Script generated by Claude AI */
export interface AIMeditationScript {
  /** The full script content */
  content: string;
  /** Word count for duration estimation */
  word_count: number;
  /** Estimated duration in seconds (based on speaking pace) */
  estimated_duration_seconds: number;
}

/** Context used during generation (for debugging/replay) */
export interface AIMeditationContext {
  /** Time of day when generated */
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
  /** User's primary intent from their message */
  primary_intent: string;
  /** Number of memories used for personalization */
  memories_used: number;
  /** Detected emotional signals */
  emotional_signals: string[];
}

/** Activity data for AI-generated meditation */
export interface AIGeneratedMeditationActivityData {
  type: 'activity';
  activity: 'meditation_ai_generated';
  status: 'ready' | 'generating' | 'in_progress' | 'complete';
  /** Unique ID for this meditation */
  meditation_id: string;
  /** Generated title */
  title: string;
  /** Type of meditation */
  meditation_type: MeditationType;
  /** Target duration in minutes */
  duration_minutes: number;
  /** The generated script */
  script: AIMeditationScript;
  /** Selected voice */
  voice: AIMeditationVoice;
  /** Context used for generation */
  generation_context: AIMeditationContext;
  /** Introduction text from the AI */
  introduction: string;
  /** Audio URL if already generated */
  audio_url?: string;
}

/** Props for the AIGeneratedMeditation component */
export interface AIGeneratedMeditationProps {
  /** The activity data from parsing */
  activityData: AIGeneratedMeditationActivityData;
  /** Callback when user selects a voice (for HITL response) */
  onVoiceSelected?: (voiceId: string) => void;
  /** Callback when user cancels voice selection */
  onCancel?: () => void;
  /** Callback when the meditation completes */
  onComplete?: (sessionData: MeditationSessionData) => void;
  /** Callback when user stops the meditation early */
  onStop?: (sessionData: MeditationSessionData) => void;
  /** Whether to enable ambient background sounds */
  enableAmbient?: boolean;
  /**
   * Auth token for API calls.
   * If provided, skips Supabase session check.
   */
  authToken?: string;
}

/** State for the streaming audio player */
export type StreamingAudioState =
  | 'idle'
  | 'streaming'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'complete'
  | 'error';

// =============================================================================
// Meditation Series Types
// =============================================================================

export interface MeditationSeries {
  id: string;
  title: string;
  description: string;
  trackIds: string[];
  badgeName: string;
  badgeEmoji: string;
  totalDurationSeconds: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface SeriesProgress {
  seriesId: string;
  completedTrackIds: string[];
  currentTrackIndex: number;
  startedAt: string;
  completedAt: string | null;
  badgeEarned: boolean;
}

export interface UserBadge {
  id: string;
  badgeName: string;
  badgeEmoji: string;
  sourceType: 'series' | 'streak' | 'milestone';
  sourceId: string | null;
  earnedAt: string;
}

// =============================================================================
// Meditation Library Types
// =============================================================================

/** A saved meditation from the user's library */
export interface SavedMeditation {
  id: string;
  title: string;
  meditation_type: MeditationType;
  duration_seconds: number;
  voice_id: string;
  voice_name: string;
  audio_url: string | null;
  status: 'pending' | 'generating' | 'ready' | 'complete' | 'error';
  play_count: number;
  last_played_at: string | null;
  is_favorite: boolean;
  mood_before: number | null;
  mood_after: number | null;
  created_at: string;
  generation_context: {
    time_of_day?: string;
    primary_intent?: string;
    memories_used?: number;
    emotional_signals?: string[];
  };
}

/** Filter options for the meditation library */
export interface MeditationLibraryFilters {
  type?: MeditationType | 'all';
  favoritesOnly?: boolean;
  sortBy?: 'newest' | 'oldest' | 'most_played' | 'last_played';
}

/** Props for the MeditationLibrary component */
export interface MeditationLibraryProps {
  /** Callback when user wants to play a meditation */
  onPlay?: (meditation: SavedMeditation) => void;
  /** Callback when user deletes a meditation */
  onDelete?: (meditation: SavedMeditation) => void;
  /** Initial filters */
  initialFilters?: MeditationLibraryFilters;
  /** Maximum meditations to show (for compact view) */
  maxItems?: number;
  /** Show in compact mode (for sidebar/widget) */
  compact?: boolean;
}

/** Props for the MeditationCard component */
export interface MeditationCardProps {
  meditation: SavedMeditation;
  onPlay: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  compact?: boolean;
}
