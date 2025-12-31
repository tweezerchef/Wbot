/**
 * ============================================================================
 * Database Types
 * ============================================================================
 * TypeScript types for the Supabase database schema.
 *
 * NOTE: This file can be auto-generated using:
 *   pnpm db:generate-types
 *
 * The command runs:
 *   supabase gen types typescript --local > packages/shared/src/types/database.ts
 *
 * For now, this is a manually-created version matching our migrations.
 * ============================================================================
 */

import type { UserPreferences } from './preferences';

/**
 * Database schema types for Supabase client.
 * Use with: createClient<Database>(url, key)
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      conversations: {
        Row: Conversation;
        Insert: ConversationInsert;
        Update: ConversationUpdate;
      };
      messages: {
        Row: Message;
        Insert: MessageInsert;
        Update: MessageUpdate;
      };
    };
  };
}

// =============================================================================
// Profiles Table
// =============================================================================

/** A user profile (extends Supabase Auth users) */
export interface Profile {
  /** UUID matching auth.users.id */
  id: string;

  /** User's display name */
  display_name: string | null;

  /** User preferences from onboarding (JSONB) */
  preferences: UserPreferences;

  /** When the profile was created */
  created_at: string;

  /** When the profile was last updated */
  updated_at: string;
}

/** Fields for inserting a new profile */
export interface ProfileInsert {
  id: string;
  display_name?: string | null;
  preferences?: UserPreferences;
  created_at?: string;
  updated_at?: string;
}

/** Fields for updating a profile */
export interface ProfileUpdate {
  display_name?: string | null;
  preferences?: UserPreferences;
  updated_at?: string;
}

// =============================================================================
// Conversations Table
// =============================================================================

/** A therapy conversation */
export interface Conversation {
  /** Unique identifier */
  id: string;

  /** User who owns this conversation */
  user_id: string;

  /** Optional title */
  title: string | null;

  /** When the conversation was created */
  created_at: string;

  /** When the conversation was last active */
  updated_at: string;
}

/** Fields for inserting a new conversation */
export interface ConversationInsert {
  id?: string;
  user_id: string;
  title?: string | null;
  created_at?: string;
  updated_at?: string;
}

/** Fields for updating a conversation */
export interface ConversationUpdate {
  title?: string | null;
  updated_at?: string;
}

// =============================================================================
// Messages Table
// =============================================================================

/** A message in a conversation */
export interface Message {
  /** Unique identifier */
  id: string;

  /** Parent conversation */
  conversation_id: string;

  /** Who sent the message */
  role: 'user' | 'assistant' | 'system';

  /** Message text content */
  content: string;

  /** Optional metadata (JSONB) */
  metadata: Record<string, unknown>;

  /** When the message was created */
  created_at: string;
}

/** Fields for inserting a new message */
export interface MessageInsert {
  id?: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

/** Fields for updating a message */
export interface MessageUpdate {
  content?: string;
  metadata?: Record<string, unknown>;
}
