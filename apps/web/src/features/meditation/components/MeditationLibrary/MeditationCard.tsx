/* ============================================================================
   MeditationCard Component
   ============================================================================
   Individual meditation card for the library grid.
   Shows meditation info with play, favorite, and delete actions.
   ============================================================================ */

import type { MeditationType } from '@wbot/shared';
import { useCallback, useState } from 'react';

import type { MeditationCardProps } from '../../types';

import styles from './MeditationLibrary.module.css';

/** Map meditation types to display icons */
const TYPE_ICONS: Record<MeditationType, string> = {
  body_scan: '🧘',
  loving_kindness: '💛',
  breathing_focus: '🌬️',
  sleep: '😴',
  anxiety_relief: '🌿',
  daily_mindfulness: '✨',
};

/** Map meditation types to display names */
const TYPE_NAMES: Record<MeditationType, string> = {
  body_scan: 'Body Scan',
  loving_kindness: 'Loving Kindness',
  breathing_focus: 'Breathing Focus',
  sleep: 'Sleep',
  anxiety_relief: 'Anxiety Relief',
  daily_mindfulness: 'Daily Mindfulness',
};

/**
 * Format seconds to mm:ss display
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins)}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format date to relative or absolute display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${String(diffDays)} days ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

/**
 * Individual meditation card component
 */
export function MeditationCard({
  meditation,
  onPlay,
  onToggleFavorite,
  onDelete,
  compact = false,
}: MeditationCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete();
      setShowDeleteConfirm(false);
    },
    [onDelete]
  );

  const handleCancelDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  }, []);

  const handleFavoriteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite();
    },
    [onToggleFavorite]
  );

  const meditationType = meditation.meditation_type;

  if (compact) {
    return (
      <button
        className={styles.cardCompact}
        onClick={onPlay}
        aria-label={`Play ${meditation.title}`}
      >
        <span className={styles.cardCompactIcon}>{TYPE_ICONS[meditationType]}</span>
        <div className={styles.cardCompactInfo}>
          <span className={styles.cardCompactTitle}>{meditation.title}</span>
          <span className={styles.cardCompactMeta}>
            {formatDuration(meditation.duration_seconds)} • {meditation.voice_name}
          </span>
        </div>
        <span className={styles.cardCompactPlay}>▶</span>
      </button>
    );
  }

  return (
    <div
      className={styles.card}
      onClick={onPlay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay();
        }
      }}
      data-testid="meditation-card"
    >
      {/* Delete confirmation overlay */}
      {showDeleteConfirm && (
        <div className={styles.deleteConfirm}>
          <p>Delete this meditation?</p>
          <div className={styles.deleteConfirmButtons}>
            <button className={styles.deleteConfirmCancel} onClick={handleCancelDelete}>
              Cancel
            </button>
            <button className={styles.deleteConfirmDelete} onClick={handleConfirmDelete}>
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Card header with type icon and actions */}
      <div className={styles.cardHeader}>
        <div className={styles.cardType}>
          <span className={styles.cardTypeIcon}>{TYPE_ICONS[meditationType]}</span>
          <span className={styles.cardTypeName}>{TYPE_NAMES[meditationType]}</span>
        </div>
        <div className={styles.cardActions}>
          <button
            className={`${styles.cardAction} ${meditation.is_favorite ? styles.cardActionFavorite : ''}`}
            onClick={handleFavoriteClick}
            aria-label={meditation.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {meditation.is_favorite ? '★' : '☆'}
          </button>
          <button
            className={styles.cardAction}
            onClick={handleDeleteClick}
            aria-label="Delete meditation"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Card title */}
      <h3 className={styles.cardTitle}>{meditation.title}</h3>

      {/* Card meta info */}
      <div className={styles.cardMeta}>
        <span className={styles.cardDuration}>{formatDuration(meditation.duration_seconds)}</span>
        <span className={styles.cardSeparator}>•</span>
        <span className={styles.cardVoice}>{meditation.voice_name}</span>
      </div>

      {/* Play stats */}
      <div className={styles.cardStats}>
        <span className={styles.cardStatItem}>▶ {meditation.play_count} plays</span>
        <span className={styles.cardStatItem}>{formatDate(meditation.created_at)}</span>
      </div>

      {/* Mood change if available */}
      {meditation.mood_before && meditation.mood_after && (
        <div className={styles.cardMood}>
          <span className={styles.cardMoodLabel}>Mood:</span>
          <span className={styles.cardMoodValue}>
            {meditation.mood_before} → {meditation.mood_after}
          </span>
        </div>
      )}

      {/* Context tags */}
      {meditation.generation_context.emotional_signals &&
        meditation.generation_context.emotional_signals.length > 0 && (
          <div className={styles.cardTags}>
            {meditation.generation_context.emotional_signals.slice(0, 3).map((signal) => (
              <span key={signal} className={styles.cardTag}>
                {signal}
              </span>
            ))}
          </div>
        )}

      {/* Play overlay */}
      <div className={styles.cardPlayOverlay}>
        <span className={styles.cardPlayIcon}>▶</span>
        <span className={styles.cardPlayText}>Play</span>
      </div>
    </div>
  );
}
