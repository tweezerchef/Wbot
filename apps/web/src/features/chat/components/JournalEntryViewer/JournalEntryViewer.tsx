/**
 * JournalEntryViewer Component
 *
 * Modal overlay for viewing past journal entries.
 * Displays the journal entry content with metadata like category, date, and word count.
 */

import styles from './JournalEntryViewer.module.css';

import { CloseIcon } from '@/components/ui/icons';
import { CATEGORY_INFO, type JournalEntry } from '@/features/journaling/types';

export interface JournalEntryViewerProps {
  /** The journal entry to display */
  entry: JournalEntry;
  /** Handler called when the viewer is closed */
  onClose: () => void;
}

/**
 * Modal dialog for viewing a journal entry.
 * Shows the entry's category, date, prompt, content, and metadata.
 */
export function JournalEntryViewer({ entry, onClose }: JournalEntryViewerProps) {
  const categoryInfo = CATEGORY_INFO[entry.prompt_category];

  // Handle escape key to close
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // Prevent click events from bubbling to the overlay
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Journal entry viewer"
    >
      <div
        className={styles.viewer}
        onClick={handleContentClick}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
        role="document"
      >
        <button className={styles.closeButton} onClick={onClose} aria-label="Close journal entry">
          <CloseIcon />
        </button>

        <div className={styles.header}>
          <span className={styles.category} style={{ backgroundColor: categoryInfo.color }}>
            {categoryInfo.emoji} {categoryInfo.label}
          </span>
          <span className={styles.date}>
            {new Date(entry.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>

        <div className={styles.prompt}>{entry.prompt_text}</div>

        <div className={styles.content}>{entry.entry_text}</div>

        <div className={styles.meta}>
          <span>{String(entry.word_count)} words</span>
          {entry.is_favorite && <span className={styles.favorite}>★ Favorite</span>}
        </div>
      </div>
    </div>
  );
}
