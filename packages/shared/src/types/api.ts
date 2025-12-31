/**
 * ============================================================================
 * API Types
 * ============================================================================
 * Types for API requests and responses between frontend and AI backend.
 * ============================================================================
 */

/**
 * A message in a conversation.
 */
export interface Message {
  /** Unique identifier for the message */
  id: string;

  /** Who sent the message */
  role: 'user' | 'assistant' | 'system';

  /** The text content of the message */
  content: string;

  /** When the message was created */
  createdAt: Date;

  /** Optional metadata (tokens used, model, etc.) */
  metadata?: Record<string, unknown>;
}

/**
 * A conversation thread.
 */
export interface Conversation {
  /** Unique identifier */
  id: string;

  /** User who owns this conversation */
  userId: string;

  /** Optional title for the conversation */
  title?: string;

  /** When the conversation was created */
  createdAt: Date;

  /** When the conversation was last active */
  updatedAt: Date;
}

/**
 * Events emitted during message streaming.
 */
export type StreamEvent =
  /** A token of text from the AI */
  | { type: 'token'; content: string }
  /** Stream started */
  | { type: 'start' }
  /** Stream completed successfully */
  | { type: 'done'; messageId?: string }
  /** An error occurred */
  | { type: 'error'; error: string };

/**
 * Request to send a message to the AI.
 */
export interface SendMessageRequest {
  /** The user's message text */
  message: string;

  /** The conversation this message belongs to */
  conversationId: string;
}

/**
 * Response from sending a message (non-streaming).
 */
export interface SendMessageResponse {
  /** The AI's response text */
  response: string;

  /** ID of the saved message */
  messageId: string;
}

/**
 * Request to create a new conversation.
 */
export interface CreateConversationRequest {
  /** Optional initial title */
  title?: string;
}

/**
 * Response from creating a conversation.
 */
export interface CreateConversationResponse {
  /** The new conversation ID */
  conversationId: string;
}
