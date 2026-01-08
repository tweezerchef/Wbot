/* ============================================================================
   Meditation Feature Index
   ============================================================================
   Main barrel export for the meditation feature.
   ============================================================================ */

// Components
export {
  AIGeneratedMeditation,
  GuidedMeditation,
  PersonalizedMeditation,
  MeditationPlayer,
  MeditationVisual,
  MeditationStreakBadge,
  TimerMeditation,
  VoiceSelector,
  MoodCheck,
  getMoodLabel,
  getMoodEmoji,
  MOOD_OPTIONS,
  getAllTracks,
  getAvailableTrackIds,
  getMeditationTrack,
  getTracksByDuration,
  getTracksByLanguage,
  getTracksByType,
  getTracksForUseCase,
  MEDITATION_TRACKS,
  UCLA_ATTRIBUTION,
  MeditationSeries,
  SeriesProgressBar,
  BadgeUnlock,
  MeditationLibrary,
  MeditationCard,
  VoiceSelectionConfirmation,
} from './components';

// Hooks
export {
  useAmbientMixer,
  useBinauralBeats,
  useMeditationAudio,
  useTTSGeneration,
  useMeditationLibrary,
} from './hooks';

// Types
export type {
  // Core meditation types
  AmbientSoundType,
  MeditationPlaybackState,
  MeditationState,
  GuidedMeditationProps,
  MeditationPlayerProps,
  MeditationAudioSettings,
  MeditationActivityData,
  // Personalized meditation types
  PersonalizedScript,
  GeneratedMeditationResult,
  MeditationPersonalization,
  TTSGenerationState,
  PersonalizedMeditationProps,
  PersonalizedMeditationActivityData,
  // AI-generated meditation types
  AIMeditationVoice,
  AIMeditationScript,
  AIMeditationContext,
  AIGeneratedMeditationActivityData,
  AIGeneratedMeditationProps,
  StreamingAudioState,
  // Series types
  MeditationSeries as MeditationSeriesType,
  SeriesProgress,
  UserBadge,
  // Library types
  SavedMeditation,
  MeditationLibraryFilters,
  MeditationLibraryProps,
  MeditationCardProps,
  // Re-exported shared types
  MeditationSessionData,
  MeditationTrack,
  MeditationType,
  MoodRating,
} from './types';

// Hook types
export type {
  AmbientMixerSettings,
  UseAmbientMixerReturn,
  BinauralFrequency,
  UseBinauralBeatsReturn,
  UseMeditationAudioOptions,
  UseMeditationAudioReturn,
  UseTTSGenerationOptions,
  UseTTSGenerationReturn,
  UseMeditationLibraryReturn,
} from './hooks';

// Component prop types
export type { MeditationStreakBadgeProps, TimerMeditationProps } from './components';
