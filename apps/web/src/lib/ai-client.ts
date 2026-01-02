/* ============================================================================
   AI Client - Direct LangGraph Connection
   ============================================================================
   This module provides a client for communicating directly with LangGraph.

   Architecture:
   - Client connects directly to LangGraph Deploy (no intermediate server)
   - Supabase auth tokens are passed for authorization
   - LangGraph validates tokens before processing requests
   - This reduces latency by eliminating a hop through our backend

   The LangGraph SDK handles:
   - WebSocket/SSE connections for streaming
   - Automatic reconnection
   - Thread (conversation) management
   - Message streaming with async iterators

   Usage:
   import { createAIClient } from '@/lib/ai-client';

   const client = createAIClient(authToken);
   for await (const event of client.streamMessage('Hello!', conversationId)) {
     // Handle streaming events
   }
   ============================================================================ */

import { Client } from '@langchain/langgraph-sdk';

/* ----------------------------------------------------------------------------
   Configuration
   ---------------------------------------------------------------------------- */

// LangGraph Deploy URL
// In development: Local LangGraph server (usually http://localhost:8123)
// In production: Your LangGraph Deploy URL from LangGraph Cloud
const LANGGRAPH_URL =
  (import.meta.env.VITE_LANGGRAPH_API_URL as string | undefined) ?? 'http://localhost:8123';

// The name of the graph to invoke (defined in apps/ai)
// This matches the graph name in langgraph.json
const GRAPH_NAME = 'therapy';

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

// Events emitted during streaming
export type StreamEvent =
  // A token of text content from the AI
  | { type: 'token'; content: string }
  // Stream completed successfully
  | { type: 'done'; messageId?: string }
  // An error occurred
  | { type: 'error'; error: string }
  // Stream started (useful for loading states)
  | { type: 'start' };

/* ----------------------------------------------------------------------------
   AI Client Class
   ---------------------------------------------------------------------------- */

/**
 * Client for interacting with the LangGraph AI backend.
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
  // The LangGraph SDK client instance
  private client: Client;

  /**
   * Creates a new AI client instance.
   *
   * @param authToken - Supabase JWT access token for authentication
   *                    LangGraph validates this token before processing requests
   */
  constructor(authToken: string) {
    // Create the LangGraph client with auth headers
    // The SDK will include these headers in all requests
    this.client = new Client({
      apiUrl: LANGGRAPH_URL,
      defaultHeaders: {
        // Pass the Supabase token as a Bearer token
        // LangGraph backend validates this against Supabase
        Authorization: `Bearer ${authToken}`,
      },
    });
  }

  /**
   * Streams a message to the AI and yields events as they arrive.
   *
   * This uses LangGraph's thread (conversation) system:
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
   *       fullResponse += event.content;
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
      // Get or create the thread (conversation) in LangGraph
      // This syncs with our Supabase conversations table via the thread_id
      const thread = await this.client.threads.get(threadId).catch(async () => {
        // Thread doesn't exist, create it
        // The thread_id matches our Supabase conversation ID for consistency
        return this.client.threads.create({ threadId });
      });

      // Stream the response from LangGraph
      // The SDK handles the SSE connection and parsing
      const stream = this.client.runs.stream(thread.thread_id, GRAPH_NAME, {
        input: {
          // Pass the user's message to the graph
          messages: [{ role: 'user', content: message }],
        },
        // Stream mode: 'messages' gives us token-by-token output
        streamMode: 'messages',
      });

      // Process each chunk from the stream
      for await (const chunk of stream) {
        // The chunk structure depends on the graph's output
        // We handle the common patterns here

        // Check if this is a message chunk with content
        if (chunk.event === 'messages/partial') {
          // Extract the latest assistant message content
          const messages = chunk.data as unknown as { role: string; content: string }[];
          const lastMessage = messages.at(-1);

          if (lastMessage?.role === 'assistant' && lastMessage.content) {
            yield { type: 'token', content: lastMessage.content };
          }
        }

        // Check for completion
        if (chunk.event === 'messages/complete') {
          yield { type: 'done' };
        }
      }
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
        fullResponse += event.content;
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
      const state = await this.client.threads.getState(threadId);

      // Extract messages from the graph state
      // The structure depends on how the graph stores messages
      const messages =
        (
          state.values as {
            messages?: {
              id?: string;
              role: string;
              content: string;
              created_at?: string;
            }[];
          }
        ).messages ?? [];

      return messages.map((msg, index) => ({
        id: msg.id ?? `msg-${String(index)}`,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        createdAt: msg.created_at ? new Date(msg.created_at) : new Date(),
      }));
    } catch {
      // Thread might not exist yet
      return [];
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
