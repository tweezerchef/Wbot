/* ============================================================================
   MeditationPlayer Component
   ============================================================================
   Audio player UI for guided meditation with progress bar and controls.

   Features:
   - Seekable progress bar
   - Play/Pause button
   - Stop button
   - Time display (current / total)
   - Volume control
   - Loading state indicator
   ============================================================================ */

import { useCallback } from 'react';

import styles from './GuidedMeditation.module.css';
import type { MeditationPlayerProps } from './types';

/**
 * Formats seconds into MM:SS or H:MM:SS format
 */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${String(hours)}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${String(minutes)}:${secs.toString().padStart(2, '0')}`;
}

/**
 * MeditationPlayer component
 *
 * Displays the audio player UI with progress bar, controls, and time.
 */
export function MeditationPlayer({
  state,
  track,
  onPlay,
  onPause,
  onStop,
  onSeek,
  volume,
  onVolumeChange,
}: MeditationPlayerProps) {
  const { playbackState, currentTime, duration, progress, isLoading } = state;
  const isPlaying = playbackState === 'playing';
  const _isPaused = playbackState === 'paused';
  const isComplete = playbackState === 'complete';

  // Handle progress bar click/drag for seeking
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      onSeek(percentage);
    },
    [onSeek]
  );

  // Handle keyboard navigation for progress slider
  const handleProgressKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const step = 0.05; // 5% step
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        onSeek(Math.min(1, progress / 100 + step));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        onSeek(Math.max(0, progress / 100 - step));
      }
    },
    [onSeek, progress]
  );

  // Handle volume slider change
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onVolumeChange(parseFloat(e.target.value));
    },
    [onVolumeChange]
  );

  // Handle play/pause toggle
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [isPlaying, onPlay, onPause]);

  return (
    <div className={styles.player}>
      {/* Progress bar */}
      <div
        className={styles.progressContainer}
        onClick={handleProgressClick}
        onKeyDown={handleProgressKeyDown}
        role="slider"
        aria-label="Meditation progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        tabIndex={0}
      >
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${String(progress)}%` }} />
          <div className={styles.progressThumb} style={{ left: `${String(progress)}%` }} />
        </div>
      </div>

      {/* Time display */}
      <div className={styles.timeDisplay}>
        <span className={styles.currentTime}>{formatTime(currentTime)}</span>
        <span className={styles.separator}>/</span>
        <span className={styles.totalTime}>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {/* Play/Pause button */}
        <button
          className={`${styles.controlButton} ${styles.playButton}`}
          onClick={handlePlayPause}
          disabled={isLoading || isComplete}
          aria-label={isPlaying ? 'Pause meditation' : 'Play meditation'}
        >
          {isLoading ? (
            <svg
              className={styles.spinnerIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
          ) : isPlaying ? (
            // Pause icon
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            // Play icon
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Stop button */}
        <button
          className={`${styles.controlButton} ${styles.stopButton}`}
          onClick={onStop}
          disabled={playbackState === 'idle' || isComplete}
          aria-label="Stop meditation"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </button>

        {/* Volume control */}
        <div className={styles.volumeContainer}>
          <button
            className={styles.volumeButton}
            onClick={() => {
              onVolumeChange(volume > 0 ? 0 : 0.8);
            }}
            aria-label={volume > 0 ? 'Mute' : 'Unmute'}
          >
            {volume === 0 ? (
              // Muted icon
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : volume < 0.5 ? (
              // Low volume icon
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              // High volume icon
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            )}
          </button>
          <input
            type="range"
            className={styles.volumeSlider}
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            aria-label="Volume"
          />
        </div>
      </div>

      {/* Track info */}
      {track.narrator && <p className={styles.narrator}>Guided by {track.narrator}</p>}
    </div>
  );
}
