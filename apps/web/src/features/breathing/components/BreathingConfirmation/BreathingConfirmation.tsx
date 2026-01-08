/* ============================================================================
   Breathing Confirmation Component
   ============================================================================
   Inline chat card for confirming breathing exercise technique selection.

   This component renders when the AI suggests a breathing exercise, allowing
   the user to:
   - Start with the suggested technique
   - Choose a different technique
   - Decline the exercise ("Maybe later")

   Styled to match the wellness theme with calming colors and smooth animations.
   ============================================================================ */

import { useState } from 'react';

import styles from './BreathingConfirmation.module.css';

import type { BreathingTechniqueInfo } from '@/lib/ai-client';

/* ----------------------------------------------------------------------------
   Types
   ---------------------------------------------------------------------------- */

interface BreathingConfirmationProps {
  /** The AI-suggested breathing technique */
  proposedTechnique: BreathingTechniqueInfo;
  /** Personalized message from the AI */
  message: string;
  /** All available techniques the user can choose from */
  availableTechniques: BreathingTechniqueInfo[];
  /** Callback when user makes a decision */
  onConfirm: (decision: 'start' | 'change_technique' | 'not_now', techniqueId?: string) => void;
}

/* ----------------------------------------------------------------------------
   Wind/Breath Icon Component
   ---------------------------------------------------------------------------- */

function WindIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  );
}

/* ----------------------------------------------------------------------------
   Main Component
   ---------------------------------------------------------------------------- */

export function BreathingConfirmation({
  proposedTechnique,
  message,
  availableTechniques,
  onConfirm,
}: BreathingConfirmationProps) {
  // Track if the technique selector dropdown is open
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Track the currently selected technique (starts with proposed)
  const [selectedTechnique, setSelectedTechnique] = useState(proposedTechnique);

  // Handle starting the exercise
  const handleStart = () => {
    // If user changed the technique, send change_technique decision
    if (selectedTechnique.id !== proposedTechnique.id) {
      onConfirm('change_technique', selectedTechnique.id);
    } else {
      onConfirm('start');
    }
  };

  // Handle declining the exercise
  const handleDecline = () => {
    onConfirm('not_now');
  };

  // Handle selecting a different technique
  const handleSelectTechnique = (technique: BreathingTechniqueInfo) => {
    setSelectedTechnique(technique);
    setIsDropdownOpen(false);
  };

  // Format duration for display (e.g., "4-4-4-4" for box breathing)
  const formatDuration = (durations: [number, number, number, number]) => {
    return durations.filter((d) => d > 0).join('-');
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <WindIcon className={styles.icon} />
        <h3 className={styles.title}>Breathing Exercise</h3>
      </div>

      {/* AI's personalized message */}
      <p className={styles.message}>{message}</p>

      {/* Selected technique card */}
      <div className={styles.techniqueCard}>
        <div className={styles.techniqueHeader}>
          <span className={styles.techniqueName}>{selectedTechnique.name}</span>
          <span className={styles.techniqueTiming}>
            {formatDuration(selectedTechnique.durations)}
          </span>
        </div>
        <p className={styles.techniqueDescription}>{selectedTechnique.description}</p>
        {selectedTechnique.best_for.length > 0 && (
          <div className={styles.bestFor}>
            <span className={styles.bestForLabel}>Best for:</span>
            {selectedTechnique.best_for.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={styles.buttonGroup}>
        <button className={styles.startButton} onClick={handleStart}>
          Start
        </button>

        {/* Technique selector dropdown */}
        <div className={styles.dropdownContainer}>
          <button
            className={styles.dropdownButton}
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
            }}
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
          >
            Try different
            <svg
              className={`${styles.dropdownArrow} ${isDropdownOpen ? styles.dropdownArrowOpen : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className={styles.dropdown} role="listbox">
              {availableTechniques
                .filter((t) => t.id !== selectedTechnique.id)
                .map((technique) => (
                  <button
                    key={technique.id}
                    className={styles.dropdownItem}
                    onClick={() => {
                      handleSelectTechnique(technique);
                    }}
                    role="option"
                  >
                    <span className={styles.dropdownItemName}>{technique.name}</span>
                    <span className={styles.dropdownItemTiming}>
                      {formatDuration(technique.durations)}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Decline option */}
      <button className={styles.declineLink} onClick={handleDecline}>
        Maybe later
      </button>
    </div>
  );
}
