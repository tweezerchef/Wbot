/* ============================================================================
   Chat Route
   ============================================================================
   Route definition for the full-screen chatbot interface.

   Data Loading:
   - Uses a server function to fetch conversation data server-side
   - Accesses Supabase session via cookies for SSR
   - ChatPage receives initial data via useLoaderData()
   ============================================================================ */

import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';

import { ChatPage } from '../components/pages';
import type { Message } from '../lib/ai-client';
import { getMostRecentConversation, loadMessagesWithCache } from '../lib/conversations.server';
import { createServerSupabaseClient } from '../lib/supabase/server';

/* ----------------------------------------------------------------------------
   Loader Data Type
   ---------------------------------------------------------------------------- */
export interface ChatLoaderData {
  conversationId: string | null;
  messages: Message[];
}

/* ----------------------------------------------------------------------------
   Server Function - Fetches conversation data server-side
   ----------------------------------------------------------------------------
   This runs on the server where we have access to auth cookies.
   Returns the most recent conversation and its messages.
   ---------------------------------------------------------------------------- */
const getConversationData = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ChatLoaderData> => {
    try {
      // Create server-side Supabase client with cookie access
      const supabase = createServerSupabaseClient();

      // Get the authenticated user from the session cookie
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        // No authenticated user - return empty state
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

/* ----------------------------------------------------------------------------
   Route Definition
   ---------------------------------------------------------------------------- */
export const Route = createFileRoute('/chat')({
  /**
   * Loads the most recent conversation before rendering ChatPage.
   *
   * Calls the server function to fetch data with full auth context.
   */
  loader: () => getConversationData(),

  component: ChatPage,
});
