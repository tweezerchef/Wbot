/**
 * Pre-recorded Meditations Panel
 *
 * Displays UCLA MARC meditation tracks in a collapsible sidebar section.
 * Allows users to browse, filter, and select tracks for playback.
 */

import type { MeditationTrack, MeditationType, MeditationDuration } from '@wbot/shared';
import { MEDITATION_TYPE_LABELS, formatDuration } from '@wbot/shared';
import { useState, useCallback } from 'react';

import { usePrerecordedMeditations } from '../../hooks/usePrerecordedMeditations';

import styles from './PrerecordedMeditations.module.css';

import { MeditationIcon, ChevronDownIcon } from '@/components/ui/icons';

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

interface PrerecordedMeditationsProps {
  /** Callback when a meditation track is selected */
  onSelectTrack: (track: MeditationTrack) => void;
  /** Callback to close sidebar on mobile */
  onCloseSidebar?: () => void;
}

/* ----------------------------------------------------------------------------
   Duration Badge Colors
   ---------------------------------------------------------------------------- */

const DURATION_COLORS: Record<MeditationDuration, string> = {
  short: 'var(--color-success)',
  medium: 'var(--color-info)',
  long: 'var(--color-primary)',
};

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function PrerecordedMeditations({
  onSelectTrack,
  onCloseSidebar,
}: PrerecordedMeditationsProps) {
  // Panel expansion state
  const [isExpanded, setIsExpanded] = useState(false);

  // Get filtered tracks and filter controls
  const { tracks, filters, setTypeFilter, setDurationFilter, availableTypes, availableDurations } =
    usePrerecordedMeditations();

  /* --------------------------------------------------------------------------
     Handlers
     -------------------------------------------------------------------------- */
  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (track: MeditationTrack) => {
      onSelectTrack(track);
      // Close sidebar on mobile
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        onCloseSidebar?.();
      }
    },
    [onSelectTrack, onCloseSidebar]
  );

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setTypeFilter(value === 'all' ? 'all' : (value as MeditationType));
    },
    [setTypeFilter]
  );

  const handleDurationChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setDurationFilter(value === 'all' ? 'all' : (value as MeditationDuration));
    },
    [setDurationFilter]
  );

  /* --------------------------------------------------------------------------
     Render
     -------------------------------------------------------------------------- */
  return (
    <div className={styles.container}>
      {/* Toggle Button */}
      <button
        className={`${styles.toggleButton} ${isExpanded ? styles.expanded : ''}`}
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls="meditation-library-panel"
      >
        <MeditationIcon />
        <span>Meditation Library</span>
        <ChevronDownIcon />
      </button>

      {/* Expandable Panel */}
      {isExpanded && (
        <div
          id="meditation-library-panel"
          className={styles.panel}
          role="region"
          aria-label="Pre-recorded meditations"
        >
          {/* Filter Controls */}
          <div className={styles.filters}>
            {/* Type filter */}
            <select
              className={styles.filterSelect}
              value={filters.type}
              onChange={handleTypeChange}
              aria-label="Filter by type"
            >
              <option value="all">All Types</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {MEDITATION_TYPE_LABELS[type]}
                </option>
              ))}
            </select>

            {/* Duration filter */}
            <select
              className={styles.filterSelect}
              value={filters.duration}
              onChange={handleDurationChange}
              aria-label="Filter by duration"
            >
              <option value="all">All Durations</option>
              {availableDurations.map((duration) => (
                <option key={duration} value={duration}>
                  {duration.charAt(0).toUpperCase() + duration.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Track List */}
          <ul className={styles.list} role="listbox">
            {tracks.length === 0 && (
              <li className={styles.emptyState}>No meditations match your filters</li>
            )}

            {tracks.map((track) => (
              <li key={track.id}>
                <button
                  className={styles.trackItem}
                  onClick={() => {
                    handleSelect(track);
                  }}
                  role="option"
                >
                  <div className={styles.trackHeader}>
                    <span
                      className={styles.durationBadge}
                      style={{ backgroundColor: DURATION_COLORS[track.durationPreset] }}
                    >
                      {formatDuration(track.durationSeconds)}
                    </span>
                    <span className={styles.trackType}>{MEDITATION_TYPE_LABELS[track.type]}</span>
                  </div>
                  <span className={styles.trackName}>{track.name}</span>
                  <span className={styles.trackDescription}>
                    {track.description.length > 80
                      ? `${track.description.substring(0, 80)}...`
                      : track.description}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
