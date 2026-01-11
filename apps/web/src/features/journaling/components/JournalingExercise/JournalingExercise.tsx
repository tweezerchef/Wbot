/* ============================================================================
   JournalingExercise Component
   ============================================================================
   Main component for the journaling activity. Manages the full flow:
   1. Idle - Shows prompt and start button
   2. Writing - Shows text editor
   3. Mood After - Optional mood check after writing
   4. Complete - Shows completion with share option
   ============================================================================ */

import type { MoodRating } from '@wbot/shared';
import { useCallback, useRef, useState } from 'react';

import {
  CATEGORY_INFO,
  type JournalingExerciseProps,
  type JournalingState,
  type JournalSessionData,
} from '../../types';

import { JournalEditor } from './JournalEditor';
import styles from './JournalingExercise.module.css';
import { PromptDisplay } from './PromptDisplay';

import { MoodCheck } from '@/features/wellness';

/**
 * JournalingExercise - Interactive journaling component.
 *
 * Features:
 * - AI-selected prompts with category-based styling
 * - Focused text editor with word count
 * - Optional mood tracking after writing
 * - Share with AI for continued discussion
 */
export function JournalingExercise({
  prompt,
  introduction,
  enableSharing = true,
  onComplete,
  onStop,
  onShare,
}: JournalingExerciseProps) {
  const [uiState, setUIState] = useState<JournalingState>('idle');
  const [moodAfter, setMoodAfter] = useState<MoodRating | undefined>();
  const [entryText, setEntryText] = useState('');
  const [wordCount, setWordCount] = useState(0);

  // Track writing time
  const startTimeRef = useRef<number | null>(null);

  const categoryInfo = CATEGORY_INFO[prompt.category];

  // Start writing
  const handleStartWriting = useCallback(() => {
    startTimeRef.current = Date.now();
    setUIState('writing');
  }, []);

  // Save entry from editor
  const handleSaveEntry = useCallback((text: string, words: number) => {
    setEntryText(text);
    setWordCount(words);
    setUIState('mood_after');
  }, []);

  // Cancel writing
  const handleCancelWriting = useCallback(() => {
    setUIState('idle');
    startTimeRef.current = null;
    onStop?.();
  }, [onStop]);

  // Skip mood check
  const handleSkipMood = useCallback(() => {
    const duration = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0;

    const sessionData: JournalSessionData = {
      promptId: prompt.id,
      promptCategory: prompt.category,
      promptText: prompt.text,
      entryText,
      wordCount,
      writingDurationSeconds: duration,
      moodAfter: undefined,
      sharedWithAI: false,
    };

    setUIState('complete');
    onComplete?.(sessionData);
  }, [prompt, entryText, wordCount, onComplete]);

  // Select mood after writing
  const handleMoodAfterSelect = useCallback(
    (mood: MoodRating) => {
      setMoodAfter(mood);

      const duration = startTimeRef.current
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : 0;

      const sessionData: JournalSessionData = {
        promptId: prompt.id,
        promptCategory: prompt.category,
        promptText: prompt.text,
        entryText,
        wordCount,
        writingDurationSeconds: duration,
        moodAfter: mood,
        sharedWithAI: false,
      };

      setUIState('complete');
      onComplete?.(sessionData);
    },
    [prompt, entryText, wordCount, onComplete]
  );

  // Share entry with AI
  const handleShareWithAI = useCallback(() => {
    onShare?.(entryText);
    setUIState('sharing');
  }, [entryText, onShare]);

  // Render based on current state
  const renderContent = () => {
    switch (uiState) {
      case 'idle':
        return (
          <div className={styles.idleContainer}>
            {/* Introduction */}
            {introduction && <p className={styles.introduction}>{introduction}</p>}

            {/* Prompt display */}
            <PromptDisplay prompt={prompt} />

            {/* Start button */}
            <button type="button" className={styles.startButton} onClick={handleStartWriting}>
              <span className={styles.startIcon}>{categoryInfo.emoji}</span>
              Start Writing
            </button>
          </div>
        );

      case 'writing':
        return (
          <JournalEditor
            prompt={prompt}
            onSave={handleSaveEntry}
            onCancel={handleCancelWriting}
            autoFocus
          />
        );

      case 'mood_after':
        return (
          <div className={styles.moodContainer}>
            <MoodCheck
              label="How do you feel after writing?"
              onSelect={handleMoodAfterSelect}
              onSkip={handleSkipMood}
            />
          </div>
        );

      case 'complete':
        return (
          <div className={styles.completeContainer}>
            <div className={styles.completeIcon}>✨</div>
            <h3 className={styles.completeTitle}>Entry Saved</h3>
            <p className={styles.completeMessage}>
              You wrote {wordCount} {wordCount === 1 ? 'word' : 'words'}.
              {moodAfter && ' Great job reflecting!'}
            </p>

            {/* Share with AI option */}
            {enableSharing && onShare && (
              <button type="button" className={styles.shareButton} onClick={handleShareWithAI}>
                💬 Share with AI to discuss
              </button>
            )}
          </div>
        );

      case 'sharing':
        return (
          <div className={styles.sharingContainer}>
            <div className={styles.sharingIcon}>💬</div>
            <p className={styles.sharingMessage}>
              Your entry has been shared. The AI will respond shortly.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className={styles.container}>{renderContent()}</div>;
}
