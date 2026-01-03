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
  (import.meta.env.VITE_LANGGRAPH_API_URL as string | undefined) ?? 'http://localhost:2024';

// The name of the graph to invoke (defined in apps/ai)
// This matches the graph name in langgraph.json
const GRAPH_NAME = 'wellness';

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
  // Graph paused for human-in-the-loop input (breathing confirmation)
  | { type: 'interrupt'; payload: BreathingConfirmationPayload };

// Technique IDs that should be filtered from streaming output
// These are internal LLM responses that shouldn't be shown to users
const TECHNIQUE_IDS = ['box', 'relaxing_478', 'coherent', 'deep_calm'];

/* ----------------------------------------------------------------------------
   LangGraph Stream Types
   ---------------------------------------------------------------------------- */

/** Content block format (used by some LLM providers like Gemini) */
interface ContentBlock {
  type: string;
  text?: string;
  index?: number;
}

/** Message format from LangGraph stream */
interface LangGraphMessage {
  role?: string;
  type?: string;
  content?: string | ContentBlock[];
  id?: string;
}

/**
 * Extracts text content from a message.
 * Handles both string content (Claude) and array content blocks (Gemini).
 */
function extractTextContent(content: string | ContentBlock[] | undefined): string {
  if (!content) {
    return '';
  }

  // If it's already a string, return it
  if (typeof content === 'string') {
    return content;
  }

  // If it's an array of content blocks, extract text from text blocks
  if (Array.isArray(content)) {
    return content
      .filter((block) => block.type === 'text' && block.text)
      .map((block) => block.text)
      .join('');
  }

  return '';
}

/** Data format for messages/partial events */
type LangGraphMessagesData = LangGraphMessage[];

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
        // Stream modes: 'messages' for token-by-token output,
        // 'updates' for graph events including interrupts
        streamMode: ['messages', 'updates'],
      });

      // Track the accumulated response for incremental streaming
      let lastContent = '';

      // Helper to check if a message is from the assistant
      const isAssistantMessage = (msg: LangGraphMessage): boolean =>
        msg.role === 'assistant' || msg.role === 'ai' || msg.type === 'ai';

      // Process each chunk from the stream
      for await (const chunk of stream) {
        // Debug: Log all events to understand the stream structure
        // eslint-disable-next-line no-console
        console.log('Stream event:', chunk.event, JSON.stringify(chunk.data));

        // Check for interrupt events (HITL - Human-in-the-Loop)
        // This happens when the graph pauses for user confirmation (e.g., breathing technique)
        const chunkData = chunk.data as Record<string, unknown> | null;
        if (chunkData && '__interrupt__' in chunkData) {
          const interruptArray = chunkData.__interrupt__ as { value: unknown }[];
          if (interruptArray.length > 0) {
            const interruptPayload = interruptArray[0].value as BreathingConfirmationPayload;
            yield { type: 'interrupt', payload: interruptPayload };
            // Stop streaming here - frontend will handle the interrupt and resume
            return;
          }
        }

        // Handle message streaming events
        if (chunk.event === 'messages/partial') {
          const data = chunk.data as LangGraphMessagesData;
          if (Array.isArray(data) && data.length > 0) {
            // Get the last message (most recent assistant response)
            const lastMsg = data.at(-1);
            if (lastMsg && isAssistantMessage(lastMsg)) {
              // Extract text content, handling both string and array formats
              const content = extractTextContent(lastMsg.content);

              // Filter out technique IDs (internal LLM responses)
              // These are short single-word responses from technique selection
              const trimmedContent = content.trim().toLowerCase();
              if (TECHNIQUE_IDS.includes(trimmedContent)) {
                // Skip this content - it's an internal LLM response
                continue;
              }

              // Filter out detect_activity structured output JSON
              // This is internal routing data, not user-facing content
              if (content.includes('"detected_activity"') && content.includes('"confidence"')) {
                continue;
              }

              if (content && content !== lastContent) {
                yield { type: 'token', content };
                lastContent = content;
              }
            }
          }
        }

        // Check for completion events
        // Process content from messages/complete that may not have been in messages/partial
        if (chunk.event === 'messages/complete') {
          const data = chunk.data as LangGraphMessagesData;
          if (Array.isArray(data) && data.length > 0) {
            const lastMsg = data.at(-1);
            if (lastMsg && isAssistantMessage(lastMsg)) {
              const content = extractTextContent(lastMsg.content);

              // Skip filtered content
              const trimmedContent = content.trim().toLowerCase();
              if (
                !TECHNIQUE_IDS.includes(trimmedContent) &&
                !(content.includes('"detected_activity"') && content.includes('"confidence"'))
              ) {
                // Only yield if we have new content not already yielded via messages/partial
                if (content && content !== lastContent) {
                  yield { type: 'token', content };
                  lastContent = content;
                }
              }
            }
          }
          yield { type: 'done' };
        }
      }

      // If we received content but no explicit 'done' event, signal completion
      if (lastContent) {
        yield { type: 'done' };
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

  /**
   * Resumes an interrupted graph after user input (HITL pattern).
   *
   * Called after the user responds to a confirmation prompt (e.g., breathing technique).
   * The graph will resume from where it was paused and continue processing.
   *
   * @param resumeData - User's decision and any additional data
   * @param threadId - The conversation/thread ID
   * @yields StreamEvent objects as the graph resumes processing
   *
   * @example
   * for await (const event of client.resumeInterrupt(
   *   { decision: 'start', technique_id: 'box' },
   *   threadId
   * )) {
   *   if (event.type === 'token') {
   *     updateUI(event.content);
   *   }
   * }
   */
  async *resumeInterrupt(
    resumeData: { decision: string; technique_id?: string },
    threadId: string
  ): AsyncGenerator<StreamEvent> {
    yield { type: 'start' };

    try {
      // Resume the graph with the user's decision
      // The SDK's stream method with Command(resume=...) pattern
      const stream = this.client.runs.stream(threadId, GRAPH_NAME, {
        // Pass the resume data as a Command
        // This continues the graph from the interrupt point
        command: {
          resume: resumeData,
        },
        // Stream modes: 'messages' for token-by-token output,
        // 'updates' for graph events including interrupts
        streamMode: ['messages', 'updates'],
      });

      let lastContent = '';

      const isAssistantMessage = (msg: LangGraphMessage): boolean =>
        msg.role === 'assistant' || msg.role === 'ai' || msg.type === 'ai';

      for await (const chunk of stream) {
        // eslint-disable-next-line no-console
        console.log('Resume stream event:', chunk.event, JSON.stringify(chunk.data));

        if (chunk.event === 'messages/partial') {
          const data = chunk.data as LangGraphMessagesData;
          if (Array.isArray(data) && data.length > 0) {
            const lastMsg = data.at(-1);
            if (lastMsg && isAssistantMessage(lastMsg)) {
              const content = extractTextContent(lastMsg.content);

              // Filter out technique IDs
              const trimmedContent = content.trim().toLowerCase();
              if (TECHNIQUE_IDS.includes(trimmedContent)) {
                continue;
              }

              // Filter out detect_activity structured output JSON
              if (content.includes('"detected_activity"') && content.includes('"confidence"')) {
                continue;
              }

              if (content && content !== lastContent) {
                yield { type: 'token', content };
                lastContent = content;
              }
            }
          }
        }

        // Check for completion events
        // Process content from messages/complete that may not have been in messages/partial
        if (chunk.event === 'messages/complete') {
          const data = chunk.data as LangGraphMessagesData;
          if (Array.isArray(data) && data.length > 0) {
            const lastMsg = data.at(-1);
            if (lastMsg && isAssistantMessage(lastMsg)) {
              const content = extractTextContent(lastMsg.content);

              // Skip filtered content
              const trimmedContent = content.trim().toLowerCase();
              if (
                !TECHNIQUE_IDS.includes(trimmedContent) &&
                !(content.includes('"detected_activity"') && content.includes('"confidence"'))
              ) {
                // Only yield if we have new content not already yielded via messages/partial
                if (content && content !== lastContent) {
                  yield { type: 'token', content };
                  lastContent = content;
                }
              }
            }
          }
          yield { type: 'done' };
        }
      }

      if (lastContent) {
        yield { type: 'done' };
      }
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
