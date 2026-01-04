/* ============================================================================
   MeditationLibrary Component
   ============================================================================
   Library of saved AI-generated meditations with filtering and replay.

   Features:
   - Grid display of saved meditations
   - Filter by type, favorites, sort order
   - Play saved meditations
   - Toggle favorites
   - Delete with confirmation
   ============================================================================ */

import type { MeditationType } from '@wbot/shared';
import { useCallback, useState } from 'react';

import { MeditationCard } from './MeditationCard';
import styles from './MeditationLibrary.module.css';
import type { MeditationLibraryFilters, MeditationLibraryProps, SavedMeditation } from './types';
import { useMeditationLibrary } from './useMeditationLibrary';

/** Meditation type options for filter dropdown */
const TYPE_OPTIONS: { value: MeditationType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'body_scan', label: 'Body Scan' },
  { value: 'loving_kindness', label: 'Loving Kindness' },
  { value: 'breathing_focus', label: 'Breathing Focus' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'anxiety_relief', label: 'Anxiety Relief' },
  { value: 'daily_mindfulness', label: 'Daily Mindfulness' },
];

/** Sort options for dropdown */
const SORT_OPTIONS: { value: MeditationLibraryFilters['sortBy']; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'most_played', label: 'Most Played' },
  { value: 'last_played', label: 'Recently Played' },
];

/**
 * MeditationLibrary component for browsing and replaying saved meditations
 */
export function MeditationLibrary({
  onPlay,
  onDelete,
  initialFilters,
  maxItems,
  compact = false,
}: MeditationLibraryProps) {
  const {
    meditations,
    isLoading,
    error,
    filters,
    setFilters,
    toggleFavorite,
    deleteMeditation,
    recordPlay,
  } = useMeditationLibrary(initialFilters);

  // Playing meditation state (for inline player)
  const [playingMeditation, setPlayingMeditation] = useState<SavedMeditation | null>(null);

  // Handle play
  const handlePlay = useCallback(
    (meditation: SavedMeditation) => {
      recordPlay(meditation);
      if (onPlay) {
        onPlay(meditation);
      } else {
        // Use internal player if no onPlay provided
        setPlayingMeditation(meditation);
      }
    },
    [onPlay, recordPlay]
  );

  // Handle delete
  const handleDelete = useCallback(
    (meditation: SavedMeditation) => {
      deleteMeditation(meditation);
      onDelete?.(meditation);
    },
    [deleteMeditation, onDelete]
  );

  // Handle filter changes
  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilters({
        ...filters,
        type: e.target.value as MeditationType | 'all',
      });
    },
    [filters, setFilters]
  );

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilters({
        ...filters,
        sortBy: e.target.value as MeditationLibraryFilters['sortBy'],
      });
    },
    [filters, setFilters]
  );

  const handleFavoritesToggle = useCallback(() => {
    setFilters({
      ...filters,
      favoritesOnly: !filters.favoritesOnly,
    });
  }, [filters, setFilters]);

  // Apply max items limit
  const displayMeditations = maxItems ? meditations.slice(0, maxItems) : meditations;

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.container} data-testid="meditation-library">
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
          <p>Loading your meditations...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.container} data-testid="meditation-library">
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <p>Failed to load your meditation library.</p>
          <button
            className={styles.retryButton}
            onClick={() => {
              window.location.reload();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (meditations.length === 0) {
    return (
      <div className={styles.container} data-testid="meditation-library">
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🧘</span>
          <h3>No Meditations Yet</h3>
          <p>
            Your AI-generated meditations will appear here. Start a conversation and ask for a
            personalized meditation!
          </p>
        </div>
      </div>
    );
  }

  // Compact view (for sidebar/widget)
  if (compact) {
    return (
      <div className={styles.containerCompact} data-testid="meditation-library">
        <h3 className={styles.compactTitle}>Recent Meditations</h3>
        <div className={styles.compactList}>
          {displayMeditations.map((meditation) => (
            <MeditationCard
              key={meditation.id}
              meditation={meditation}
              onPlay={() => {
                handlePlay(meditation);
              }}
              onToggleFavorite={() => {
                toggleFavorite(meditation);
              }}
              onDelete={() => {
                handleDelete(meditation);
              }}
              compact
            />
          ))}
        </div>
        {maxItems && meditations.length > maxItems && (
          <button className={styles.viewAllButton}>View All ({meditations.length})</button>
        )}
      </div>
    );
  }

  // Full library view
  return (
    <div className={styles.container} data-testid="meditation-library">
      {/* Header with title and count */}
      <div className={styles.header}>
        <h2 className={styles.title}>Your Meditation Library</h2>
        <span className={styles.count}>
          {meditations.length} meditation{meditations.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="type-filter" className={styles.filterLabel}>
            Type
          </label>
          <select
            id="type-filter"
            className={styles.filterSelect}
            value={filters.type ?? 'all'}
            onChange={handleTypeChange}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="sort-filter" className={styles.filterLabel}>
            Sort
          </label>
          <select
            id="sort-filter"
            className={styles.filterSelect}
            value={filters.sortBy ?? 'newest'}
            onChange={handleSortChange}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          className={`${styles.filterButton} ${filters.favoritesOnly ? styles.filterButtonActive : ''}`}
          onClick={handleFavoritesToggle}
          aria-pressed={filters.favoritesOnly}
        >
          ★ Favorites
        </button>
      </div>

      {/* Meditation grid */}
      <div className={styles.grid}>
        {displayMeditations.map((meditation) => (
          <MeditationCard
            key={meditation.id}
            meditation={meditation}
            onPlay={() => {
              handlePlay(meditation);
            }}
            onToggleFavorite={() => {
              toggleFavorite(meditation);
            }}
            onDelete={() => {
              handleDelete(meditation);
            }}
          />
        ))}
      </div>

      {/* No results after filtering */}
      {displayMeditations.length === 0 && meditations.length > 0 && (
        <div className={styles.noResults}>
          <p>No meditations match your filters.</p>
          <button
            className={styles.clearFiltersButton}
            onClick={() => {
              setFilters({ type: 'all', favoritesOnly: false, sortBy: 'newest' });
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Inline player when playing */}
      {playingMeditation && (
        <div className={styles.inlinePlayer}>
          <div className={styles.inlinePlayerContent}>
            <button
              className={styles.inlinePlayerClose}
              onClick={() => {
                setPlayingMeditation(null);
              }}
              aria-label="Close player"
            >
              ✕
            </button>
            <p className={styles.inlinePlayerTitle}>Now Playing: {playingMeditation.title}</p>
            {playingMeditation.audio_url && (
              <audio
                src={playingMeditation.audio_url}
                controls
                autoPlay
                className={styles.inlinePlayerAudio}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
