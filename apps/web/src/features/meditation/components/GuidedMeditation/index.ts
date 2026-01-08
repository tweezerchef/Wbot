/* ============================================================================
   GuidedMeditation Component Exports
   ============================================================================ */

// Main components
export { AIGeneratedMeditation } from './AIGeneratedMeditation';
export { GuidedMeditation } from './GuidedMeditation';
export { PersonalizedMeditation } from './PersonalizedMeditation';
export { MeditationPlayer } from './MeditationPlayer';
export { MeditationVisual } from './MeditationVisual';
export { MeditationStreakBadge } from './MeditationStreakBadge';
export { TimerMeditation } from './TimerMeditation';
export { VoiceSelector } from './VoiceSelector';

// Re-export MoodCheck from shared component location
export { MoodCheck } from '@/features/wellness';
// Re-export mood helpers from shared package
export { getMoodLabel, getMoodEmoji, MOOD_OPTIONS } from '@wbot/shared';

// Re-export hooks from feature hooks
export {
  useMeditationAudio,
  useAmbientMixer,
  useBinauralBeats,
  useTTSGeneration,
} from '../../hooks';

// Re-export types from feature types
export type {
  AIGeneratedMeditationActivityData,
  AIGeneratedMeditationProps,
  AIMeditationContext,
  AIMeditationScript,
  AIMeditationVoice,
  AmbientSoundType,
  GeneratedMeditationResult,
  GuidedMeditationProps,
  MeditationActivityData,
  MeditationAudioSettings,
  MeditationPersonalization,
  MeditationPlaybackState,
  MeditationPlayerProps,
  MeditationSessionData,
  MeditationState,
  MeditationTrack,
  MeditationType,
  MoodRating,
  PersonalizedMeditationActivityData,
  PersonalizedMeditationProps,
  PersonalizedScript,
  StreamingAudioState,
  TTSGenerationState,
} from '../../types';

// Re-export hook types
export type {
  AmbientMixerSettings,
  UseAmbientMixerReturn,
  BinauralFrequency,
  UseBinauralBeatsReturn,
  UseTTSGenerationOptions,
  UseTTSGenerationReturn,
} from '../../hooks';

export type { MeditationStreakBadgeProps } from './MeditationStreakBadge';
export type { TimerMeditationProps } from './TimerMeditation';

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
