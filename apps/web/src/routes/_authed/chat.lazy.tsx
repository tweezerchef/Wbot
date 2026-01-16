/**
 * Chat Route (Lazy UI)
 *
 * Non-critical UI is split into a lazy route file to keep CSS scoped
 * to the chat chunk and reduce initial CSS payload.
 */

import { createLazyFileRoute } from '@tanstack/react-router';

import { ChatSkeleton } from '@/components/skeletons';
import { ChatPage } from '@/features/chat';

export const Route = createLazyFileRoute('/_authed/chat')({
  // pendingComponent is allowed in lazy routes for code splitting.
  // pendingMs is defined in the main chat.tsx file.
  pendingComponent: ChatSkeleton,
  component: ChatPage,
});
