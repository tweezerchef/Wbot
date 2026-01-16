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
import { z } from 'zod';

import type { Message } from '@/lib/ai-client';
import { getMostRecentConversation, loadMessagesWithCache } from '@/lib/conversations.server';
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
// Route Definition
// ----------------------------------------------------------------------------
// Note: getConversationById server function moved to @/lib/server-functions/conversations
// to satisfy react-refresh/only-export-components rule.
export const Route = createFileRoute('/_authed/chat')({
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
