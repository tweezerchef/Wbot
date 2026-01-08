/* ============================================================================
   useMeditationLibrary Hook
   ============================================================================
   Hook for fetching and managing the user's meditation library.
   Uses TanStack Query for caching and automatic refetching.
   ============================================================================ */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { MeditationLibraryFilters, SavedMeditation } from '../types';

import { supabase } from '@/lib/supabase';

// Type-safe accessor for user_generated_meditations table
// This table exists but types may not be generated yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const meditationsTable = () => supabase.from('user_generated_meditations' as any);

/** Query key for meditation library */
const LIBRARY_QUERY_KEY = ['meditation-library'];

/**
 * Fetch meditations from Supabase with filters
 */
async function fetchMeditations(filters: MeditationLibraryFilters): Promise<SavedMeditation[]> {
  let query = meditationsTable().select('*').eq('status', 'complete'); // Only show completed meditations

  // Apply type filter
  if (filters.type && filters.type !== 'all') {
    query = query.eq('meditation_type', filters.type);
  }

  // Apply favorites filter
  if (filters.favoritesOnly) {
    query = query.eq('is_favorite', true);
  }

  // Apply sorting
  switch (filters.sortBy) {
    case 'oldest':
      query = query.order('created_at', { ascending: true });
      break;
    case 'most_played':
      query = query.order('play_count', { ascending: false });
      break;
    case 'last_played':
      query = query.order('last_played_at', { ascending: false, nullsFirst: false });
      break;
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching meditations:', error);
    throw error;
  }

  return data as unknown as SavedMeditation[];
}

/**
 * Toggle favorite status of a meditation
 */
async function toggleFavorite(meditationId: string, currentValue: boolean): Promise<void> {
  const { error } = await meditationsTable()
    .update({ is_favorite: !currentValue })
    .eq('id', meditationId);

  if (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
}

/**
 * Delete a meditation
 */
async function deleteMeditation(meditationId: string): Promise<void> {
  const { error } = await meditationsTable().delete().eq('id', meditationId);

  if (error) {
    console.error('Error deleting meditation:', error);
    throw error;
  }
}

/**
 * Increment play count and update last_played_at
 */
async function recordPlay(meditationId: string): Promise<void> {
  // Simple update: just set last_played_at
  // Note: For proper play count increment, use a database function
  const { error } = await meditationsTable()
    .update({ last_played_at: new Date().toISOString() })
    .eq('id', meditationId);

  if (error) {
    console.warn('Failed to record play:', error);
  }
}

export interface UseMeditationLibraryReturn {
  /** List of meditations */
  meditations: SavedMeditation[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Current filters */
  filters: MeditationLibraryFilters;
  /** Update filters */
  setFilters: (filters: MeditationLibraryFilters) => void;
  /** Toggle favorite status */
  toggleFavorite: (meditation: SavedMeditation) => void;
  /** Delete a meditation */
  deleteMeditation: (meditation: SavedMeditation) => void;
  /** Record a play */
  recordPlay: (meditation: SavedMeditation) => void;
  /** Refetch the library */
  refetch: () => void;
  /** Whether toggle favorite is in progress */
  isTogglingFavorite: boolean;
  /** Whether delete is in progress */
  isDeleting: boolean;
}

/**
 * Hook for managing the meditation library
 *
 * Provides:
 * - Fetching meditations with filters
 * - Toggle favorite
 * - Delete meditation
 * - Record play count
 */
export function useMeditationLibrary(
  initialFilters: MeditationLibraryFilters = {}
): UseMeditationLibraryReturn {
  const queryClient = useQueryClient();

  // Filter state
  const [filters, setFilters] = useState<MeditationLibraryFilters>({
    type: 'all',
    favoritesOnly: false,
    sortBy: 'newest',
    ...initialFilters,
  });

  // Fetch meditations query
  const {
    data: meditations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...LIBRARY_QUERY_KEY, filters],
    queryFn: () => fetchMeditations(filters),
    staleTime: 30000, // 30 seconds
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, currentValue }: { id: string; currentValue: boolean }) =>
      toggleFavorite(id, currentValue),
    onMutate: async ({ id, currentValue }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: LIBRARY_QUERY_KEY });

      // Snapshot the previous value
      const previousMeditations = queryClient.getQueryData<SavedMeditation[]>([
        ...LIBRARY_QUERY_KEY,
        filters,
      ]);

      // Optimistically update
      queryClient.setQueryData<SavedMeditation[]>(
        [...LIBRARY_QUERY_KEY, filters],
        (old) => old?.map((m) => (m.id === id ? { ...m, is_favorite: !currentValue } : m)) ?? []
      );

      return { previousMeditations };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousMeditations) {
        queryClient.setQueryData([...LIBRARY_QUERY_KEY, filters], context.previousMeditations);
      }
    },
    onSettled: () => {
      // Refetch after mutation
      void queryClient.invalidateQueries({ queryKey: LIBRARY_QUERY_KEY });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMeditation(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: LIBRARY_QUERY_KEY });

      const previousMeditations = queryClient.getQueryData<SavedMeditation[]>([
        ...LIBRARY_QUERY_KEY,
        filters,
      ]);

      // Optimistically remove
      queryClient.setQueryData<SavedMeditation[]>(
        [...LIBRARY_QUERY_KEY, filters],
        (old) => old?.filter((m) => m.id !== id) ?? []
      );

      return { previousMeditations };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousMeditations) {
        queryClient.setQueryData([...LIBRARY_QUERY_KEY, filters], context.previousMeditations);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: LIBRARY_QUERY_KEY });
    },
  });

  // Record play mutation (fire and forget)
  const recordPlayMutation = useMutation({
    mutationFn: (id: string) => recordPlay(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: LIBRARY_QUERY_KEY });
    },
  });

  // Callbacks
  const handleToggleFavorite = useCallback(
    (meditation: SavedMeditation) => {
      toggleFavoriteMutation.mutate({
        id: meditation.id,
        currentValue: meditation.is_favorite,
      });
    },
    [toggleFavoriteMutation]
  );

  const handleDelete = useCallback(
    (meditation: SavedMeditation) => {
      deleteMutation.mutate(meditation.id);
    },
    [deleteMutation]
  );

  const handleRecordPlay = useCallback(
    (meditation: SavedMeditation) => {
      recordPlayMutation.mutate(meditation.id);
    },
    [recordPlayMutation]
  );

  const handleRefetch = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    meditations,
    isLoading,
    error: error,
    filters,
    setFilters,
    toggleFavorite: handleToggleFavorite,
    deleteMeditation: handleDelete,
    recordPlay: handleRecordPlay,
    refetch: handleRefetch,
    isTogglingFavorite: toggleFavoriteMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
