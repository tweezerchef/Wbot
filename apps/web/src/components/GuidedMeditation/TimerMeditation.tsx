/* ============================================================================
   TimerMeditation Component
   ============================================================================
   A silent meditation timer with optional ambient sounds and binaural beats.
   No voice guidance - just a countdown timer for self-guided practice.
   ============================================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';

import { MeditationVisual } from './MeditationVisual';
import styles from './TimerMeditation.module.css';
import type { AmbientSoundType } from './types';
import { useAmbientMixer } from './useAmbientMixer';
import { useBinauralBeats, type BinauralFrequency } from './useBinauralBeats';

export interface TimerMeditationProps {
  /** Initial duration in minutes */
  initialMinutes?: number;
  /** Enable ambient sounds */
  enableAmbient?: boolean;
  /** Enable binaural beats */
  enableBinaural?: boolean;
  /** Callback when timer completes */
  onComplete?: () => void;
  /** Callback when stopped early */
  onStop?: (elapsedSeconds: number) => void;
}

type TimerState = 'setup' | 'running' | 'paused' | 'complete';

const DURATION_OPTIONS = [3, 5, 10, 15, 20, 30];

export function TimerMeditation({
  initialMinutes = 10,
  enableAmbient = true,
  enableBinaural = true,
  onComplete,
  onStop,
}: TimerMeditationProps) {
  const [state, setState] = useState<TimerState>('setup');
  const [selectedMinutes, setSelectedMinutes] = useState(initialMinutes);
  const [remainingSeconds, setRemainingSeconds] = useState(initialMinutes * 60);
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>('none');
  const [binauralFreq, setBinauralFreq] = useState<BinauralFrequency>('theta');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Ambient mixer
  const ambient = useAmbientMixer({
    enabled: enableAmbient && ambientSound !== 'none',
    sound: ambientSound,
    volume: 0.4,
  });

  // Binaural beats
  const binaural = useBinauralBeats({
    enabled: enableBinaural,
    frequency: binauralFreq,
    volume: 0.25,
  });

  // Start timer
  const start = useCallback(() => {
    setRemainingSeconds(selectedMinutes * 60);
    startTimeRef.current = Date.now();
    setState('running');

    if (enableAmbient && ambientSound !== 'none') {
      void ambient.play();
    }
    if (enableBinaural) {
      binaural.start();
    }

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [selectedMinutes, enableAmbient, enableBinaural, ambientSound, ambient, binaural]);

  // Pause timer
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState('paused');
  }, []);

  // Resume timer
  const resume = useCallback(() => {
    setState('running');
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Stop timer
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    ambient.stop();
    binaural.stop();

    const elapsed = selectedMinutes * 60 - remainingSeconds;
    setState('setup');
    setRemainingSeconds(selectedMinutes * 60);
    onStop?.(elapsed);
  }, [selectedMinutes, remainingSeconds, ambient, binaural, onStop]);

  // Handle completion
  useEffect(() => {
    if (remainingSeconds === 0 && state === 'running') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      ambient.fadeOut(3);
      binaural.fadeOut(3);
      setState('complete');
      onComplete?.();
    }
  }, [remainingSeconds, state, ambient, binaural, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins)}:${secs.toString().padStart(2, '0')}`;
  };

  // Setup screen
  if (state === 'setup') {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>Silent Meditation Timer</h3>

        <div className={styles.durationSelector}>
          <p className={styles.label}>Duration</p>
          <div className={styles.durationOptions}>
            {DURATION_OPTIONS.map((mins) => (
              <button
                key={mins}
                className={`${styles.durationButton} ${selectedMinutes === mins ? styles.selected : ''}`}
                onClick={() => { setSelectedMinutes(mins); }}
              >
                {mins} min
              </button>
            ))}
          </div>
        </div>

        {enableAmbient && (
          <div className={styles.optionGroup}>
            <p className={styles.label}>Ambient Sound</p>
            <select
              className={styles.select}
              value={ambientSound}
              onChange={(e) => { setAmbientSound(e.target.value as AmbientSoundType); }}
            >
              <option value="none">None</option>
              <option value="ocean">Ocean Waves</option>
              <option value="rain">Gentle Rain</option>
              <option value="forest">Forest</option>
            </select>
          </div>
        )}

        {enableBinaural && (
          <div className={styles.optionGroup}>
            <p className={styles.label}>Binaural Beats</p>
            <select
              className={styles.select}
              value={binauralFreq}
              onChange={(e) => { setBinauralFreq(e.target.value as BinauralFrequency); }}
            >
              <option value="theta">Theta (Deep meditation)</option>
              <option value="alpha">Alpha (Relaxation)</option>
              <option value="delta">Delta (Deep rest)</option>
            </select>
            <p className={styles.hint}>Use headphones for binaural beats</p>
          </div>
        )}

        <button className={styles.startButton} onClick={start}>
          Begin Meditation
        </button>
      </div>
    );
  }

  // Running/Paused screen
  if (state === 'running' || state === 'paused') {
    return (
      <div className={styles.container}>
        <div className={styles.visualContainer}>
          <MeditationVisual
            playbackState={state === 'running' ? 'playing' : 'paused'}
            variant="orb"
            size={140}
          />
        </div>

        <div className={styles.timerDisplay}>
          {formatTime(remainingSeconds)}
        </div>

        <p className={styles.statusText}>
          {state === 'running' ? 'Breathe and relax...' : 'Paused'}
        </p>

        <div className={styles.controls}>
          {state === 'running' ? (
            <button className={styles.controlButton} onClick={pause}>
              Pause
            </button>
          ) : (
            <button className={styles.controlButton} onClick={resume}>
              Resume
            </button>
          )}
          <button className={`${styles.controlButton} ${styles.stopButton}`} onClick={stop}>
            Stop
          </button>
        </div>
      </div>
    );
  }

  // Complete screen
  return (
    <div className={styles.container}>
      <div className={styles.completeIcon}>✓</div>
      <h3 className={styles.title}>Well Done!</h3>
      <p className={styles.message}>
        You completed a {selectedMinutes}-minute silent meditation.
      </p>
      <button
        className={styles.startButton}
        onClick={() => { setState('setup'); }}
      >
        Meditate Again
      </button>
    </div>
  );
}
