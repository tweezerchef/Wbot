/* ============================================================================
   Chat Route
   ============================================================================
   Route definition for the full-screen chatbot interface.
   The actual component is in components/pages/ChatPage.
   ============================================================================ */

import { createFileRoute } from '@tanstack/react-router';

import { ChatPage } from '../components/pages';

/* ----------------------------------------------------------------------------
   Route Definition
   ---------------------------------------------------------------------------- */
export const Route = createFileRoute('/chat')({
  component: ChatPage,
});
