/* ============================================================================
   GuidedMeditation Component Exports
   ============================================================================ */

// Main components
export { GuidedMeditation } from './GuidedMeditation';
export { MeditationPlayer } from './MeditationPlayer';
export { MeditationVisual } from './MeditationVisual';
export { MoodCheck } from './MoodCheck';
export { getMoodLabel, getMoodEmoji, MOOD_OPTIONS } from './moodHelpers';

// Hooks
export { useMeditationAudio } from './useMeditationAudio';
export { useAmbientMixer } from './useAmbientMixer';

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
