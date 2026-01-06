/* ============================================================================
   MeditationSeries Component
   ============================================================================
   Displays a meditation series/course with progress tracking.
   ============================================================================ */

import styles from './MeditationSeries.module.css';
import { SeriesProgressBar } from './SeriesProgressBar';
import type { MeditationSeries as SeriesType, SeriesProgress } from './types';

export interface MeditationSeriesProps {
  series: SeriesType;
  progress?: SeriesProgress | null;
  onStartSession?: (trackIndex: number) => void;
  onViewDetails?: () => void;
}

export function MeditationSeries({
  series,
  progress,
  onStartSession,
  onViewDetails,
}: MeditationSeriesProps) {
  const completedCount = progress?.completedTrackIds.length ?? 0;
  const totalCount = series.trackIds.length;
  const isComplete = completedCount === totalCount;
  const currentIndex = progress?.currentTrackIndex ?? 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    return `${String(mins)} min total`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.badge}>{series.badgeEmoji}</div>
        <div className={styles.info}>
          <h3 className={styles.title}>{series.title}</h3>
          <p className={styles.meta}>
            {totalCount} sessions • {formatDuration(series.totalDurationSeconds)}
          </p>
        </div>
        {isComplete && (
          <div className={styles.completeBadge}>
            <span>✓</span> Complete
          </div>
        )}
      </div>

      <p className={styles.description}>{series.description}</p>

      <SeriesProgressBar
        completed={completedCount}
        total={totalCount}
        currentIndex={currentIndex}
      />

      <div className={styles.actions}>
        {!isComplete ? (
          <button className={styles.primaryButton} onClick={() => onStartSession?.(currentIndex)}>
            {completedCount === 0 ? 'Start Series' : 'Continue'}
          </button>
        ) : (
          <button className={styles.secondaryButton} onClick={() => onStartSession?.(0)}>
            Restart Series
          </button>
        )}
        <button className={styles.linkButton} onClick={onViewDetails}>
          View Details
        </button>
      </div>
    </div>
  );
}
