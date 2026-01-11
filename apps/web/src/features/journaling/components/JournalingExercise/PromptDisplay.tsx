/* ============================================================================
   PromptDisplay Component
   ============================================================================
   Displays a journaling prompt with category badge and estimated time.
   Used in both the idle state and confirmation dialogs.
   ============================================================================ */

import { CATEGORY_INFO, type PromptDisplayProps } from '../../types';

import styles from './JournalingExercise.module.css';

/**
 * PromptDisplay - Shows a journaling prompt in a card format.
 *
 * Features:
 * - Category badge with emoji and color
 * - Estimated time indicator
 * - "Best for" tags
 * - Compact mode for smaller displays
 */
export function PromptDisplay({
  prompt,
  showTime = true,
  showCategory = true,
  compact = false,
}: PromptDisplayProps) {
  const categoryInfo = CATEGORY_INFO[prompt.category];

  return (
    <div className={`${styles.promptCard} ${compact ? styles.promptCardCompact : ''}`}>
      {/* Category and time header */}
      <div className={styles.promptHeader}>
        {showCategory && (
          <span
            className={styles.categoryBadge}
            style={{ '--category-color': categoryInfo.color } as React.CSSProperties}
          >
            <span className={styles.categoryEmoji}>{categoryInfo.emoji}</span>
            <span className={styles.categoryLabel}>{categoryInfo.label}</span>
          </span>
        )}
        {showTime && (
          <span className={styles.timeEstimate}>~{prompt.estimated_time_minutes} min</span>
        )}
      </div>

      {/* Main prompt text */}
      <p className={styles.promptMainText}>{prompt.text}</p>

      {/* Best for tags */}
      {!compact && prompt.best_for.length > 0 && (
        <div className={styles.bestForTags}>
          {prompt.best_for.map((tag) => (
            <span key={tag} className={styles.bestForTag}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
