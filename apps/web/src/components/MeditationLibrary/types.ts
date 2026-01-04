/* ============================================================================
   MeditationLibrary Types
   ============================================================================
   Type definitions for the meditation library component.
   ============================================================================ */

import type { MeditationType } from '@wbot/shared';

/** A saved meditation from the user's library */
export interface SavedMeditation {
  id: string;
  title: string;
  meditation_type: MeditationType;
  duration_seconds: number;
  voice_id: string;
  voice_name: string;
  audio_url: string | null;
  status: 'pending' | 'generating' | 'ready' | 'complete' | 'error';
  play_count: number;
  last_played_at: string | null;
  is_favorite: boolean;
  mood_before: number | null;
  mood_after: number | null;
  created_at: string;
  generation_context: {
    time_of_day?: string;
    primary_intent?: string;
    memories_used?: number;
    emotional_signals?: string[];
  };
}

/** Filter options for the meditation library */
export interface MeditationLibraryFilters {
  type?: MeditationType | 'all';
  favoritesOnly?: boolean;
  sortBy?: 'newest' | 'oldest' | 'most_played' | 'last_played';
}

/** Props for the MeditationLibrary component */
export interface MeditationLibraryProps {
  /** Callback when user wants to play a meditation */
  onPlay?: (meditation: SavedMeditation) => void;
  /** Callback when user deletes a meditation */
  onDelete?: (meditation: SavedMeditation) => void;
  /** Initial filters */
  initialFilters?: MeditationLibraryFilters;
  /** Maximum meditations to show (for compact view) */
  maxItems?: number;
  /** Show in compact mode (for sidebar/widget) */
  compact?: boolean;
}

/** Props for the MeditationCard component */
export interface MeditationCardProps {
  meditation: SavedMeditation;
  onPlay: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
  compact?: boolean;
}
