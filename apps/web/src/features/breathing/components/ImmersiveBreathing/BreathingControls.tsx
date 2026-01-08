import { useCallback, type KeyboardEvent } from 'react';

import type { BreathingControlsProps } from '../../types';

import styles from './BreathingControls.module.css';

/**
 * BreathingControls - Floating control bar for the breathing experience
 *
 * Provides pause/resume, stop, and audio toggle controls in a
 * glassmorphism-styled bar at the bottom of the screen.
 *
 * Layout:
 * - Left: Stop button (secondary)
 * - Center: Pause/Resume button (primary, larger)
 * - Right: Audio toggle button (secondary)
 *
 * @example
 * ```tsx
 * <BreathingControls
 *   isPaused={false}
 *   onPause={handlePause}
 *   onResume={handleResume}
 *   onStop={handleStop}
 *   audioEnabled={true}
 *   onToggleAudio={handleToggleAudio}
 * />
 * ```
 */
export function BreathingControls({
  isPaused,
  onPause,
  onResume,
  onStop,
  audioEnabled,
  onToggleAudio,
}: BreathingControlsProps) {
  // Handle pause/resume toggle
  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  }, [isPaused, onPause, onResume]);

  // Keyboard handler for buttons
  const handleKeyDown = useCallback((e: KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  }, []);

  return (
    <div className={styles.controls} role="toolbar" aria-label="Exercise controls">
      {/* Stop button */}
      <button
        type="button"
        className={`${styles.button} ${styles.secondaryButton} ${styles.stopButton}`}
        onClick={onStop}
        onKeyDown={(e) => {
          handleKeyDown(e, onStop);
        }}
        aria-label="Stop exercise"
      >
        <span className={`${styles.icon} ${styles.stopIcon}`} aria-hidden="true" />
      </button>

      {/* Pause/Resume button (primary) */}
      <button
        type="button"
        className={`${styles.button} ${styles.primaryButton}`}
        onClick={handlePauseResume}
        onKeyDown={(e) => {
          handleKeyDown(e, handlePauseResume);
        }}
        aria-label={isPaused ? 'Resume exercise' : 'Pause exercise'}
      >
        <span
          className={`${styles.icon} ${isPaused ? styles.playIcon : styles.pauseIcon}`}
          aria-hidden="true"
        />
      </button>

      {/* Audio toggle button */}
      <button
        type="button"
        className={`${styles.button} ${styles.secondaryButton} ${audioEnabled ? styles.audioActive : styles.audioMuted}`}
        onClick={onToggleAudio}
        onKeyDown={(e) => {
          handleKeyDown(e, onToggleAudio);
        }}
        aria-label={audioEnabled ? 'Mute audio' : 'Enable audio'}
        aria-pressed={audioEnabled}
      >
        <span className={`${styles.icon} ${styles.audioIcon}`} aria-hidden="true" />
      </button>
    </div>
  );
}
