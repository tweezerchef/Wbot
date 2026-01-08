/**
 * Sidebar Profile Component
 *
 * Displays user avatar, name, and streak in the sidebar.
 * Provides a link to full profile/settings.
 */

import styles from './SidebarProfile.module.css';

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

interface SidebarProfileProps {
  /** User's display name */
  name?: string;
  /** User's email (for initial fallback) */
  email?: string;
  /** User's avatar URL */
  avatarUrl?: string;
  /** Current streak count */
  streakDays?: number;
}

/* ----------------------------------------------------------------------------
   Flame Icon
   ---------------------------------------------------------------------------- */

function FlameIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.517 1.282-4.88 3.5-6.5-.5 2 .5 3.5 1.5 4 0-3 1.5-5.5 4-7.5.5 1.5 1.5 2.5 2.5 3 1-2 2-3.5 1.5-5.5 3.5 2 5 5.5 5 9 0 5.523-4.477 10-10 10zm0-2c4.418 0 8-3.582 8-8 0-2.5-1-4.5-2.5-6-.5 2-1.5 3-2.5 3.5.5-2-1-4-2.5-5.5-1 2-2 4-2 6 0 1-.5 2-1.5 2.5-.5-1-1-2-.5-3.5-1.5 1.5-2.5 3.5-2.5 6 0 3.314 2.686 6 6 6z" />
    </svg>
  );
}

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function SidebarProfile({ name, email, avatarUrl, streakDays = 0 }: SidebarProfileProps) {
  // Get initial for avatar fallback
  const initial = name?.[0] ?? email?.[0] ?? 'U';
  const displayName = name ?? email?.split('@')[0] ?? 'User';

  return (
    <div className={styles.container}>
      {/* Avatar */}
      <div className={styles.avatar}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className={styles.avatarImage} />
        ) : (
          initial.toUpperCase()
        )}
      </div>

      {/* User info */}
      <div className={styles.info}>
        <p className={styles.name}>{displayName}</p>
        {streakDays > 0 && (
          <div className={styles.streak}>
            <span className={styles.streakIcon}>
              <FlameIcon />
            </span>
            <span className={styles.streakCount}>{streakDays}</span>
            <span>day streak</span>
          </div>
        )}
      </div>
    </div>
  );
}
