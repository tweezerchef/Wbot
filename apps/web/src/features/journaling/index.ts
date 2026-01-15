/* ============================================================================
   Journaling Feature
   ============================================================================
   Reflective journaling with AI-generated prompts.

   Components:
   - JournalingExercise: Main activity component with state machine
   - JournalEditor: Text editor with word count
   - PromptDisplay: Prompt card display
   - JournalingConfirmation: HITL confirmation for prompt selection
   - JournalHistory: Sidebar component for browsing past entries

   Hooks:
   - useSaveJournalEntry: TanStack Query mutation for saving entries
   - useJournalEntries: TanStack Query hook for fetching entries
   ============================================================================ */

// Components
export {
  JournalingExercise,
  JournalEditor,
  PromptDisplay,
  JournalingConfirmation,
  JournalHistory,
} from './components';

// Hooks
export {
  useSaveJournalEntry,
  journalKeys,
  useJournalEntries,
  useJournalEntry,
  getRelativeTime,
} from './hooks';

// Types
export type {
  JournalingCategory,
  JournalingPrompt,
  JournalingActivityData,
  JournalingState,
  JournalSessionData,
  JournalingExerciseProps,
  JournalEditorProps,
  PromptDisplayProps,
  JournalingConfirmationProps,
  JournalEntry,
  SaveJournalEntryParams,
} from './types';

export { CATEGORY_INFO } from './types';
