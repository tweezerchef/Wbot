import { useState, useCallback, useMemo } from 'react';

import { BreathingBackground } from './BreathingBackground';
import styles from './ImmersiveBreathingConfirmation.module.css';
import type { ImmersiveBreathingConfirmationProps } from './types';

import type { BreathingTechnique } from '@/components/BreathingExercise/types';

/**
 * ImmersiveBreathingConfirmation - Full-screen HITL confirmation
 *
 * Displays before starting a breathing exercise, allowing the user to:
 * - See the proposed technique and explanation
 * - Select a different technique if desired
 * - Confirm to begin or decline
 *
 * Features:
 * - Animated gradient background (same as breathing experience)
 * - Glassmorphism card that slides up
 * - Technique selector with animated options
 * - "Begin" and "Not now" buttons
 *
 * @example
 * ```tsx
 * <ImmersiveBreathingConfirmation
 *   proposedTechnique={BREATHING_TECHNIQUES.box}
 *   message="Let's try some calming breathing..."
 *   availableTechniques={[...techniques]}
 *   onConfirm={(technique) => startExercise(technique)}
 *   onDecline={() => closeOverlay()}
 * />
 * ```
 */
export function ImmersiveBreathingConfirmation({
  proposedTechnique,
  message,
  availableTechniques,
  onConfirm,
  onDecline,
}: ImmersiveBreathingConfirmationProps) {
  // Track selected technique (starts with proposed)
  const [selectedTechnique, setSelectedTechnique] = useState<BreathingTechnique>(proposedTechnique);

  // Track if technique selector is expanded
  const [selectorExpanded, setSelectorExpanded] = useState(false);

  // Handle technique selection
  const handleSelectTechnique = useCallback((technique: BreathingTechnique) => {
    setSelectedTechnique(technique);
    setSelectorExpanded(false);
  }, []);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    onConfirm(selectedTechnique);
  }, [selectedTechnique, onConfirm]);

  // Format timing display
  const timingDisplay = useMemo(() => {
    return selectedTechnique.durations.join('-');
  }, [selectedTechnique]);

  // Filter out currently selected from dropdown options
  const otherTechniques = useMemo(() => {
    return availableTechniques.filter((t) => t.id !== selectedTechnique.id);
  }, [availableTechniques, selectedTechnique]);

  return (
    <div className={styles.container}>
      {/* Background animation */}
      <BreathingBackground phase="inhale" isActive={false} />

      {/* Card content */}
      <div className={styles.card}>
        {/* AI message */}
        <p className={styles.message}>{message}</p>

        {/* Technique selector */}
        <div className={styles.techniqueSection}>
          <button
            type="button"
            className={`${styles.selectedTechnique} ${selectorExpanded ? styles.expanded : ''}`}
            onClick={() => {
              setSelectorExpanded(!selectorExpanded);
            }}
            aria-expanded={selectorExpanded}
            aria-haspopup="listbox"
          >
            <div className={styles.techniqueInfo}>
              <span className={styles.techniqueName}>{selectedTechnique.name}</span>
              <span className={styles.techniqueTiming}>{timingDisplay} seconds</span>
            </div>
            <span className={styles.dropdownIcon} aria-hidden="true">
              {selectorExpanded ? '▲' : '▼'}
            </span>
          </button>

          {/* Dropdown */}
          {selectorExpanded && otherTechniques.length > 0 && (
            <ul className={styles.dropdown} role="listbox" aria-label="Select breathing technique">
              {otherTechniques.map((technique) => (
                <li key={technique.id}>
                  <button
                    type="button"
                    className={styles.dropdownItem}
                    onClick={() => {
                      handleSelectTechnique(technique);
                    }}
                    role="option"
                    aria-selected={false}
                  >
                    <span className={styles.techniqueName}>{technique.name}</span>
                    <span className={styles.techniqueTiming}>{technique.durations.join('-')}s</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Description */}
        <p className={styles.description}>{selectedTechnique.description}</p>

        {/* Actions */}
        <div className={styles.actions}>
          <button type="button" className={styles.beginButton} onClick={handleConfirm}>
            Begin Exercise
          </button>
          <button type="button" className={styles.declineButton} onClick={onDecline}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
