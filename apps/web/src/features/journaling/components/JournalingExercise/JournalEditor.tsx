/* ============================================================================
   JournalEditor Component
   ============================================================================
   A text editor for writing journal entries with word count tracking.
   Provides a focused writing experience with minimal distractions.
   ============================================================================ */

import { useCallback, useEffect, useRef, useState } from 'react';

import type { JournalEditorProps } from '../../types';

import styles from './JournalingExercise.module.css';

/**
 * Counts words in a string, handling various edge cases.
 */
function countWords(text: string): number {
  if (!text.trim()) {
    return 0;
  }
  // Split on whitespace and filter empty strings
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * JournalEditor - A focused text editor for journal entries.
 *
 * Features:
 * - Auto-expanding textarea
 * - Real-time word count
 * - Optional minimum word requirement
 * - Follow-up questions as writing prompts
 */
export function JournalEditor({
  prompt,
  onSave,
  onCancel,
  minWords = 0,
  autoFocus = true,
}: JournalEditorProps) {
  const [text, setText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the textarea on mount
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Update word count when text changes
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    setWordCount(countWords(newText));
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    if (wordCount >= minWords) {
      onSave(text, wordCount);
    }
  }, [text, wordCount, minWords, onSave]);

  // Check if save is enabled
  const canSave = wordCount >= minWords && text.trim().length > 0;

  return (
    <div className={styles.editorContainer}>
      {/* Prompt reminder */}
      <div className={styles.promptReminder}>
        <span className={styles.promptIcon}>✍️</span>
        <span className={styles.promptText}>{prompt.text}</span>
      </div>

      {/* Follow-up questions */}
      {prompt.follow_up_questions.length > 0 && (
        <div className={styles.followUpHints}>
          <span className={styles.hintsLabel}>Consider exploring:</span>
          <ul className={styles.hintsList}>
            {prompt.follow_up_questions.map((question, idx) => (
              <li key={idx}>{question}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Text editor */}
      <textarea
        ref={textareaRef}
        className={styles.editor}
        value={text}
        onChange={handleTextChange}
        placeholder="Start writing here... Let your thoughts flow freely."
        rows={8}
      />

      {/* Footer with word count and actions */}
      <div className={styles.editorFooter}>
        <div className={styles.wordCount}>
          <span className={wordCount >= minWords ? styles.wordCountValid : styles.wordCountLow}>
            {wordCount}
          </span>
          <span className={styles.wordCountLabel}>
            {wordCount === 1 ? 'word' : 'words'}
            {minWords > 0 && ` (min: ${String(minWords)})`}
          </span>
        </div>

        <div className={styles.editorActions}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!canSave}
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
}
