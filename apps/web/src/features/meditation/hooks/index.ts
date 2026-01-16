/* ============================================================================
   Meditation Hooks Index
   ============================================================================
   Exports all meditation-related hooks.
   ============================================================================ */

// Audio hooks
export { useAmbientMixer } from './useAmbientMixer';
export { useBinauralBeats } from './useBinauralBeats';
export { useMeditationAudio } from './useMeditationAudio';
export { useTTSGeneration } from './useTTSGeneration';

// Library hooks
export { useMeditationLibrary } from './useMeditationLibrary';
export { usePrerecordedMeditations } from './usePrerecordedMeditations';

// Hook types
export type { AmbientMixerSettings, UseAmbientMixerReturn } from './useAmbientMixer';
export type { BinauralFrequency, UseBinauralBeatsReturn } from './useBinauralBeats';
export type { UseMeditationAudioOptions, UseMeditationAudioReturn } from './useMeditationAudio';
export type { UseTTSGenerationOptions, UseTTSGenerationReturn } from './useTTSGeneration';
export type { UseMeditationLibraryReturn } from './useMeditationLibrary';
export type {
  PrerecordedMeditationFilters,
  UsePrerecordedMeditationsReturn,
} from './usePrerecordedMeditations';
