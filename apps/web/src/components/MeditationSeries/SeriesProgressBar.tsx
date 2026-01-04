/* SeriesProgressBar Component */

import styles from './MeditationSeries.module.css';

export interface SeriesProgressBarProps {
  completed: number;
  total: number;
  currentIndex: number;
}

export function SeriesProgressBar({ completed, total, currentIndex }: SeriesProgressBarProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressTrack}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`${styles.progressDot} ${i < completed ? styles.completed : ''} ${i === currentIndex ? styles.current : ''}`}
          />
        ))}
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${String(percentage)}%` }} />
      </div>
      <p className={styles.progressText}>
        {completed} of {total} complete
      </p>
    </div>
  );
}
