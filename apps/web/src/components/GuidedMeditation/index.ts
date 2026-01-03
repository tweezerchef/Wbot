/* ============================================================================
   GuidedMeditation Component Exports
   ============================================================================ */

export { GuidedMeditation } from './GuidedMeditation';
export { MeditationPlayer } from './MeditationPlayer';
export { useMeditationAudio } from './useMeditationAudio';

// Types
export type {
  GuidedMeditationProps,
  MeditationActivityData,
  MeditationAudioSettings,
  MeditationPlaybackState,
  MeditationPlayerProps,
  MeditationSessionData,
  MeditationState,
  MeditationTrack,
  MeditationType,
} from './types';

// Track utilities
export {
  getAvailableTrackIds,
  getMeditationTrack,
  getTracksByType,
  getTracksForUseCase,
  MEDITATION_TRACKS,
  UCLA_ATTRIBUTION,
} from './techniques';
