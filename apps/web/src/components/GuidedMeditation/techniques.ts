/* ============================================================================
   Meditation Track Definitions
   ============================================================================
   Defines the available guided meditation tracks.

   Audio Source: UCLA Mindful Awareness Research Center (MARC)
   License: Creative Commons Attribution-NonCommercial-NoDerivatives 4.0
   https://www.uclahealth.org/programs/marc/free-guided-meditations

   Attribution Required: "Meditation by Diana Winston, UCLA Mindful Awareness
   Research Center (MARC). Licensed under CC BY-NC-ND 4.0."
   ============================================================================ */

import type { MeditationTrack } from '@wbot/shared';

/** Base URL for meditation audio files in Supabase storage */
const AUDIO_BASE_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${String(import.meta.env.VITE_SUPABASE_URL)}/storage/v1/object/public/meditation-audio`
  : '/audio/meditation';

/** UCLA MARC attribution text */
export const UCLA_ATTRIBUTION =
  'Meditation by Diana Winston, UCLA Mindful Awareness Research Center (MARC). Licensed under CC BY-NC-ND 4.0.';

/**
 * Available meditation tracks
 *
 * All tracks are from UCLA MARC and feature Diana Winston as narrator.
 * Tracks are organized by type and duration.
 */
export const MEDITATION_TRACKS: Record<string, MeditationTrack> = {
  // -------------------------------------------------------------------------
  // Body Scan Meditations
  // -------------------------------------------------------------------------
  body_scan_short: {
    id: 'body_scan_short',
    name: 'Body Scan (Short)',
    type: 'body_scan',
    durationSeconds: 180, // 3 minutes
    durationPreset: 'short',
    description:
      'A quick body scan to release tension and reconnect with physical sensations. Perfect for a brief mindfulness break.',
    audioUrl: `${AUDIO_BASE_URL}/body-scan-3min-en.mp3`,
    narrator: 'Diana Winston',
    language: 'en',
    bestFor: ['tension release', 'quick break', 'body awareness'],
    attribution: UCLA_ATTRIBUTION,
  },

  body_scan_medium: {
    id: 'body_scan_medium',
    name: 'Body Scan',
    type: 'body_scan',
    durationSeconds: 540, // 9 minutes
    durationPreset: 'medium',
    description:
      'A thorough body scan meditation moving from head to toe, releasing tension and cultivating awareness of physical sensations.',
    audioUrl: `${AUDIO_BASE_URL}/body-scan-9min-en.mp3`,
    narrator: 'Diana Winston',
    language: 'en',
    bestFor: ['deep relaxation', 'stress relief', 'sleep preparation'],
    attribution: UCLA_ATTRIBUTION,
  },

  // -------------------------------------------------------------------------
  // Breathing Focus Meditations
  // -------------------------------------------------------------------------
  breathing_focus: {
    id: 'breathing_focus',
    name: 'Breathing Meditation',
    type: 'breathing_focus',
    durationSeconds: 300, // 5 minutes
    durationPreset: 'short',
    description:
      'A gentle meditation focusing on the breath as an anchor for attention. Ideal for beginners and daily practice.',
    audioUrl: `${AUDIO_BASE_URL}/breathing-5min-en.mp3`,
    narrator: 'Diana Winston',
    language: 'en',
    bestFor: ['focus', 'calm', 'beginners', 'daily practice'],
    attribution: UCLA_ATTRIBUTION,
  },

  // -------------------------------------------------------------------------
  // Loving Kindness (Metta) Meditations
  // -------------------------------------------------------------------------
  loving_kindness: {
    id: 'loving_kindness',
    name: 'Loving Kindness',
    type: 'loving_kindness',
    durationSeconds: 540, // 9 minutes
    durationPreset: 'medium',
    description:
      'Cultivate compassion for yourself and others through this loving kindness (metta) meditation. Opens the heart and reduces negative emotions.',
    audioUrl: `${AUDIO_BASE_URL}/loving-kindness-9min-en.mp3`,
    narrator: 'Diana Winston',
    language: 'en',
    bestFor: ['self-compassion', 'emotional healing', 'relationship issues'],
    attribution: UCLA_ATTRIBUTION,
  },

  // -------------------------------------------------------------------------
  // Anxiety Relief / Working with Difficulties
  // -------------------------------------------------------------------------
  anxiety_relief: {
    id: 'anxiety_relief',
    name: 'Working with Difficulties',
    type: 'anxiety_relief',
    durationSeconds: 420, // 7 minutes
    durationPreset: 'medium',
    description:
      'A meditation for working with difficult emotions and anxiety. Learn to meet challenges with mindfulness and self-compassion.',
    audioUrl: `${AUDIO_BASE_URL}/working-with-difficulties-7min-en.mp3`,
    narrator: 'Diana Winston',
    language: 'en',
    bestFor: ['anxiety', 'difficult emotions', 'stress', 'overwhelm'],
    attribution: UCLA_ATTRIBUTION,
  },
};

/**
 * Get a meditation track by ID
 */
export function getMeditationTrack(id: string): MeditationTrack | undefined {
  return MEDITATION_TRACKS[id];
}

/**
 * Get all tracks of a specific type
 */
export function getTracksByType(type: MeditationTrack['type']): MeditationTrack[] {
  return Object.values(MEDITATION_TRACKS).filter((track) => track.type === type);
}

/**
 * Get all available track IDs
 */
export function getAvailableTrackIds(): string[] {
  return Object.keys(MEDITATION_TRACKS);
}

/**
 * Get tracks suitable for a specific use case
 */
export function getTracksForUseCase(useCase: string): MeditationTrack[] {
  const normalizedUseCase = useCase.toLowerCase();
  return Object.values(MEDITATION_TRACKS).filter((track) =>
    track.bestFor.some((use) => use.toLowerCase().includes(normalizedUseCase))
  );
}
