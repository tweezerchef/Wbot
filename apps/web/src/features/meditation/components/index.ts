/* ============================================================================
   Meditation Components Index
   ============================================================================
   Exports all meditation-related components.
   ============================================================================ */

// GuidedMeditation components
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
} from './GuidedMeditation';

// MeditationSeries components
export { MeditationSeries, SeriesProgressBar, BadgeUnlock } from './MeditationSeries';

// MeditationLibrary components
export { MeditationLibrary, MeditationCard } from './MeditationLibrary';

// VoiceSelectionConfirmation component
export { VoiceSelectionConfirmation } from './VoiceSelectionConfirmation';

// Component prop types
export type { MeditationStreakBadgeProps } from './GuidedMeditation';
export type { TimerMeditationProps } from './GuidedMeditation';
