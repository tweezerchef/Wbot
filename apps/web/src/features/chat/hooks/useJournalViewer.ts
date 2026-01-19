/**
 * useJournalViewer Hook
 *
 * Manages the state for viewing journal entries in a modal overlay.
 */

import { useState, useCallback } from 'react';

import type { JournalEntry } from '@/features/journaling/types';

export interface UseJournalViewerReturn {
  /** Currently selected journal entry (null if none selected) */
  selectedJournalEntry: JournalEntry | null;
  /** Handler for selecting a journal entry to view */
  handleSelectJournalEntry: (entry: JournalEntry) => void;
  /** Handler for closing the journal entry viewer */
  handleCloseJournalEntry: () => void;
}

/**
 * Custom hook for managing journal entry viewer state.
 *
 * @returns Journal viewer state and handlers
 */
export function useJournalViewer(): UseJournalViewerReturn {
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<JournalEntry | null>(null);

  /**
   * Handle selecting a journal entry from JournalHistory.
   */
  const handleSelectJournalEntry = useCallback((entry: JournalEntry) => {
    setSelectedJournalEntry(entry);
  }, []);

  /**
   * Handle closing the journal entry viewer.
   */
  const handleCloseJournalEntry = useCallback(() => {
    setSelectedJournalEntry(null);
  }, []);

  return {
    selectedJournalEntry,
    handleSelectJournalEntry,
    handleCloseJournalEntry,
  };
}
