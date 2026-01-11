/* ============================================================================
   useSaveJournalEntry Hook
   ============================================================================
   TanStack Query mutation for saving journal entries to Supabase.
   ============================================================================ */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { JournalEntry, SaveJournalEntryParams } from '../types';

import { supabase } from '@/lib/supabase/client';

/**
 * Saves a journal entry to the database.
 */
async function saveJournalEntry(params: SaveJournalEntryParams): Promise<JournalEntry> {
  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      conversation_id: params.conversationId ?? null,
      prompt_category: params.promptCategory,
      prompt_text: params.promptText,
      entry_text: params.entryText,
      word_count: params.wordCount,
      writing_duration_seconds: params.writingDurationSeconds ?? null,
      mood_before: params.moodBefore ?? null,
      mood_after: params.moodAfter ?? null,
      shared_with_ai: params.sharedWithAI ?? false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save journal entry: ${error.message}`);
  }

  return data as JournalEntry;
}

/**
 * Hook for saving journal entries with TanStack Query.
 *
 * @example
 * const { mutate, isPending, isError } = useSaveJournalEntry();
 *
 * mutate({
 *   promptCategory: 'reflection',
 *   promptText: 'What moment from today stands out?',
 *   entryText: 'Today I...',
 *   wordCount: 50,
 *   writingDurationSeconds: 300,
 *   moodAfter: 4,
 * });
 */
export function useSaveJournalEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveJournalEntry,
    onSuccess: () => {
      // Invalidate any journal-related queries to refetch fresh data
      void queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
    onError: (error) => {
      console.error('Failed to save journal entry:', error);
    },
  });
}

/**
 * Query key factory for journal entries.
 */
export const journalKeys = {
  all: ['journalEntries'] as const,
  list: (filters?: { category?: string; favoritesOnly?: boolean }) =>
    [...journalKeys.all, 'list', filters] as const,
  detail: (id: string) => [...journalKeys.all, 'detail', id] as const,
};
