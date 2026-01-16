/* ============================================================================
   usePrerecordedMeditations Hook
   ============================================================================
   Manages filtering and sorting of pre-recorded meditation tracks from the
   UCLA MARC meditation library.

   Features:
   - Filter by meditation type (body_scan, loving_kindness, etc.)
   - Filter by duration (short/medium/long)
   - Filter by language
   - Returns sorted tracks (by name)
   ============================================================================ */

import type { MeditationDuration, MeditationType, MeditationTrack } from '@wbot/shared';
import { useMemo, useState } from 'react';

import { getAllTracks } from '../components/GuidedMeditation/techniques';

/* ----------------------------------------------------------------------------
   Types
   ---------------------------------------------------------------------------- */

/** Filter state for pre-recorded meditations */
export interface PrerecordedMeditationFilters {
  /** Filter by meditation type, or 'all' for no filter */
  type: MeditationType | 'all';
  /** Filter by duration preset, or 'all' for no filter */
  duration: MeditationDuration | 'all';
  /** Filter by language code, or 'all' for no filter */
  language: string;
}

/** Return type for the usePrerecordedMeditations hook */
export interface UsePrerecordedMeditationsReturn {
  /** Filtered list of meditation tracks */
  tracks: MeditationTrack[];
  /** Current filter state */
  filters: PrerecordedMeditationFilters;
  /** Update type filter */
  setTypeFilter: (type: MeditationType | 'all') => void;
  /** Update duration filter */
  setDurationFilter: (duration: MeditationDuration | 'all') => void;
  /** Update language filter */
  setLanguageFilter: (language: string) => void;
  /** Reset all filters */
  resetFilters: () => void;
  /** Available meditation types in the library */
  availableTypes: MeditationType[];
  /** Available duration presets in the library */
  availableDurations: MeditationDuration[];
  /** Available languages in the library */
  availableLanguages: string[];
}

/* ----------------------------------------------------------------------------
   Default Values
   ---------------------------------------------------------------------------- */

const DEFAULT_FILTERS: PrerecordedMeditationFilters = {
  type: 'all',
  duration: 'all',
  language: 'en', // Default to English
};

/* ----------------------------------------------------------------------------
   Hook Implementation
   ---------------------------------------------------------------------------- */

/**
 * Hook for managing pre-recorded meditation track filtering
 *
 * Provides a filtered list of UCLA MARC meditation tracks based on
 * user-selected criteria. All tracks are loaded statically from the
 * MEDITATION_TRACKS constant - no async operations needed.
 *
 * @example
 * ```tsx
 * const { tracks, filters, setTypeFilter } = usePrerecordedMeditations();
 *
 * // Filter to only body scan meditations
 * setTypeFilter('body_scan');
 *
 * // Display filtered tracks
 * tracks.map(track => <TrackItem key={track.id} track={track} />)
 * ```
 */
export function usePrerecordedMeditations(): UsePrerecordedMeditationsReturn {
  // Filter state
  const [filters, setFilters] = useState<PrerecordedMeditationFilters>(DEFAULT_FILTERS);

  // Get all tracks from the library
  const allTracks = useMemo(() => getAllTracks(), []);

  // Compute available filter options from the track library
  const availableTypes = useMemo(() => {
    const types = new Set(allTracks.map((track) => track.type));
    return Array.from(types).sort();
  }, [allTracks]);

  const availableDurations = useMemo(() => {
    const durations = new Set(allTracks.map((track) => track.durationPreset));
    return Array.from(durations).sort();
  }, [allTracks]);

  const availableLanguages = useMemo(() => {
    const languages = new Set(allTracks.map((track) => track.language));
    return Array.from(languages).sort();
  }, [allTracks]);

  // Filter and sort tracks based on current filter state
  const filteredTracks = useMemo(() => {
    return allTracks
      .filter((track) => {
        // Type filter
        if (filters.type !== 'all' && track.type !== filters.type) {
          return false;
        }

        // Duration filter
        if (filters.duration !== 'all' && track.durationPreset !== filters.duration) {
          return false;
        }

        // Language filter
        if (filters.language !== 'all' && track.language !== filters.language) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by duration (short first), then by name
        const durationOrder = { short: 0, medium: 1, long: 2 };
        const aDuration = durationOrder[a.durationPreset];
        const bDuration = durationOrder[b.durationPreset];

        if (aDuration !== bDuration) {
          return aDuration - bDuration;
        }

        return a.name.localeCompare(b.name);
      });
  }, [allTracks, filters]);

  // Filter setters
  const setTypeFilter = (type: MeditationType | 'all') => {
    setFilters((prev) => ({ ...prev, type }));
  };

  const setDurationFilter = (duration: MeditationDuration | 'all') => {
    setFilters((prev) => ({ ...prev, duration }));
  };

  const setLanguageFilter = (language: string) => {
    setFilters((prev) => ({ ...prev, language }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return {
    tracks: filteredTracks,
    filters,
    setTypeFilter,
    setDurationFilter,
    setLanguageFilter,
    resetFilters,
    availableTypes,
    availableDurations,
    availableLanguages,
  };
}
