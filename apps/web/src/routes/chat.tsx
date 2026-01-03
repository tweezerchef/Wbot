/* ============================================================================
   Chat Route
   ============================================================================
   Route definition for the full-screen chatbot interface.

   Data Loading:
   - Loader fetches the most recent conversation on route entry
   - Runs client-side where Supabase auth is available
   - ChatPage receives initial data via useLoaderData()
   ============================================================================ */

import { createFileRoute } from '@tanstack/react-router';

import { ChatPage } from '../components/pages';
import type { Message } from '../lib/ai-client';
import { getMostRecentConversation, loadMessages } from '../lib/conversations';
import { supabase } from '../lib/supabase';

/* ----------------------------------------------------------------------------
   Loader Data Type
   ---------------------------------------------------------------------------- */
export interface ChatLoaderData {
  conversationId: string | null;
  messages: Message[];
}

/* ----------------------------------------------------------------------------
   Route Definition
   ---------------------------------------------------------------------------- */
export const Route = createFileRoute('/chat')({
  /**
   * Loads the most recent conversation before rendering ChatPage.
   *
   * Runs client-side where Supabase session is available.
   * Returns empty state if no session or no conversations exist.
   */
  loader: async (): Promise<ChatLoaderData> => {
    // Only run on client where Supabase auth is available
    if (typeof window === 'undefined') {
      return { conversationId: null, messages: [] };
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        return { conversationId: null, messages: [] };
      }

      // Fetch most recent conversation
      const conversationId = await getMostRecentConversation(session.user.id);

      if (!conversationId) {
        return { conversationId: null, messages: [] };
      }

      // Load messages for that conversation
      const messages = await loadMessages(conversationId);

      return { conversationId, messages };
    } catch (error) {
      console.error('Failed to load conversation in loader:', error);
      return { conversationId: null, messages: [] };
    }
  },

  component: ChatPage,
});
