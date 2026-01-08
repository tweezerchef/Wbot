/**
 * Weekly Goals Component
 *
 * Week day visualization showing completed and upcoming days.
 * Includes progress bar and encouraging messages.
 */

import styles from './WeeklyGoals.module.css';

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

interface WeeklyGoalsProps {
  /** Days completed this week (array of day indices, 0=Monday) */
  completedDays?: number[];
  /** Weekly goal target (default 5) */
  target?: number;
  /** Whether to use compact styling */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

/* ----------------------------------------------------------------------------
   Helper Functions
   ---------------------------------------------------------------------------- */

function getEncouragementMessage(completed: number, target: number): string {
  if (completed === 0) {
    return 'Start your week strong! Complete your first session.';
  }
  if (completed >= target) {
    return 'Goal achieved! Amazing work this week!';
  }
  const remaining = target - completed;
  if (remaining === 1) {
    return 'Just one more day to reach your goal!';
  }
  return `${remaining.toString()} more days to reach your weekly goal`;
}

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function WeeklyGoals({
  completedDays = [],
  target = 5,
  compact = false,
  className,
}: WeeklyGoalsProps) {
  // Week days starting from Monday
  const weekDays = [
    { label: 'Mon', short: 'M' },
    { label: 'Tue', short: 'T' },
    { label: 'Wed', short: 'W' },
    { label: 'Thu', short: 'T' },
    { label: 'Fri', short: 'F' },
    { label: 'Sat', short: 'S' },
    { label: 'Sun', short: 'S' },
  ];

  // Get current day (0 = Monday in our system)
  const today = new Date().getDay();
  const adjustedToday = today === 0 ? 6 : today - 1; // Convert Sunday=0 to Monday=0

  const completedCount = completedDays.length;
  const progressPercent = Math.min((completedCount / target) * 100, 100);

  const containerClasses = [styles.container, compact && styles.compact, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Weekly Goal</h3>
        <span className={styles.progressText}>
          <span className={styles.progressCount}>{completedCount}</span> / {target} days
        </span>
      </div>

      {/* Day Circles */}
      <div className={styles.daysContainer}>
        {weekDays.map((day, index) => {
          const isCompleted = completedDays.includes(index);
          const isToday = index === adjustedToday;

          const circleClasses = [
            styles.dayCircle,
            isCompleted && styles.completed,
            isToday && styles.today,
          ]
            .filter(Boolean)
            .join(' ');

          const labelClasses = [styles.dayLabel, isToday && styles.today].filter(Boolean).join(' ');

          return (
            <div key={index} className={styles.dayWrapper}>
              <div
                className={circleClasses}
                title={`${day.label} - ${isCompleted ? 'Completed' : isToday ? 'Today' : 'Upcoming'}`}
              >
                {isCompleted ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  day.short
                )}
              </div>
              <span className={labelClasses}>{day.label}</span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progressPercent.toString()}%` }} />
      </div>

      {/* Encouragement */}
      <p className={styles.encouragement}>{getEncouragementMessage(completedCount, target)}</p>
    </div>
  );
}
