/* ============================================================================
   useJournalEntries Hook
   ============================================================================
   TanStack Query hook for fetching journal entries from Supabase.
   ============================================================================ */

import { useQuery } from '@tanstack/react-query';

import type { JournalEntry } from '../types';

import { journalKeys } from './useSaveJournalEntry';

import { supabase } from '@/lib/supabase/client';

/**
 * Fetches journal entries from the database.
 */
async function getJournalEntries(options?: {
  category?: string;
  favoritesOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<JournalEntry[]> {
  let query = supabase
    .from('journal_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (options?.category) {
    query = query.eq('prompt_category', options.category);
  }

  if (options?.favoritesOnly) {
    query = query.eq('is_favorite', true);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit ?? 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch journal entries: ${error.message}`);
  }

  return data as JournalEntry[];
}

/**
 * Hook for fetching journal entries with TanStack Query.
 *
 * @example
 * const { data: entries, isLoading, error } = useJournalEntries();
 * const { data: favorites } = useJournalEntries({ favoritesOnly: true });
 */
export function useJournalEntries(options?: {
  category?: string;
  favoritesOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: journalKeys.list(options),
    queryFn: () => getJournalEntries(options),
  });
}

/**
 * Fetches a single journal entry by ID.
 */
async function getJournalEntry(id: string): Promise<JournalEntry | null> {
  const { data, error } = await supabase.from('journal_entries').select('*').eq('id', id).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch journal entry: ${error.message}`);
  }

  return data as JournalEntry;
}

/**
 * Hook for fetching a single journal entry by ID.
 */
export function useJournalEntry(id: string | null) {
  return useQuery({
    queryKey: journalKeys.detail(id ?? ''),
    queryFn: () => (id ? getJournalEntry(id) : null),
    enabled: !!id,
  });
}

/**
 * Gets the relative time since a date (e.g., "2 hours ago", "yesterday").
 */
export function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return 'Just now';
  }
  if (diffMin < 60) {
    return `${String(diffMin)}m ago`;
  }
  if (diffHour < 24) {
    return `${String(diffHour)}h ago`;
  }
  if (diffDay === 1) {
    return 'Yesterday';
  }
  if (diffDay < 7) {
    return `${String(diffDay)}d ago`;
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
