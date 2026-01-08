/* ============================================================================
   Voice Selection Confirmation Component
   ============================================================================
   Inline chat card for confirming meditation voice selection.

   This component renders when the AI suggests a meditation, allowing
   the user to:
   - Start with the recommended voice
   - Choose a different voice
   - Cancel the meditation ("Not now")

   Styled to match the wellness theme with calming colors and smooth animations.
   ============================================================================ */

import { useState } from 'react';

import styles from './VoiceSelectionConfirmation.module.css';

import type { VoiceInfo } from '@/lib/ai-client';

/* ----------------------------------------------------------------------------
   Types
   ---------------------------------------------------------------------------- */

interface VoiceSelectionConfirmationProps {
  /** Personalized message from the AI */
  message: string;
  /** All available voices the user can choose from */
  availableVoices: VoiceInfo[];
  /** The AI-recommended voice ID */
  recommendedVoice: string;
  /** Preview of what the meditation will focus on */
  meditationPreview: string;
  /** Duration of the meditation in minutes */
  durationMinutes: number;
  /** Callback when user makes a decision */
  onConfirm: (decision: 'confirm' | 'cancel', voiceId?: string) => void;
}

/* ----------------------------------------------------------------------------
   Meditation/Lotus Icon Component
   ---------------------------------------------------------------------------- */

function MeditationIcon({ className }: { className?: string }) {
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
      {/* Lotus flower meditation icon */}
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2" />
      <path d="M12 9v-4" />
      <path d="M12 19v-4" />
      <path d="M9 12H5" />
      <path d="M19 12h-4" />
    </svg>
  );
}

/* ----------------------------------------------------------------------------
   Speaker/Voice Icon Component
   ---------------------------------------------------------------------------- */

function SpeakerIcon({ className }: { className?: string }) {
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
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

/* ----------------------------------------------------------------------------
   Main Component
   ---------------------------------------------------------------------------- */

export function VoiceSelectionConfirmation({
  message,
  availableVoices,
  recommendedVoice,
  meditationPreview,
  durationMinutes,
  onConfirm,
}: VoiceSelectionConfirmationProps) {
  // Find the recommended voice object
  const defaultVoice = availableVoices.find((v) => v.id === recommendedVoice) ?? availableVoices[0];

  // Track if the voice selector dropdown is open
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Track the currently selected voice (starts with recommended)
  const [selectedVoice, setSelectedVoice] = useState<VoiceInfo>(defaultVoice);

  // Handle starting the meditation
  const handleStart = () => {
    onConfirm('confirm', selectedVoice.id);
  };

  // Handle cancelling the meditation
  const handleCancel = () => {
    onConfirm('cancel');
  };

  // Handle selecting a different voice
  const handleSelectVoice = (voice: VoiceInfo) => {
    setSelectedVoice(voice);
    setIsDropdownOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <MeditationIcon className={styles.icon} />
        <h3 className={styles.title}>Guided Meditation</h3>
      </div>

      {/* AI's personalized message */}
      <p className={styles.message}>{message}</p>

      {/* Meditation preview card */}
      <div className={styles.previewCard}>
        <div className={styles.previewHeader}>
          <span className={styles.previewLabel}>Your meditation</span>
          <span className={styles.duration}>{durationMinutes} min</span>
        </div>
        <p className={styles.previewText}>{meditationPreview}</p>
      </div>

      {/* Selected voice card */}
      <div className={styles.voiceCard}>
        <div className={styles.voiceHeader}>
          <SpeakerIcon className={styles.voiceIcon} />
          <span className={styles.voiceLabel}>Voice</span>
        </div>
        <div className={styles.voiceInfo}>
          <span className={styles.voiceName}>{selectedVoice.name}</span>
          <span className={styles.voiceDescription}>{selectedVoice.description}</span>
        </div>
        {selectedVoice.best_for.length > 0 && (
          <div className={styles.bestFor}>
            <span className={styles.bestForLabel}>Best for:</span>
            {selectedVoice.best_for.slice(0, 3).map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className={styles.buttonGroup}>
        <button className={styles.startButton} onClick={handleStart}>
          Start Meditation
        </button>

        {/* Voice selector dropdown */}
        <div className={styles.dropdownContainer}>
          <button
            className={styles.dropdownButton}
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
            }}
            aria-expanded={isDropdownOpen}
            aria-haspopup="listbox"
          >
            Change voice
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
              {availableVoices
                .filter((v) => v.id !== selectedVoice.id)
                .map((voice) => (
                  <button
                    key={voice.id}
                    className={styles.dropdownItem}
                    onClick={() => {
                      handleSelectVoice(voice);
                    }}
                    role="option"
                  >
                    <div className={styles.dropdownItemContent}>
                      <span className={styles.dropdownItemName}>{voice.name}</span>
                      <span className={styles.dropdownItemDescription}>{voice.description}</span>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Cancel option */}
      <button className={styles.cancelLink} onClick={handleCancel}>
        Not now
      </button>
    </div>
  );
}
