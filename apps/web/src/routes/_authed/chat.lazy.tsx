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
  // Show skeleton immediately to prevent FOUC on initial load/refresh.
  pendingMs: 0,
  pendingComponent: ChatSkeleton,
  component: ChatPage,
});
