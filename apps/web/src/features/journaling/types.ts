/* ============================================================================
   Journaling Feature Types
   ============================================================================
   Consolidated type definitions for the journaling feature.
   These types are used across components, hooks, and the feature API.
   ============================================================================ */

import type { MoodRating } from '@wbot/shared';

// Re-export shared types for convenience
export type { MoodRating };

// =============================================================================
// Core Journaling Types
// =============================================================================

/** Journaling prompt categories */
export type JournalingCategory =
  | 'reflection'
  | 'gratitude'
  | 'processing'
  | 'growth'
  | 'self_compassion';

/** Journaling prompt configuration from the backend */
export interface JournalingPrompt {
  /** Unique identifier */
  id: string;
  /** Prompt category for styling and context */
  category: JournalingCategory;
  /** The main prompt text */
  text: string;
  /** Optional follow-up questions */
  follow_up_questions: string[];
  /** Estimated time to complete in minutes */
  estimated_time_minutes: number;
  /** What this prompt is best for */
  best_for: string[];
}

/** Activity data parsed from AI message content */
export interface JournalingActivityData {
  type: 'activity';
  activity: 'journaling';
  status: 'ready' | 'writing' | 'complete';
  prompt: JournalingPrompt;
  introduction: string;
  enable_sharing: boolean;
  conversation_context: string;
}

/** Current state of a journaling session */
export type JournalingState = 'idle' | 'writing' | 'mood_after' | 'complete' | 'sharing';

/** Session data for a completed journal entry */
export interface JournalSessionData {
  /** The prompt that was used */
  promptId: string;
  /** Category of the prompt */
  promptCategory: JournalingCategory;
  /** Full text of the prompt */
  promptText: string;
  /** User's journal entry text */
  entryText: string;
  /** Word count of the entry */
  wordCount: number;
  /** Time spent writing in seconds */
  writingDurationSeconds: number;
  /** Mood before writing (optional) */
  moodBefore?: MoodRating;
  /** Mood after writing (optional) */
  moodAfter?: MoodRating;
  /** Whether user chose to share with AI */
  sharedWithAI: boolean;
}

// =============================================================================
// Component Props
// =============================================================================

/** Props for the main JournalingExercise component */
export interface JournalingExerciseProps {
  /** The prompt to display */
  prompt: JournalingPrompt;
  /** Optional introduction text from the AI */
  introduction?: string;
  /** Whether to show the share with AI option */
  enableSharing?: boolean;
  /** Callback when the journaling session completes */
  onComplete?: (data: JournalSessionData) => void;
  /** Callback when user stops early */
  onStop?: () => void;
  /** Callback when user shares entry with AI */
  onShare?: (entryText: string) => void;
}

/** Props for the JournalEditor component */
export interface JournalEditorProps {
  /** The prompt being responded to */
  prompt: JournalingPrompt;
  /** Callback when user saves their entry */
  onSave: (text: string, wordCount: number) => void;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Minimum words required (optional) */
  minWords?: number;
  /** Auto-focus the editor on mount */
  autoFocus?: boolean;
}

/** Props for the PromptDisplay component */
export interface PromptDisplayProps {
  /** The prompt to display */
  prompt: JournalingPrompt;
  /** Show estimated time */
  showTime?: boolean;
  /** Show category badge */
  showCategory?: boolean;
  /** Compact mode for smaller display */
  compact?: boolean;
}

/** Props for the JournalingConfirmation component (HITL) */
export interface JournalingConfirmationProps {
  /** The proposed prompt from AI */
  proposedPrompt: JournalingPrompt;
  /** Message from the AI */
  message: string;
  /** All available prompts for selection */
  availablePrompts: JournalingPrompt[];
  /** Callback when user confirms with the selected prompt */
  onConfirm: (prompt: JournalingPrompt) => void;
  /** Callback when user declines */
  onDecline: () => void;
}

// =============================================================================
// Database Types
// =============================================================================

/** Journal entry as stored in the database */
export interface JournalEntry {
  id: string;
  user_id: string;
  conversation_id: string | null;
  prompt_category: JournalingCategory;
  prompt_text: string;
  entry_text: string;
  mood_before: number | null;
  mood_after: number | null;
  shared_with_ai: boolean;
  word_count: number;
  writing_duration_seconds: number | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

/** Params for saving a journal entry */
export interface SaveJournalEntryParams {
  conversationId?: string;
  promptCategory: JournalingCategory;
  promptText: string;
  entryText: string;
  wordCount: number;
  writingDurationSeconds?: number;
  moodBefore?: number;
  moodAfter?: number;
  sharedWithAI?: boolean;
}

// =============================================================================
// Utility Types
// =============================================================================

/** Category display info for UI */
export interface CategoryInfo {
  label: string;
  description: string;
  emoji: string;
  color: string;
}

/** Get display info for a category */
export const CATEGORY_INFO: Record<JournalingCategory, CategoryInfo> = {
  reflection: {
    label: 'Reflection',
    description: 'Daily awareness and pattern recognition',
    emoji: '🪞',
    color: 'var(--color-primary)',
  },
  gratitude: {
    label: 'Gratitude',
    description: 'Appreciation and positive perspective',
    emoji: '🙏',
    color: 'var(--color-success)',
  },
  processing: {
    label: 'Processing',
    description: 'Working through emotions and situations',
    emoji: '💭',
    color: 'var(--color-warning)',
  },
  growth: {
    label: 'Growth',
    description: 'Personal development and aspirations',
    emoji: '🌱',
    color: 'var(--color-info)',
  },
  self_compassion: {
    label: 'Self-Compassion',
    description: 'Self-kindness and inner healing',
    emoji: '💝',
    color: 'var(--color-accent)',
  },
};
