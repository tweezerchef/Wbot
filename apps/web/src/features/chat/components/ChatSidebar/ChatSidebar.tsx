/* ----------------------------------------------------------------------------
   Chat Sidebar Component
   ----------------------------------------------------------------------------
   Navigation sidebar for the chat interface.
   Contains user profile, discover nav, conversation history, journal entries,
   meditation library, progress widget, and logout functionality.
   ---------------------------------------------------------------------------- */

import type { MeditationTrack } from '@wbot/shared';
import { Suspense, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ConversationHistory } from '../ConversationHistory';

import styles from './ChatSidebar.module.css';

import { ErrorFallback } from '@/components/feedback';
import { ActivityLoadingSkeleton } from '@/components/skeletons';
import { ChevronLeftIcon, LogoutIcon, NewChatIcon } from '@/components/ui/icons';
import type { JournalEntry } from '@/features/journaling/types';
import type { DirectComponent } from '@/features/navigation/types';
import { ThemeToggle } from '@/features/settings';

// Lazy load sidebar components
const SidebarProfile = lazy(() =>
  import('@/features/user/components/SidebarProfile/SidebarProfile').then((m) => ({
    default: m.SidebarProfile,
  }))
);
const DiscoverNav = lazy(() =>
  import('@/features/navigation/components/DiscoverNav/DiscoverNav').then((m) => ({
    default: m.DiscoverNav,
  }))
);
const JournalHistory = lazy(() =>
  import('@/features/journaling/components/JournalHistory/JournalHistory').then((m) => ({
    default: m.JournalHistory,
  }))
);
const ProgressWidget = lazy(() =>
  import('@/features/gamification/components/ProgressWidget/ProgressWidget').then((m) => ({
    default: m.ProgressWidget,
  }))
);
const PrerecordedMeditations = lazy(() =>
  import('@/features/meditation/components/PrerecordedMeditations/PrerecordedMeditations').then(
    (m) => ({
      default: m.PrerecordedMeditations,
    })
  )
);

/* ----------------------------------------------------------------------------
   Types
   ---------------------------------------------------------------------------- */

export interface ChatSidebarProps {
  /** Whether the sidebar is currently open */
  isOpen: boolean;
  /** Callback to close the sidebar */
  onClose: () => void;
  /** Whether the component has hydrated (for CLS prevention) */
  isHydrated: boolean;
  /** User's email address */
  userEmail?: string;
  /** User's ID */
  userId?: string;
  /** Current conversation ID */
  currentConversationId: string | null;
  /** Callback when user starts a new conversation */
  onNewConversation: () => Promise<void>;
  /** Callback when user selects a conversation */
  onSelectConversation: (conversationId: string) => void;
  /** Callback when user logs out */
  onLogout: () => Promise<void>;
  /** Callback when user selects a direct component from DiscoverNav */
  onDirectComponent: (component: DirectComponent) => void;
  /** Callback when user selects a journal entry */
  onSelectJournalEntry: (entry: JournalEntry) => void;
  /** Callback when user requests an activity via quick action */
  onActivityRequest: (type: 'breathing' | 'meditation' | 'journal' | 'sleep') => void;
  /** Callback when user selects a pre-recorded meditation track */
  onSelectPrerecordedMeditation: (track: MeditationTrack) => void;
}

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

/**
 * Chat sidebar navigation component.
 *
 * Features:
 * - User profile with streak info
 * - Quick discover actions
 * - Conversation history
 * - Journal entries history
 * - Progress tracking widget
 * - Theme toggle
 * - Logout button
 */
export function ChatSidebar({
  isOpen,
  onClose,
  isHydrated,
  userEmail,
  userId,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onLogout,
  onDirectComponent,
  onSelectJournalEntry,
  onActivityRequest,
  onSelectPrerecordedMeditation,
}: ChatSidebarProps) {
  const sidebarClassName = [
    styles.sidebar,
    isOpen ? styles.sidebarOpen : styles.sidebarClosed,
    isHydrated ? styles.sidebarHydrated : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside className={sidebarClassName}>
      {/* Collapse button - desktop only */}
      <button className={styles.collapseButton} onClick={onClose} aria-label="Collapse sidebar">
        <ChevronLeftIcon />
      </button>

      {/* User Profile Section */}
      <div className={styles.sidebarProfile}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={<div style={{ height: 48 }} />}>
            <SidebarProfile email={userEmail} streakDays={0} />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Navigation buttons */}
      <nav className={styles.sidebarNav}>
        <button className={styles.sidebarButton} onClick={() => void onNewConversation()}>
          <NewChatIcon />
          <span>New Conversation</span>
        </button>

        {/* Discover Section */}
        <div className={styles.sidebarSection}>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<div style={{ height: 200 }} />}>
              <DiscoverNav
                onItemClick={(item) => {
                  onActivityRequest(item);
                }}
                onTestComponent={onDirectComponent}
              />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Conversation History */}
        <div className={styles.sidebarSection}>
          <ConversationHistory
            userId={userId}
            currentConversationId={currentConversationId}
            onSelectConversation={onSelectConversation}
            onCloseSidebar={onClose}
          />
        </div>

        {/* Journal Entries */}
        <div className={styles.sidebarSection}>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<ActivityLoadingSkeleton />}>
              <JournalHistory onSelectEntry={onSelectJournalEntry} onCloseSidebar={onClose} />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Pre-recorded Meditation Library */}
        <div className={styles.sidebarSection}>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<ActivityLoadingSkeleton />}>
              <PrerecordedMeditations
                onSelectTrack={onSelectPrerecordedMeditation}
                onCloseSidebar={onClose}
              />
            </Suspense>
          </ErrorBoundary>
        </div>

        {/* Progress Widget */}
        <div className={styles.sidebarSection}>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<div style={{ height: 80 }} />}>
              <ProgressWidget streakDays={0} weeklyGoalCompleted={0} weeklyGoalTarget={5} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </nav>

      {/* Footer with theme toggle and logout */}
      <div className={styles.sidebarFooter}>
        <div className={styles.themeToggleWrapper}>
          <ThemeToggle />
        </div>
        <button className={styles.sidebarButton} onClick={() => void onLogout()}>
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
