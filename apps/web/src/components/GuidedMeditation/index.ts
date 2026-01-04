/* ============================================================================
   GuidedMeditation Component Exports
   ============================================================================ */

// Main components
export { AIGeneratedMeditation } from './AIGeneratedMeditation';
export { GuidedMeditation } from './GuidedMeditation';
export { PersonalizedMeditation } from './PersonalizedMeditation';
export { MeditationPlayer } from './MeditationPlayer';
export { MeditationVisual } from './MeditationVisual';
export { MoodCheck } from './MoodCheck';
export { MeditationStreakBadge } from './MeditationStreakBadge';
export { TimerMeditation } from './TimerMeditation';
export { VoiceSelector } from './VoiceSelector';
export { getMoodLabel, getMoodEmoji, MOOD_OPTIONS } from './moodHelpers';

// Hooks
export { useMeditationAudio } from './useMeditationAudio';
export { useAmbientMixer } from './useAmbientMixer';
export { useBinauralBeats } from './useBinauralBeats';
export { useTTSGeneration } from './useTTSGeneration';

// Types
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
} from './types';

export type { AmbientMixerSettings, UseAmbientMixerReturn } from './useAmbientMixer';
export type { MeditationStreakBadgeProps } from './MeditationStreakBadge';
export type { TimerMeditationProps } from './TimerMeditation';
export type { BinauralFrequency, UseBinauralBeatsReturn } from './useBinauralBeats';
export type { UseTTSGenerationOptions, UseTTSGenerationReturn } from './useTTSGeneration';

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
