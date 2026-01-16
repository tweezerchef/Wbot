/**
 * Pre-recorded Meditation Player
 *
 * Full-featured audio player for UCLA MARC meditation tracks.
 * Displays track info, progress bar, play/pause controls, and attribution.
 */

import type { MeditationTrack } from '@wbot/shared';
import { MEDITATION_TYPE_LABELS, formatDuration } from '@wbot/shared';
import { useCallback, useEffect } from 'react';

import { useMeditationAudio } from '../../hooks/useMeditationAudio';
import { UCLA_ATTRIBUTION } from '../GuidedMeditation/techniques';

import styles from './PrerecordedMeditationPlayer.module.css';

import { CloseIcon } from '@/components/ui/icons';

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

interface PrerecordedMeditationPlayerProps {
  /** The meditation track to play */
  track: MeditationTrack;
  /** Callback when the player is closed */
  onClose: () => void;
  /** Callback when the meditation completes naturally */
  onComplete?: () => void;
}

/* ----------------------------------------------------------------------------
   Helper Functions
   ---------------------------------------------------------------------------- */

/**
 * Format seconds to MM:SS display
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins)}:${secs.toString().padStart(2, '0')}`;
}

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function PrerecordedMeditationPlayer({
  track,
  onClose,
  onComplete,
}: PrerecordedMeditationPlayerProps) {
  // Audio playback control
  const { state, volume, play, pause, stop, seek, setVolume } = useMeditationAudio({
    audioUrl: track.audioUrl,
    initialVolume: 0.8,
    onEnded: () => {
      onComplete?.();
    },
  });

  // Auto-play on mount (after a brief delay for user to see the UI)
  useEffect(() => {
    const timer = setTimeout(() => {
      void play();
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [play]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  /* --------------------------------------------------------------------------
     Handlers
     -------------------------------------------------------------------------- */
  const handlePlayPause = useCallback(() => {
    if (state.playbackState === 'playing') {
      pause();
    } else {
      void play();
    }
  }, [state.playbackState, play, pause]);

  const handleSeek = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const position = parseFloat(e.target.value) / 100;
      seek(position);
    },
    [seek]
  );

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value) / 100;
      setVolume(newVolume);
    },
    [setVolume]
  );

  const handleClose = useCallback(() => {
    stop();
    onClose();
  }, [stop, onClose]);

  /* --------------------------------------------------------------------------
     Derived State
     -------------------------------------------------------------------------- */
  const isPlaying = state.playbackState === 'playing';
  const isLoading = state.isLoading || state.playbackState === 'loading';
  const isComplete = state.playbackState === 'complete';
  const currentTime = formatTime(state.currentTime);
  const totalTime = formatTime(state.duration || track.durationSeconds);

  /* --------------------------------------------------------------------------
     Render
     -------------------------------------------------------------------------- */
  return (
    <div className={styles.container}>
      {/* Close button */}
      <button className={styles.closeButton} onClick={handleClose} aria-label="Close player">
        <CloseIcon />
      </button>

      {/* Track Info */}
      <div className={styles.trackInfo}>
        <span className={styles.trackType}>{MEDITATION_TYPE_LABELS[track.type]}</span>
        <h2 className={styles.trackName}>{track.name}</h2>
        <span className={styles.trackDuration}>{formatDuration(track.durationSeconds)}</span>
      </div>

      {/* Description */}
      <p className={styles.description}>{track.description}</p>

      {/* Visual indicator */}
      <div className={styles.visual}>
        <div className={`${styles.pulseRing} ${isPlaying ? styles.playing : ''}`} />
        <div
          className={`${styles.pulseRing} ${styles.pulseRingDelayed} ${isPlaying ? styles.playing : ''}`}
        />
        <div className={styles.iconContainer}>
          {isComplete ? (
            <span className={styles.checkmark}>✓</span>
          ) : (
            <span className={styles.meditationEmoji}>🧘</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className={styles.progressContainer}>
        <span className={styles.time}>{currentTime}</span>
        <input
          type="range"
          className={styles.progressBar}
          min="0"
          max="100"
          value={state.progress || 0}
          onChange={handleSeek}
          aria-label="Seek"
          disabled={isLoading}
        />
        <span className={styles.time}>{totalTime}</span>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <button
          className={styles.playButton}
          onClick={handlePlayPause}
          disabled={isLoading}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <span className={styles.loadingSpinner} />
          ) : isComplete ? (
            <span>↻</span>
          ) : isPlaying ? (
            <span>⏸</span>
          ) : (
            <span>▶</span>
          )}
        </button>
      </div>

      {/* Volume control */}
      <div className={styles.volumeContainer}>
        <span className={styles.volumeIcon}>🔊</span>
        <input
          type="range"
          className={styles.volumeSlider}
          min="0"
          max="100"
          value={volume * 100}
          onChange={handleVolumeChange}
          aria-label="Volume"
        />
      </div>

      {/* Error message */}
      {state.error && <p className={styles.error}>Failed to load audio. Please try again.</p>}

      {/* Attribution */}
      <div className={styles.attribution}>
        <p>{UCLA_ATTRIBUTION}</p>
      </div>
    </div>
  );
}
