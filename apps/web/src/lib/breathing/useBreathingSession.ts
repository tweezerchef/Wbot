/* ============================================================================
   useBreathingSession Hook
   ============================================================================
   React Query mutations for tracking breathing exercise sessions.

   Provides functions to:
   - Start a new session when exercise begins
   - Update session data during exercise
   - Complete session with final stats

   Session data is stored in Supabase breathing_sessions table and used for:
   - Progress tracking
   - Experience level validation (safety checks for Wim Hof)
   - Analytics and insights
   ============================================================================ */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CompletionStats } from '../../components/WimHofExercise';
import { supabase } from '../supabase';

/**
 * Parameters for starting a new breathing session
 */
export interface StartSessionParams {
  techniqueId: string;
  techniqueName: string;
  techniqueType: 'continuous' | 'wim_hof';
  conversationId?: string;
  moodBefore?: string;
}

/**
 * Parameters for completing a breathing session
 */
export interface CompleteSessionParams {
  sessionId: string;
  sessionData: unknown; // WimHofSessionData or ContinuousSessionData
  moodAfter?: string;
}

/**
 * Hook for managing breathing session tracking
 *
 * @returns Mutation functions for session lifecycle
 */
export function useBreathingSession() {
  const queryClient = useQueryClient();

  /**
   * Start a new breathing session
   *
   * Creates a session record in the database when user begins exercise.
   * Returns the session ID for subsequent updates.
   */
  const startSession = useMutation({
    mutationFn: async (params: StartSessionParams) => {
      const { data, error } = await supabase
        .from('breathing_sessions')
        .insert({
          technique_id: params.techniqueId,
          technique_name: params.techniqueName,
          technique_type: params.techniqueType,
          conversation_id: params.conversationId,
          mood_before: params.moodBefore,
          completed: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to start breathing session:', error);
        throw error;
      }

      return data;
    },
  });

  /**
   * Complete a breathing session
   *
   * Updates the session with completion data, including:
   * - Completion status
   * - Completion timestamp
   * - Session-specific data (retention times, cycles, etc.)
   * - Optional post-exercise mood
   */
  const completeSession = useMutation({
    mutationFn: async (params: CompleteSessionParams) => {
      const { data, error } = await supabase
        .from('breathing_sessions')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          session_data: params.sessionData,
          mood_after: params.moodAfter,
        })
        .eq('id', params.sessionId)
        .select()
        .single();

      if (error) {
        console.error('Failed to complete breathing session:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      // Invalidate queries to refresh session counts and stats
      void queryClient.invalidateQueries({ queryKey: ['breathing-sessions'] });
      void queryClient.invalidateQueries({ queryKey: ['breathing-stats'] });
    },
  });

  /**
   * Update an in-progress session
   *
   * Useful for saving intermediate data (e.g., after each Wim Hof round)
   */
  const updateSession = useMutation({
    mutationFn: async ({ sessionId, sessionData }: { sessionId: string; sessionData: unknown }) => {
      const { data, error } = await supabase
        .from('breathing_sessions')
        .update({
          session_data: sessionData,
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        console.error('Failed to update breathing session:', error);
        throw error;
      }

      return data;
    },
  });

  return {
    startSession,
    completeSession,
    updateSession,
  };
}

/**
 * Helper function to convert CompletionStats to session data format
 *
 * @param stats - Completion stats from WimHofExercise
 * @returns Formatted session data for database
 */
export function formatWimHofSessionData(stats: CompletionStats) {
  return {
    rounds: stats.roundRetentions.map((retentionSeconds, index) => ({
      round: index + 1,
      retentionSeconds,
    })),
    averageRetention: stats.averageRetention,
    bestRetention: stats.bestRetention,
    totalDuration: stats.totalDuration,
    completedAllRounds: true,
  };
}
