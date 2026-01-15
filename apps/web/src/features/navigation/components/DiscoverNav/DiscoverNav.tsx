/**
 * Discover Navigation Component
 *
 * Navigation items for discovering activities in the sidebar.
 * Supports both AI-driven activities and direct component access.
 */

import { useState, useCallback } from 'react';

import type { DirectComponent } from '../../types';

import styles from './DiscoverNav.module.css';

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

interface DiscoverNavProps {
  /** Currently active item */
  activeItem?: string;
  /** Callback when an AI-driven item is clicked (sends message to chat) */
  onItemClick?: (item: 'breathing' | 'meditation' | 'journal' | 'sleep') => void;
  /** Callback when a direct component is selected */
  onTestComponent?: (component: DirectComponent) => void;
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

function WellnessIcon() {
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
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function GamificationIcon() {
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
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
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

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-5.36-1.42 1.42m-9.9 9.9-1.42 1.42m12.73 0-1.41-1.42M6.34 6.34 4.93 7.76" />
    </svg>
  );
}

/* ----------------------------------------------------------------------------
   Category Data
   ---------------------------------------------------------------------------- */

interface SubItem {
  id: string;
  label: string;
  component?: DirectComponent;
  aiAction?: 'breathing' | 'meditation' | 'journal';
}

interface Category {
  id: string;
  label: string;
  icon: React.ComponentType;
  items: SubItem[];
  disabled?: boolean;
  comingSoon?: boolean;
}

const categories: Category[] = [
  {
    id: 'breathing',
    label: 'Breathing Exercises',
    icon: BreathingIcon,
    items: [
      { id: 'box', label: 'Box Breathing', component: { type: 'breathing', variant: 'box' } },
      {
        id: '478',
        label: '4-7-8 Relaxing',
        component: { type: 'breathing', variant: 'relaxing_478' },
      },
      { id: 'coherent', label: 'Coherent', component: { type: 'breathing', variant: 'coherent' } },
      { id: 'deep', label: 'Deep Calm', component: { type: 'breathing', variant: 'deep_calm' } },
      {
        id: 'wimhof',
        label: 'Wim Hof Method',
        component: { type: 'breathing', variant: 'wimhof' },
      },
      { id: 'ai-breathing', label: 'Ask AI', aiAction: 'breathing' },
    ],
  },
  {
    id: 'meditation',
    label: 'Meditation',
    icon: MeditationIcon,
    items: [
      { id: 'timer', label: 'Silent Timer', component: { type: 'meditation', variant: 'timer' } },
      {
        id: 'guided',
        label: 'Guided Session',
        component: { type: 'meditation', variant: 'guided' },
      },
      {
        id: 'library',
        label: 'Browse Library',
        component: { type: 'meditation', variant: 'library' },
      },
      { id: 'ai-meditation', label: 'Ask AI', aiAction: 'meditation' },
    ],
  },
  {
    id: 'wellness',
    label: 'Wellness',
    icon: WellnessIcon,
    items: [
      {
        id: 'moodcheck',
        label: 'Mood Check',
        component: { type: 'wellness', variant: 'moodcheck' },
      },
      {
        id: 'profile',
        label: 'Wellness Profile',
        component: { type: 'wellness', variant: 'profile' },
      },
    ],
  },
  {
    id: 'gamification',
    label: 'Progress & Goals',
    icon: GamificationIcon,
    items: [
      { id: 'badges', label: 'Badges', component: { type: 'gamification', variant: 'badges' } },
      {
        id: 'streak',
        label: 'Streak Display',
        component: { type: 'gamification', variant: 'streak' },
      },
      { id: 'goals', label: 'Weekly Goals', component: { type: 'gamification', variant: 'goals' } },
    ],
  },
  {
    id: 'journal',
    label: 'Journaling',
    icon: JournalIcon,
    items: [{ id: 'ai-journal', label: 'Start with AI', aiAction: 'journal' }],
  },
  {
    id: 'sleep',
    label: 'Sleep Stories',
    icon: SleepIcon,
    items: [],
    disabled: true,
    comingSoon: true,
  },
];

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function DiscoverNav({
  activeItem: _activeItem,
  onItemClick,
  onTestComponent,
}: DiscoverNavProps) {
  // Track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['breathing', 'meditation']) // Default expanded
  );

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const handleSubItemClick = useCallback(
    (item: SubItem) => {
      if (item.component) {
        onTestComponent?.(item.component);
      } else if (item.aiAction) {
        onItemClick?.(item.aiAction);
      }
    },
    [onTestComponent, onItemClick]
  );

  return (
    <nav className={styles.container} aria-label="Discover activities">
      <span className={styles.sectionHeader}>Discover</span>

      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const hasItems = category.items.length > 0;

        return (
          <div key={category.id} className={styles.categoryWrapper}>
            <button
              className={`${styles.category} ${category.disabled ? styles.disabled : ''}`}
              onClick={() => {
                if (!category.disabled && hasItems) {
                  toggleCategory(category.id);
                }
              }}
              disabled={category.disabled}
              aria-expanded={hasItems ? isExpanded : undefined}
              type="button"
            >
              <span className={styles.categoryIcon}>
                <category.icon />
              </span>
              <span className={styles.categoryLabel}>{category.label}</span>
              {category.comingSoon && <span className={styles.comingSoon}>Soon</span>}
              {hasItems && !category.disabled && <ChevronIcon isOpen={isExpanded} />}
            </button>

            {hasItems && isExpanded && (
              <div className={styles.categoryItems}>
                {category.items.map((item) => (
                  <button
                    key={item.id}
                    className={`${styles.subItem} ${item.aiAction ? styles.aiItem : ''}`}
                    onClick={() => {
                      handleSubItemClick(item);
                    }}
                    type="button"
                  >
                    <span className={styles.subItemLabel}>{item.label}</span>
                    {/* Component items don't need badges - they render directly */}
                    {item.aiAction && (
                      <span className={styles.aiBadge}>
                        <SparkleIcon />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
