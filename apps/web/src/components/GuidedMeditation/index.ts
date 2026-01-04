/* ============================================================================
   GuidedMeditation Component Exports
   ============================================================================ */

// Main components
export { GuidedMeditation } from './GuidedMeditation';
export { MeditationPlayer } from './MeditationPlayer';
export { MeditationVisual } from './MeditationVisual';
export { MoodCheck } from './MoodCheck';
export { MeditationStreakBadge } from './MeditationStreakBadge';
export { TimerMeditation } from './TimerMeditation';
export { getMoodLabel, getMoodEmoji, MOOD_OPTIONS } from './moodHelpers';

// Hooks
export { useMeditationAudio } from './useMeditationAudio';
export { useAmbientMixer } from './useAmbientMixer';
export { useBinauralBeats } from './useBinauralBeats';

// Types
export type {
  AmbientSoundType,
  GuidedMeditationProps,
  MeditationActivityData,
  MeditationAudioSettings,
  MeditationPlaybackState,
  MeditationPlayerProps,
  MeditationSessionData,
  MeditationState,
  MeditationTrack,
  MeditationType,
  MoodRating,
} from './types';

export type { AmbientMixerSettings, UseAmbientMixerReturn } from './useAmbientMixer';
export type { MeditationStreakBadgeProps } from './MeditationStreakBadge';
export type { TimerMeditationProps } from './TimerMeditation';
export type { BinauralFrequency, UseBinauralBeatsReturn } from './useBinauralBeats';

// Track utilities
export {
  getAllTracks,
  getAvailableTrackIds,
  getMeditationTrack,
  getTracksByDuration,
  getTracksByLanguage,
  getTracksByType,
  getTracksForUseCase,
  MEDITATION_TRACKS,
  UCLA_ATTRIBUTION,
} from './techniques';
