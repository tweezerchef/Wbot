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
 */

import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { ChatPage } from '../../components/pages';
import type { Message } from '../../lib/ai-client';
import { getMostRecentConversation, loadMessagesWithCache } from '../../lib/conversations.server';
import { createServerSupabaseClient } from '../../lib/supabase/server';

// ----------------------------------------------------------------------------
// Loader Data Type
// ----------------------------------------------------------------------------
export interface ChatLoaderData {
  conversationId: string | null;
  messages: Message[];
}

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
        return { conversationId: null, messages: [] };
      }

      // Load all messages for the conversation (with Redis cache)
      const messages = await loadMessagesWithCache(conversationId, supabase);

      return { conversationId, messages };
    } catch (err) {
      console.error('Failed to load conversation in server function:', err);
      return { conversationId: null, messages: [] };
    }
  }
);

// ----------------------------------------------------------------------------
// Route Definition
// ----------------------------------------------------------------------------
export const Route = createFileRoute('/_authed/chat')({
  /**
   * Loads the most recent conversation before rendering ChatPage.
   *
   * The user is already authenticated (guaranteed by _authed layout).
   * The server function re-validates via cookies for SSR safety.
   */
  loader: () => getConversationData(),

  component: ChatPage,
});
