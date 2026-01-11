/**
 * Journal History Panel
 *
 * Displays recent journal entries in the sidebar.
 * Allows users to browse and view their past entries.
 */

import { useState, useEffect, useCallback } from 'react';

import { useJournalEntries, getRelativeTime } from '../../hooks';
import { CATEGORY_INFO, type JournalEntry } from '../../types';

import styles from './JournalHistory.module.css';

import { JournalIcon, ChevronDownIcon } from '@/components/ui/icons';

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

interface JournalHistoryProps {
  /** Callback when a journal entry is selected */
  onSelectEntry: (entry: JournalEntry) => void;
  /** Callback to close sidebar on mobile */
  onCloseSidebar?: () => void;
}

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function JournalHistory({ onSelectEntry, onCloseSidebar }: JournalHistoryProps) {
  // Panel expansion state
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch journal entries
  const {
    data: entries,
    isLoading,
    refetch,
  } = useJournalEntries({
    limit: 10,
  });

  // Refetch when expanded
  useEffect(() => {
    if (isExpanded) {
      void refetch();
    }
  }, [isExpanded, refetch]);

  /* --------------------------------------------------------------------------
     Handlers
     -------------------------------------------------------------------------- */
  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (entry: JournalEntry) => {
      onSelectEntry(entry);
      // Close sidebar on mobile
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        onCloseSidebar?.();
      }
    },
    [onSelectEntry, onCloseSidebar]
  );

  /* --------------------------------------------------------------------------
     Render
     -------------------------------------------------------------------------- */
  return (
    <div className={styles.container}>
      {/* Toggle Button */}
      <button
        className={`${styles.toggleButton} ${isExpanded ? styles.expanded : ''}`}
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls="journal-history-panel"
      >
        <JournalIcon />
        <span>Journal Entries</span>
        <ChevronDownIcon />
      </button>

      {/* Expandable Panel */}
      {isExpanded && (
        <div
          id="journal-history-panel"
          className={styles.panel}
          role="region"
          aria-label="Journal entries"
        >
          {/* Entry List */}
          <ul className={styles.list} role="listbox">
            {isLoading && <li className={styles.loadingState}>Loading...</li>}

            {!isLoading && entries?.length === 0 && (
              <li className={styles.emptyState}>No journal entries yet</li>
            )}

            {entries?.map((entry) => {
              const categoryInfo = CATEGORY_INFO[entry.prompt_category];
              const previewText =
                entry.entry_text.length > 60
                  ? `${entry.entry_text.substring(0, 60)}...`
                  : entry.entry_text;

              return (
                <li key={entry.id}>
                  <button
                    className={styles.entryItem}
                    onClick={() => {
                      handleSelect(entry);
                    }}
                    role="option"
                  >
                    <div className={styles.entryHeader}>
                      <span
                        className={styles.categoryBadge}
                        style={{ backgroundColor: categoryInfo.color }}
                      >
                        {categoryInfo.emoji} {categoryInfo.label}
                      </span>
                      <span className={styles.entryTime}>{getRelativeTime(entry.created_at)}</span>
                    </div>
                    <span className={styles.entryPrompt}>{entry.prompt_text}</span>
                    <span className={styles.entryPreview}>{previewText}</span>
                    <div className={styles.entryMeta}>
                      <span>{entry.word_count} words</span>
                      {entry.is_favorite && <span className={styles.favorite}>★</span>}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
