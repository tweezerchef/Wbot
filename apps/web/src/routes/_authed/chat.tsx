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
 *
 * CSS Loading:
 * - Route-specific CSS loaded via head() for optimal performance
 * - Activity CSS lazy-loaded via loadActivityCSS() when needed
 */

import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import type { Message } from '@/lib/ai-client';
import { getMostRecentConversation, loadMessagesWithCache } from '@/lib/conversations.server';
import { conversationMessagesOptions } from '@/lib/queries';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import chatCSS from '@/styles/routes/chat.css?url';

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
// Input Schema for Server Function
// ----------------------------------------------------------------------------
const ConversationDataInputSchema = z.object({
  userId: z.uuid(),
  userEmail: z.email().optional(),
});

// ----------------------------------------------------------------------------
// Server Function - Fetches conversation data server-side
// ----------------------------------------------------------------------------
// This runs on the server where we have access to Redis cache.
// User is already validated by _authed layout - we pass the user context
// directly to avoid redundant auth calls (~100-150ms savings).
const getConversationData = createServerFn({ method: 'GET' })
  .inputValidator((input: unknown) => ConversationDataInputSchema.parse(input))
  .handler(async ({ data }): Promise<ChatLoaderData> => {
    const { userId, userEmail } = data;
    try {
      // Create server-side Supabase client for DB access
      // Note: We skip auth.getUser() since _authed already validated the user
      const supabase = createServerSupabaseClient();

      // Fetch the most recent conversation for this user
      const conversationId = await getMostRecentConversation(userId, supabase);

      if (!conversationId) {
        // User has no conversations yet
        return { conversationId: null, messages: [], userEmail, userId };
      }

      // Load all messages for the conversation (Redis cache-first)
      const messages = await loadMessagesWithCache(conversationId, supabase);

      return { conversationId, messages, userEmail, userId };
    } catch (err) {
      console.error('Failed to load conversation in server function:', err);
      return { conversationId: null, messages: [] };
    }
  });

// ----------------------------------------------------------------------------
// Route Definition
// ----------------------------------------------------------------------------
// Note: getConversationById server function moved to @/lib/server-functions/conversations
// to satisfy react-refresh/only-export-components rule.
export const Route = createFileRoute('/_authed/chat')({
  // Load route-specific CSS via <link> in <head>
  head: () => ({
    links: [{ rel: 'stylesheet', href: chatCSS }],
  }),

  // Validate search params for deep linking (e.g., ?conversationId=uuid)
  // Note: Deep linking is handled client-side via useSearch() hook
  // Zod 4 supports Standard Schema, so we can use the schema directly
  validateSearch: chatSearchSchema,

  // Show skeleton immediately to prevent FOUC on initial load/refresh.
  // pendingMs must be in the main route file (not lazy) as it's a critical option.
  pendingMs: 0,

  /**
   * Loads conversation data before rendering ChatPage.
   *
   * The user is already authenticated (guaranteed by _authed layout).
   * User context is passed from _authed.beforeLoad to avoid redundant auth calls.
   *
   * Also pre-populates the TanStack Query cache for client-side consistency.
   *
   * Note: Deep linking to specific conversations via ?conversationId=uuid
   * is handled client-side after initial load.
   */
  loader: async ({ context }) => {
    // Get user from parent _authed route context (avoids redundant auth call)
    const user = context.user;
    const data = await getConversationData({ data: { userId: user.id, userEmail: user.email } });

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
