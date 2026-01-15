/**
 * Theme Toggle Component
 *
 * Toggle between light, dark, and system themes.
 */

import { useTheme, type Theme } from './ThemeContext';
import styles from './ThemeToggle.module.css';

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

interface ThemeToggleProps {
  /** Show text labels */
  showLabels?: boolean;
  /** Custom className */
  className?: string;
}

/* ----------------------------------------------------------------------------
   Icons
   ---------------------------------------------------------------------------- */

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

/* ----------------------------------------------------------------------------
   Theme Options
   ---------------------------------------------------------------------------- */

const themeOptions: { value: Theme; icon: () => React.ReactNode; label: string }[] = [
  { value: 'light', icon: SunIcon, label: 'Light' },
  { value: 'system', icon: SystemIcon, label: 'System' },
  { value: 'dark', icon: MoonIcon, label: 'Dark' },
];

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function ThemeToggle({ showLabels = false, className }: ThemeToggleProps) {
  const { theme, setTheme, mounted } = useTheme();

  const containerClasses = [styles.container, showLabels && styles.withLabels, className]
    .filter(Boolean)
    .join(' ');

  // Render disabled placeholder during SSR/hydration to prevent mismatch
  // Server always renders with 'system' as active (defaultTheme)
  // After mount, the actual theme from localStorage is shown
  if (!mounted) {
    return (
      <div className={containerClasses} role="radiogroup" aria-label="Theme selection">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          // Match server's defaultTheme='system' to avoid hydration mismatch
          const isActive = option.value === 'system';

          return (
            <button
              key={option.value}
              className={`${styles.option} ${isActive ? styles.active : ''}`}
              role="radio"
              aria-checked={isActive}
              aria-label={option.label}
              type="button"
              disabled
            >
              <Icon />
              {showLabels && <span className={styles.optionLabel}>{option.label}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={containerClasses} role="radiogroup" aria-label="Theme selection">
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = theme === option.value;

        return (
          <button
            key={option.value}
            className={`${styles.option} ${isActive ? styles.active : ''}`}
            onClick={() => {
              setTheme(option.value);
            }}
            role="radio"
            aria-checked={isActive}
            aria-label={option.label}
            type="button"
          >
            <Icon />
            {showLabels && <span className={styles.optionLabel}>{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
