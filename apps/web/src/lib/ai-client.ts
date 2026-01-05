/* ============================================================================
   AI Client - Direct API Connection (Pure OSS)
   ============================================================================
   This module provides a client for communicating with the Wbot AI backend.

   Architecture:
   - Client connects directly to the FastAPI backend via fetch + SSE
   - Supabase auth tokens are passed for authorization
   - Backend validates tokens before processing requests
   - No LangGraph SDK dependency - pure fetch + SSE parsing

   The client handles:
   - SSE connections for streaming
   - Thread (conversation) management
   - HITL (Human-in-the-Loop) interrupts for activities

   Usage:
   import { createAIClient } from '@/lib/ai-client';

   const client = createAIClient(authToken);
   for await (const event of client.streamMessage('Hello!', conversationId)) {
     // Handle streaming events
   }
   ============================================================================ */

/* ----------------------------------------------------------------------------
   Configuration
   ---------------------------------------------------------------------------- */

// Backend API URL
// In development: Local FastAPI server (usually http://localhost:2024)
// In production: Your deployed backend URL
const API_URL =
  (import.meta.env.VITE_LANGGRAPH_API_URL as string | undefined) ?? 'http://localhost:2024';

/* ----------------------------------------------------------------------------
   Types
   ---------------------------------------------------------------------------- */

// A single message in the conversation
export interface Message {
  // Unique identifier for the message
  id: string;
  // Who sent the message: 'user' or 'assistant'
  role: 'user' | 'assistant' | 'system';
  // The text content of the message
  content: string;
  // When the message was created
  createdAt: Date;
}

// Breathing technique info from the backend
export interface BreathingTechniqueInfo {
  id: string;
  name: string;
  description: string;
  durations: [number, number, number, number];
  recommended_cycles: number;
  best_for: string[];
}

// Payload sent by the backend when an interrupt occurs for breathing confirmation
export interface BreathingConfirmationPayload {
  type: 'breathing_confirmation';
  proposed_technique: BreathingTechniqueInfo;
  message: string;
  available_techniques: BreathingTechniqueInfo[];
  options: ('start' | 'change_technique' | 'not_now')[];
}

// Voice info from the backend (for meditation voice selection)
export interface VoiceInfo {
  id: string;
  name: string;
  description: string;
  best_for: string[];
  preview_url: string | null;
}

// Payload sent by the backend when an interrupt occurs for meditation voice selection
export interface VoiceSelectionPayload {
  type: 'voice_selection';
  message: string;
  available_voices: VoiceInfo[];
  recommended_voice: string;
  meditation_preview: string;
  duration_minutes: number;
}

// Union type for all interrupt payloads (supports multiple HITL workflows)
export type InterruptPayload = BreathingConfirmationPayload | VoiceSelectionPayload;

// Type guard for breathing confirmation payload
export function isBreathingConfirmation(
  payload: InterruptPayload
): payload is BreathingConfirmationPayload {
  return payload.type === 'breathing_confirmation';
}

// Type guard for voice selection payload
export function isVoiceSelection(payload: InterruptPayload): payload is VoiceSelectionPayload {
  return payload.type === 'voice_selection';
}

// Events emitted during streaming
export type StreamEvent =
  // A token of text content from the AI
  | { type: 'token'; content: string }
  // Stream completed successfully
  | { type: 'done'; messageId?: string }
  // An error occurred
  | { type: 'error'; error: string }
  // Stream started (useful for loading states)
  | { type: 'start' }
  // Graph paused for human-in-the-loop input (breathing or meditation confirmation)
  | { type: 'interrupt'; payload: InterruptPayload };

/* ----------------------------------------------------------------------------
   SSE Parser Types
   ---------------------------------------------------------------------------- */

/** Parsed SSE event from the backend */
interface SSEEvent {
  event: string;
  data: unknown;
}

/** Message format from SSE stream */
interface SSEMessage {
  role?: string;
  content?: string;
  id?: string;
}

/* ----------------------------------------------------------------------------
   SSE Parser
   ---------------------------------------------------------------------------- */

/**
 * Parses Server-Sent Events from a ReadableStream.
 *
 * Handles the SSE format:
 * - data: {"event": "...", "data": ...}\n\n
 * - data: [DONE]\n\n
 *
 * @param reader - ReadableStream reader from fetch response
 * @yields Parsed SSE events
 */
async function* parseSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<SSEEvent | 'DONE'> {
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    // Decode the chunk and add to buffer
    buffer += decoder.decode(value, { stream: true });

    // Process complete events (terminated by double newline)
    const events = buffer.split('\n\n');
    // Keep the last incomplete event in the buffer
    buffer = events.pop() ?? '';

    for (const eventStr of events) {
      // Skip empty events
      if (!eventStr.trim()) {
        continue;
      }

      // Parse SSE format: "data: ..." lines
      const lines = eventStr.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6); // Remove "data: " prefix

          // Check for stream termination marker
          if (dataStr === '[DONE]') {
            yield 'DONE';
            continue;
          }

          // Parse JSON payload
          try {
            const parsed = JSON.parse(dataStr) as SSEEvent;
            yield parsed;
          } catch {
            // Skip malformed JSON
            console.warn('Failed to parse SSE data:', dataStr);
          }
        }
      }
    }
  }
}

/* ----------------------------------------------------------------------------
   AI Client Class
   ---------------------------------------------------------------------------- */

/**
 * Client for interacting with the Wbot AI backend.
 *
 * Each instance is tied to an authenticated user session.
 * Create a new instance when the auth token changes.
 *
 * @example
 * const client = createAIClient(session.access_token);
 *
 * // Stream a message
 * for await (const event of client.streamMessage('How are you?', threadId)) {
 *   if (event.type === 'token') {
 *     appendToUI(event.content);
 *   }
 * }
 */
export class AIClient {
  // Auth token for API requests
  private authToken: string;

  /**
   * Creates a new AI client instance.
   *
   * @param authToken - Supabase JWT access token for authentication
   *                    Backend validates this token before processing requests
   */
  constructor(authToken: string) {
    this.authToken = authToken;
  }

  /**
   * Makes an authenticated fetch request to the backend.
   */
  private async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_URL}${path}`;
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${this.authToken}`);
    headers.set('Content-Type', 'application/json');

    return fetch(url, {
      ...options,
      headers,
    });
  }

  /**
   * Streams a message to the AI and yields events as they arrive.
   *
   * This uses the backend's thread (conversation) system:
   * - Each thread maintains conversation history
   * - Messages are automatically persisted
   * - The AI has context from previous messages
   *
   * @param message - The user's message text
   * @param threadId - The conversation/thread ID (from Supabase conversations table)
   * @yields StreamEvent objects as the AI generates its response
   *
   * @example
   * let fullResponse = '';
   * for await (const event of client.streamMessage('Hello', threadId)) {
   *   switch (event.type) {
   *     case 'start':
   *       showLoadingIndicator();
   *       break;
   *     case 'token':
   *       fullResponse = event.content; // content is accumulated
   *       updateMessageUI(fullResponse);
   *       break;
   *     case 'done':
   *       hideLoadingIndicator();
   *       break;
   *     case 'error':
   *       showError(event.error);
   *       break;
   *   }
   * }
   */
  async *streamMessage(message: string, threadId: string): AsyncGenerator<StreamEvent> {
    // Signal that streaming has started
    yield { type: 'start' };

    try {
      // Start the streaming request
      const response = await this.fetch('/api/chat/stream', {
        method: 'POST',
        body: JSON.stringify({
          message,
          thread_id: threadId,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        yield { type: 'error', error: `Request failed: ${error}` };
        return;
      }

      if (!response.body) {
        yield { type: 'error', error: 'No response body' };
        return;
      }

      // Parse SSE stream
      const reader = response.body.getReader();

      for await (const event of parseSSE(reader)) {
        // Handle stream termination
        if (event === 'DONE') {
          yield { type: 'done' };
          return;
        }

        // Handle different event types
        switch (event.event) {
          case 'messages/partial': {
            // Streaming token - data is array of messages
            const messages = event.data as SSEMessage[];
            if (Array.isArray(messages) && messages.length > 0) {
              const lastMsg = messages[messages.length - 1];
              // After checking length > 0, we know lastMsg exists
              if (lastMsg.role === 'assistant' && lastMsg.content) {
                yield { type: 'token', content: lastMsg.content };
              }
            }
            break;
          }

          case 'messages/complete': {
            // Stream complete - data is array of messages
            const messages = event.data as SSEMessage[];
            if (Array.isArray(messages) && messages.length > 0) {
              const lastMsg = messages[messages.length - 1];
              // After checking length > 0, we know lastMsg exists
              if (lastMsg.role === 'assistant' && lastMsg.content) {
                yield { type: 'token', content: lastMsg.content };
              }
            }
            yield { type: 'done' };
            return;
          }

          case 'updates': {
            // Check for interrupt (HITL)
            const data = event.data as { __interrupt__?: { value: InterruptPayload }[] };
            if (data.__interrupt__ && data.__interrupt__.length > 0) {
              const interruptPayload = data.__interrupt__[0].value;
              yield { type: 'interrupt', payload: interruptPayload };
              return;
            }
            break;
          }

          case 'error': {
            // Backend error
            const data = event.data as { message?: string };
            yield { type: 'error', error: data.message ?? 'Unknown error' };
            return;
          }
        }
      }

      // If we get here without an explicit done, signal completion
      yield { type: 'done' };
    } catch (error) {
      // Handle and report errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      yield { type: 'error', error: errorMessage };
    }
  }

  /**
   * Sends a message and waits for the complete response (non-streaming).
   *
   * Use this for simpler cases where streaming UI isn't needed.
   * For chat, prefer streamMessage() for better user experience.
   *
   * @param message - The user's message text
   * @param threadId - The conversation/thread ID
   * @returns The complete assistant response
   */
  async sendMessage(message: string, threadId: string): Promise<string> {
    // Collect all tokens into a single response
    let fullResponse = '';

    for await (const event of this.streamMessage(message, threadId)) {
      if (event.type === 'token') {
        fullResponse = event.content; // Content is accumulated by backend
      } else if (event.type === 'error') {
        throw new Error(event.error);
      }
    }

    return fullResponse;
  }

  /**
   * Gets the conversation history for a thread.
   *
   * @param threadId - The conversation/thread ID
   * @returns Array of messages in the conversation
   */
  async getHistory(threadId: string): Promise<Message[]> {
    try {
      const response = await this.fetch(`/api/threads/${threadId}/history`);

      if (!response.ok) {
        // Thread might not exist yet
        return [];
      }

      const data = (await response.json()) as {
        messages: { id: string; role: string; content: string }[];
      };

      return data.messages.map((msg) => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        createdAt: new Date(),
      }));
    } catch {
      // Thread might not exist yet
      return [];
    }
  }

  /**
   * Resumes an interrupted graph after user input (HITL pattern).
   *
   * Called after the user responds to a confirmation prompt (e.g., breathing technique or voice selection).
   * The graph will resume from where it was paused and continue processing.
   *
   * @param resumeData - User's decision and any additional data
   * @param threadId - The conversation/thread ID
   * @yields StreamEvent objects as the graph resumes processing
   *
   * @example
   * // For breathing confirmation:
   * for await (const event of client.resumeInterrupt(
   *   { decision: 'start', technique_id: 'box' },
   *   threadId
   * )) {
   *   if (event.type === 'token') {
   *     updateUI(event.content);
   *   }
   * }
   *
   * @example
   * // For voice selection:
   * for await (const event of client.resumeInterrupt(
   *   { decision: 'confirm', voice_id: 'nova' },
   *   threadId
   * )) {
   *   if (event.type === 'token') {
   *     updateUI(event.content);
   *   }
   * }
   */
  async *resumeInterrupt(
    resumeData: { decision: string; technique_id?: string; voice_id?: string },
    threadId: string
  ): AsyncGenerator<StreamEvent> {
    yield { type: 'start' };

    try {
      // Start the resume streaming request
      const response = await this.fetch('/api/chat/resume', {
        method: 'POST',
        body: JSON.stringify({
          thread_id: threadId,
          decision: resumeData.decision,
          technique_id: resumeData.technique_id,
          voice_id: resumeData.voice_id,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        yield { type: 'error', error: `Resume failed: ${error}` };
        return;
      }

      if (!response.body) {
        yield { type: 'error', error: 'No response body' };
        return;
      }

      // Parse SSE stream
      const reader = response.body.getReader();

      for await (const event of parseSSE(reader)) {
        // Handle stream termination
        if (event === 'DONE') {
          yield { type: 'done' };
          return;
        }

        // Handle different event types
        switch (event.event) {
          case 'messages/partial': {
            const messages = event.data as SSEMessage[];
            if (Array.isArray(messages) && messages.length > 0) {
              const lastMsg = messages[messages.length - 1];
              // After checking length > 0, we know lastMsg exists
              if (lastMsg.role === 'assistant' && lastMsg.content) {
                yield { type: 'token', content: lastMsg.content };
              }
            }
            break;
          }

          case 'messages/complete': {
            const messages = event.data as SSEMessage[];
            if (Array.isArray(messages) && messages.length > 0) {
              const lastMsg = messages[messages.length - 1];
              // After checking length > 0, we know lastMsg exists
              if (lastMsg.role === 'assistant' && lastMsg.content) {
                yield { type: 'token', content: lastMsg.content };
              }
            }
            yield { type: 'done' };
            return;
          }

          case 'updates': {
            // Check for nested interrupt (chained HITL)
            const data = event.data as { __interrupt__?: { value: InterruptPayload }[] };
            if (data.__interrupt__ && data.__interrupt__.length > 0) {
              const interruptPayload = data.__interrupt__[0].value;
              yield { type: 'interrupt', payload: interruptPayload };
              return;
            }
            break;
          }

          case 'error': {
            const data = event.data as { message?: string };
            yield { type: 'error', error: data.message ?? 'Unknown error' };
            return;
          }
        }
      }

      yield { type: 'done' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      yield { type: 'error', error: errorMessage };
    }
  }
}

/* ----------------------------------------------------------------------------
   Factory Function
   ---------------------------------------------------------------------------- */

/**
 * Creates a new AI client instance.
 *
 * Call this when the user logs in or when the auth token refreshes.
 *
 * @param authToken - Supabase JWT access token
 * @returns A new AIClient instance
 */
export function createAIClient(authToken: string): AIClient {
  return new AIClient(authToken);
}
