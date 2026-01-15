/* ============================================================================
   Journaling Confirmation Component
   ============================================================================
   Inline chat card for confirming journaling prompt selection.

   This component renders when the AI suggests a journaling prompt, allowing
   the user to:
   - Start with the suggested prompt
   - Choose a different prompt
   - Decline the activity ("Maybe later")
   ============================================================================ */

import { useState } from 'react';

import {
  CATEGORY_INFO,
  type JournalingConfirmationProps,
  type JournalingPrompt,
} from '../../types';

import styles from './JournalingConfirmation.module.css';

/* ----------------------------------------------------------------------------
   Journal Icon Component
   ---------------------------------------------------------------------------- */

function JournalIcon({ className }: { className?: string }) {
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
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="M8 7h6" />
      <path d="M8 11h8" />
    </svg>
  );
}

/* ----------------------------------------------------------------------------
   Main Component
   ---------------------------------------------------------------------------- */

export function JournalingConfirmation({
  proposedPrompt,
  message,
  availablePrompts,
  onConfirm,
  onDecline,
}: JournalingConfirmationProps) {
  // Track if the prompt selector is open
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // Track the currently selected prompt (starts with proposed)
  const [selectedPrompt, setSelectedPrompt] = useState(proposedPrompt);

  // Get category info for the selected prompt
  const categoryInfo = CATEGORY_INFO[selectedPrompt.category];

  // Handle starting the journaling activity
  const handleStart = () => {
    onConfirm(selectedPrompt);
  };

  // Handle selecting a different prompt
  const handleSelectPrompt = (prompt: JournalingPrompt) => {
    setSelectedPrompt(prompt);
    setIsDropdownOpen(false);
  };

  // Group prompts by category for the dropdown
  const groupedPrompts = availablePrompts.reduce<Record<string, JournalingPrompt[]>>(
    (acc, prompt) => {
      const category = prompt.category;

      const existing = acc[category] ?? [];
      return { ...acc, [category]: [...existing, prompt] };
    },
    {}
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <JournalIcon className={styles.icon} />
        <h3 className={styles.title}>Journaling</h3>
      </div>

      {/* AI's personalized message */}
      <p className={styles.message}>{message}</p>

      {/* Selected prompt card */}
      <div className={styles.promptCard}>
        <div className={styles.promptHeader}>
          <span
            className={styles.categoryBadge}
            style={{ '--category-color': categoryInfo.color } as React.CSSProperties}
          >
            <span className={styles.categoryEmoji}>{categoryInfo.emoji}</span>
            <span>{categoryInfo.label}</span>
          </span>
          <span className={styles.timeEstimate}>~{selectedPrompt.estimated_time_minutes} min</span>
        </div>
        <p className={styles.promptText}>{selectedPrompt.text}</p>
        {selectedPrompt.best_for.length > 0 && (
          <div className={styles.bestFor}>
            {selectedPrompt.best_for.slice(0, 3).map((tag) => (
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
          Start Writing
        </button>

        {/* Prompt selector dropdown */}
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
              {Object.entries(groupedPrompts).map(([category, prompts]) => {
                const catInfo = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
                return (
                  <div key={category} className={styles.dropdownCategory}>
                    <div className={styles.dropdownCategoryHeader}>
                      <span>{catInfo.emoji}</span>
                      <span>{catInfo.label}</span>
                    </div>
                    {prompts
                      .filter((p) => p.id !== selectedPrompt.id)
                      .map((prompt) => (
                        <button
                          key={prompt.id}
                          className={styles.dropdownItem}
                          onClick={() => {
                            handleSelectPrompt(prompt);
                          }}
                          role="option"
                        >
                          <span className={styles.dropdownItemText}>
                            {prompt.text.slice(0, 60)}...
                          </span>
                        </button>
                      ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Decline option */}
      <button className={styles.declineLink} onClick={onDecline}>
        Maybe later
      </button>
    </div>
  );
}
