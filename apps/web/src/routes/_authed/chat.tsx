/**
 * Chat Route (Protected)
 *
 * Route definition for the full-screen chatbot interface.
 * This route is protected by the _authed layout - users must be
 * authenticated to access it.
 *
 * Data Loading:
 * - User is already validated by _authed.tsx beforeLoad
 * - Server function re-validates auth via cookies (SSR-safe)
 * - Fetches conversation data for the authenticated user
 *
 * FOUC Prevention:
 * - pendingMs: 0 shows skeleton immediately on initial load
 * - ChatSkeleton uses inline styles to avoid CSS module FOUC
 */

import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';

import type { Message } from '@/lib/ai-client';
import { getMostRecentConversation, loadMessagesWithCache } from '@/lib/conversations.server';
import { authMiddleware } from '@/lib/middleware';
import { conversationMessagesOptions } from '@/lib/queries';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ----------------------------------------------------------------------------
// Loader Data Type
// ----------------------------------------------------------------------------
export interface ChatLoaderData {
  conversationId: string | null;
  messages: Message[];
  userEmail?: string;
  userId?: string;
}

// ----------------------------------------------------------------------------
// Search Params Schema
// ----------------------------------------------------------------------------
// Enables deep linking to specific conversations via URL
// e.g., /chat?conversationId=uuid-here
const chatSearchSchema = z.object({
  /** Optional conversation ID for deep linking to a specific conversation */
  conversationId: z.uuid().optional(),
  /** Optional message ID to scroll to after loading */
  scrollTo: z.string().optional(),
});

export type ChatSearchParams = z.infer<typeof chatSearchSchema>;

// ----------------------------------------------------------------------------
// Server Function - Fetches conversation data server-side
// ----------------------------------------------------------------------------
// This runs on the server where we have access to auth cookies and Redis.
// We re-fetch the user from cookies to ensure SSR-safe authentication.
const getConversationData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ChatLoaderData> => {
    try {
      // Create server-side Supabase client with cookie access
      const supabase = createServerSupabaseClient();

      // Get the authenticated user from cookies
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        // This shouldn't happen since _authed layout already checked auth
        // But return empty state as a safety measure
        return { conversationId: null, messages: [] };
      }

      // Fetch the most recent conversation for this user
      const conversationId = await getMostRecentConversation(user.id, supabase);

      if (!conversationId) {
        // User has no conversations yet
        return { conversationId: null, messages: [], userEmail: user.email, userId: user.id };
      }

      // Load all messages for the conversation (with Redis cache)
      const messages = await loadMessagesWithCache(conversationId, supabase);

      return { conversationId, messages, userEmail: user.email, userId: user.id };
    } catch (err) {
      console.error('Failed to load conversation in server function:', err);
      return { conversationId: null, messages: [] };
    }
  }
);

// ----------------------------------------------------------------------------
// Server Function - Load specific conversation by ID (with Zod validation)
// ----------------------------------------------------------------------------
// Demonstrates TanStack Start's validator pattern for input validation.
// Uses Zod for type-safe runtime validation before handler execution.

/** Schema for conversation ID validation */
const ConversationIdSchema = z.object({
  conversationId: z.uuid({ message: 'Invalid conversation ID format' }),
});

/** Response type for getConversationById */
interface ConversationByIdResponse {
  success: boolean;
  messages: Message[];
  error?: string;
}

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

// ----------------------------------------------------------------------------
// Route Definition
// ----------------------------------------------------------------------------
export const Route = createFileRoute('/_authed/chat')({
  // Validate search params for deep linking (e.g., ?conversationId=uuid)
  // Note: Deep linking is handled client-side via useSearch() hook
  validateSearch: zodValidator(chatSearchSchema),

  /**
   * Loads conversation data before rendering ChatPage.
   *
   * The user is already authenticated (guaranteed by _authed layout).
   * The server function re-validates via cookies for SSR safety.
   *
   * Also pre-populates the TanStack Query cache for client-side consistency.
   *
   * Note: Deep linking to specific conversations via ?conversationId=uuid
   * is handled client-side after initial load.
   */
  loader: async ({ context }) => {
    const data = await getConversationData();

    // Pre-populate TanStack Query cache for client-side access
    // This enables other components to access messages from cache
    const { conversationId } = data;
    if (conversationId) {
      context.queryClient.setQueryData(
        conversationMessagesOptions(conversationId).queryKey,
        // Transform Message[] to MessageRow[] format expected by Query
        data.messages.map((m) => ({
          id: m.id,
          conversation_id: conversationId,
          role: m.role,
          content: m.content,
          created_at: m.createdAt instanceof Date ? m.createdAt.toISOString() : String(m.createdAt),
          metadata: null,
          search_vector: null,
        }))
      );
    }

    return data;
  },

  // Component is defined in chat.lazy.tsx for code splitting.
});
