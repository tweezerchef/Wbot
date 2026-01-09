/**
 * Badge Grid Component
 *
 * Grid display of achievement badges, optionally grouped by category.
 */

import { Badge, type BadgeData } from './Badge';
import styles from './Badge.module.css';

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

interface BadgeGridProps {
  badges: BadgeData[];
  groupByCategory?: boolean;
  showProgress?: boolean;
  onBadgeClick?: (badge: BadgeData) => void;
}

/* ----------------------------------------------------------------------------
   Category Labels
   ---------------------------------------------------------------------------- */

const categoryLabels = {
  consistency: 'Consistency',
  exploration: 'Exploration',
  milestone: 'Milestones',
  mastery: 'Mastery',
};

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function BadgeGrid({
  badges,
  groupByCategory = false,
  showProgress = false,
  onBadgeClick,
}: BadgeGridProps) {
  if (!groupByCategory) {
    return (
      <div className={styles.grid}>
        {badges.map((badge) => (
          <Badge
            key={badge.id}
            badge={badge}
            showProgress={showProgress}
            onClick={
              onBadgeClick
                ? () => {
                    onBadgeClick(badge);
                  }
                : undefined
            }
          />
        ))}
      </div>
    );
  }

  // Group badges by category
  const groupedBadges = badges.reduce<Record<string, BadgeData[]>>((acc, badge) => {
    acc[badge.category] ??= [];
    acc[badge.category].push(badge);
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(groupedBadges).map(([category, categoryBadges]) => (
        <div key={category} className={styles.gridSection}>
          <h4 className={styles.gridSectionTitle}>
            {categoryLabels[category as keyof typeof categoryLabels]}
          </h4>
          <div className={styles.grid}>
            {categoryBadges.map((badge) => (
              <Badge
                key={badge.id}
                badge={badge}
                showProgress={showProgress}
                onClick={
                  onBadgeClick
                    ? () => {
                        onBadgeClick(badge);
                      }
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
