/**
 * Chat Empty State Component
 *
 * A welcoming empty state shown when the chat has no messages.
 * Features:
 * - Organic blob illustration (animated)
 * - Welcome headline and supportive subtext
 * - Quick action cards for main features
 * - Conversation starter chips (clickable)
 */

import styles from './ChatEmptyState.module.css';

import { WelcomeIllustration } from '@/components/illustrations';

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

interface ChatEmptyStateProps {
  /** Callback when a quick action is clicked */
  onQuickAction?: (action: 'breathing' | 'meditation' | 'journal') => void;
  /** Callback when a conversation starter is clicked */
  onStarterClick?: (message: string) => void;
}

/* ----------------------------------------------------------------------------
   Icons for Quick Actions
   ---------------------------------------------------------------------------- */

function BreathingIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function MeditationIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z" />
      <path d="M8 14v1a4 4 0 0 0 8 0v-1" />
      <path d="M12 19v3" />
      <path d="M8 22h8" />
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      <path d="M8 7h6" />
      <path d="M8 11h8" />
    </svg>
  );
}

/* ----------------------------------------------------------------------------
   Quick Actions Data
   ---------------------------------------------------------------------------- */

const quickActions = [
  {
    id: 'breathing' as const,
    icon: BreathingIcon,
    title: 'Breathing',
    description: 'Start a calming breathing exercise',
    iconClass: 'breathing',
  },
  {
    id: 'meditation' as const,
    icon: MeditationIcon,
    title: 'Meditate',
    description: 'Find calm with guided meditation',
    iconClass: 'meditation',
  },
  {
    id: 'journal' as const,
    icon: JournalIcon,
    title: 'Journal',
    description: 'Reflect on your thoughts',
    iconClass: 'journal',
  },
];

/* ----------------------------------------------------------------------------
   Conversation Starters
   ---------------------------------------------------------------------------- */

const conversationStarters = [
  "I'm feeling anxious",
  'Guide me through a breathing exercise',
  'Help me sleep better',
];

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function ChatEmptyState({ onQuickAction, onStarterClick }: ChatEmptyStateProps) {
  return (
    <div className={styles.container}>
      {/* Animated Illustration */}
      <div className={styles.illustration}>
        <WelcomeIllustration />
      </div>

      {/* Welcome Text */}
      <div className={styles.textContent}>
        <h2 className={styles.headline}>Welcome to Wbot</h2>
      </div>

      {/* Quick Action Cards */}
      <div className={styles.quickActions}>
        {quickActions.map((action) => (
          <button
            key={action.id}
            className={styles.actionCard}
            onClick={() => onQuickAction?.(action.id)}
            type="button"
            aria-label={`Start ${action.title.toLowerCase()}`}
          >
            <div className={`${styles.actionIcon} ${styles[action.iconClass]}`}>
              <action.icon />
            </div>
            <span className={styles.actionTitle}>{action.title}</span>
            <span className={styles.actionDescription}>{action.description}</span>
          </button>
        ))}
      </div>

      {/* Conversation Starters */}
      <div className={styles.startersSection}>
        <p className={styles.startersLabel}>Or try asking:</p>
        <div className={styles.starters}>
          {conversationStarters.map((starter) => (
            <button
              key={starter}
              className={styles.starterChip}
              onClick={() => onStarterClick?.(starter)}
              type="button"
            >
              "{starter}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
