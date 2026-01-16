/**
 * Conversation Server Functions
 *
 * TanStack Start server functions for conversation operations.
 * These can be called from client components via RPC.
 *
 * Separated from route files to satisfy react-refresh/only-export-components rule.
 */

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import type { Message } from '@/lib/ai-client';
import { loadMessagesWithCache } from '@/lib/conversations.server';
import { authMiddleware } from '@/lib/middleware';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ----------------------------------------------------------------------------
// Schema Definitions
// ----------------------------------------------------------------------------

/** Schema for conversation ID validation */
const ConversationIdSchema = z.object({
  conversationId: z.uuid({ message: 'Invalid conversation ID format' }),
});

// ----------------------------------------------------------------------------
// Response Types
// ----------------------------------------------------------------------------

/** Response type for getConversationById */
export interface ConversationByIdResponse {
  success: boolean;
  messages: Message[];
  error?: string;
}

// ----------------------------------------------------------------------------
// Server Functions
// ----------------------------------------------------------------------------

/**
 * Load messages for a specific conversation.
 *
 * Demonstrates both Zod validation AND auth middleware patterns:
 * 1. authMiddleware validates user authentication before handler runs
 * 2. Validator validates input against ConversationIdSchema
 * 3. Handler receives typed context (user) and validated data (conversationId)
 *
 * Security:
 * - User must be authenticated (enforced by middleware)
 * - Conversation ownership is enforced via RLS policies on Supabase
 *
 * @example
 * // From client component:
 * const data = await getConversationById({ conversationId: 'uuid-here' });
 * if (data.success) {
 *   setMessages(data.messages);
 * }
 */
export const getConversationById = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((input: unknown) => ConversationIdSchema.parse(input))
  .handler(async ({ data, context }): Promise<ConversationByIdResponse> => {
    try {
      // User is guaranteed to exist here (middleware throws if not authenticated)
      // context.user contains { id, email } from authMiddleware
      void context; // User available via context.user if needed for logging

      const supabase = createServerSupabaseClient();

      // Load messages (RLS ensures user can only access their own conversations)
      const messages = await loadMessagesWithCache(data.conversationId, supabase);

      return { success: true, messages };
    } catch (err) {
      console.error('Failed to load conversation by ID:', err);
      return {
        success: false,
        messages: [],
        error: err instanceof Error ? err.message : 'Failed to load conversation',
      };
    }
  });
