/**
 * Discover Navigation Component
 *
 * Navigation items for discovering activities in the sidebar.
 * Shows breathing, meditation, journaling, and sleep activities.
 */

import styles from './DiscoverNav.module.css';

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

interface DiscoverNavProps {
  /** Currently active item */
  activeItem?: 'breathing' | 'meditation' | 'journal' | 'sleep';
  /** Callback when an item is clicked */
  onItemClick?: (item: 'breathing' | 'meditation' | 'journal' | 'sleep') => void;
}

/* ----------------------------------------------------------------------------
   Icons
   ---------------------------------------------------------------------------- */

function BreathingIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4l2 2" />
    </svg>
  );
}

function MeditationIcon() {
  return (
    <svg
      width="20"
      height="20"
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
      width="20"
      height="20"
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

function SleepIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

/* ----------------------------------------------------------------------------
   Navigation Items
   ---------------------------------------------------------------------------- */

const navItems = [
  {
    id: 'breathing' as const,
    label: 'Breathing Exercises',
    icon: BreathingIcon,
    disabled: false,
  },
  {
    id: 'meditation' as const,
    label: 'Meditations',
    icon: MeditationIcon,
    disabled: false,
  },
  {
    id: 'journal' as const,
    label: 'Journaling',
    icon: JournalIcon,
    disabled: false,
  },
  {
    id: 'sleep' as const,
    label: 'Sleep Stories',
    icon: SleepIcon,
    disabled: true,
    comingSoon: true,
  },
];

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function DiscoverNav({ activeItem, onItemClick }: DiscoverNavProps) {
  return (
    <nav className={styles.container} aria-label="Discover activities">
      <span className={styles.sectionHeader}>Discover</span>

      {navItems.map((item) => (
        <button
          key={item.id}
          className={`${styles.navItem} ${activeItem === item.id ? styles.active : ''} ${item.disabled ? styles.disabled : ''}`}
          onClick={() => !item.disabled && onItemClick?.(item.id)}
          disabled={item.disabled}
          aria-current={activeItem === item.id ? 'page' : undefined}
          type="button"
        >
          <span className={styles.navIcon}>
            <item.icon />
          </span>
          <span className={styles.navLabel}>{item.label}</span>
          {item.comingSoon && <span className={styles.comingSoon}>Soon</span>}
        </button>
      ))}
    </nav>
  );
}
