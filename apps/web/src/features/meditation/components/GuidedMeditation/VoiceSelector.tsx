/* ============================================================================
   VoiceSelector Component
   ============================================================================
   Voice selection UI for AI-generated meditations.

   Displays a grid of available voices with names, descriptions, and preview
   capability. Users can preview each voice and select one for their meditation.

   Features:
   - Grid layout with voice cards
   - Voice preview playback
   - Visual selection indicator
   - Keyboard accessible
   ============================================================================ */

import { useCallback, useRef, useState } from 'react';

import type { AIMeditationVoice } from '../../types';

import styles from './VoiceSelector.module.css';

interface VoiceSelectorProps {
  /** Available voices to choose from */
  voices: AIMeditationVoice[];
  /** Currently selected voice ID (null if none selected) */
  selectedVoiceId: string | null;
  /** Callback when a voice is selected */
  onSelect: (voice: AIMeditationVoice) => void;
  /** Callback when selection is confirmed */
  onConfirm: () => void;
  /** Callback to cancel voice selection */
  onCancel?: () => void;
  /** Whether the component is in a loading state */
  isLoading?: boolean;
}

/**
 * Voice selection grid for AI-generated meditations
 *
 * Displays available voices with descriptions and preview capability.
 * Supports keyboard navigation and screen reader accessibility.
 */
export function VoiceSelector({
  voices,
  selectedVoiceId,
  onSelect,
  onConfirm,
  onCancel,
  isLoading = false,
}: VoiceSelectorProps) {
  // Track which voice preview is currently playing
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle voice card click
  const handleVoiceClick = useCallback(
    (voice: AIMeditationVoice) => {
      // Stop any playing preview
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setPlayingPreviewId(null);
      }
      onSelect(voice);
    },
    [onSelect]
  );

  // Handle preview button click
  const handlePreviewClick = useCallback(
    (e: React.MouseEvent, voice: AIMeditationVoice) => {
      e.stopPropagation(); // Don't trigger card selection

      // If this preview is already playing, stop it
      if (playingPreviewId === voice.id && audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setPlayingPreviewId(null);
        return;
      }

      // Stop any currently playing preview
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Play new preview if URL is available
      if (voice.preview_url) {
        const audio = new Audio(voice.preview_url);
        audioRef.current = audio;
        setPlayingPreviewId(voice.id);

        audio.addEventListener('ended', () => {
          setPlayingPreviewId(null);
          audioRef.current = null;
        });

        audio.addEventListener('error', () => {
          setPlayingPreviewId(null);
          audioRef.current = null;
        });

        audio.play().catch(() => {
          setPlayingPreviewId(null);
          audioRef.current = null;
        });
      }
    },
    [playingPreviewId]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, voice: AIMeditationVoice) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleVoiceClick(voice);
      }
    },
    [handleVoiceClick]
  );

  // Get the selected voice object
  const selectedVoice = voices.find((v) => v.id === selectedVoiceId);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Choose Your Voice</h3>
        <p className={styles.subtitle}>Select a voice for your personalized meditation</p>
      </div>

      <div className={styles.voiceGrid} role="listbox" aria-label="Available voices">
        {voices.map((voice) => {
          const isSelected = selectedVoiceId === voice.id;
          const isPlayingPreview = playingPreviewId === voice.id;

          return (
            <div
              key={voice.id}
              className={`${styles.voiceCard} ${isSelected ? styles.voiceCardSelected : ''}`}
              onClick={() => {
                handleVoiceClick(voice);
              }}
              onKeyDown={(e) => {
                handleKeyDown(e, voice);
              }}
              role="option"
              aria-selected={isSelected}
              tabIndex={0}
              data-testid={`voice-option-${voice.id}`}
              data-selected={isSelected}
            >
              {/* Selection indicator */}
              <div className={styles.selectionIndicator}>
                {isSelected && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>

              {/* Voice info */}
              <div className={styles.voiceInfo}>
                <h4 className={styles.voiceName}>{voice.name}</h4>
                <p className={styles.voiceDescription}>{voice.description}</p>

                {voice.best_for.length > 0 && (
                  <div className={styles.bestFor}>
                    <span className={styles.bestForLabel}>Best for:</span>
                    <span className={styles.bestForTags}>
                      {voice.best_for.slice(0, 2).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Preview button */}
              {voice.preview_url && (
                <button
                  className={`${styles.previewButton} ${isPlayingPreview ? styles.previewButtonPlaying : ''}`}
                  onClick={(e) => {
                    handlePreviewClick(e, voice);
                  }}
                  aria-label={
                    isPlayingPreview ? `Stop ${voice.name} preview` : `Preview ${voice.name}`
                  }
                  data-testid={`preview-voice-${voice.id}`}
                >
                  {isPlayingPreview ? (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        {onCancel && (
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        )}

        <button
          className={`${styles.button} ${styles.buttonPrimary}`}
          onClick={onConfirm}
          disabled={!selectedVoice || isLoading}
          data-testid="confirm-voice"
        >
          {isLoading ? (
            <>
              <span className={styles.spinner} />
              Preparing...
            </>
          ) : (
            `Continue with ${selectedVoice?.name ?? 'Selected Voice'}`
          )}
        </button>
      </div>

      {/* Hidden audio element for previews */}
      <audio
        ref={audioRef as React.RefObject<HTMLAudioElement>}
        data-testid="voice-preview-audio"
        style={{ display: 'none' }}
      />
    </div>
  );
}
