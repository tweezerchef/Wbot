/**
 * Progress Widget Component
 *
 * Mini streak display and weekly goal visualization for the sidebar.
 * Shows current streak and weekly progress with encouraging messages.
 */

import styles from './ProgressWidget.module.css';

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

interface ProgressWidgetProps {
  /** Current streak count in days */
  streakDays?: number;
  /** Days completed this week (0-7) */
  weeklyGoalCompleted?: number;
  /** Weekly goal target */
  weeklyGoalTarget?: number;
  /** Which day of the week (0 = Sunday, 6 = Saturday) */
  currentDayOfWeek?: number;
}

/* ----------------------------------------------------------------------------
   Flame Icon
   ---------------------------------------------------------------------------- */

function FlameIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.517 1.282-4.88 3.5-6.5-.5 2 .5 3.5 1.5 4 0-3 1.5-5.5 4-7.5.5 1.5 1.5 2.5 2.5 3 1-2 2-3.5 1.5-5.5 3.5 2 5 5.5 5 9 0 5.523-4.477 10-10 10z" />
    </svg>
  );
}

/* ----------------------------------------------------------------------------
   Helper Functions
   ---------------------------------------------------------------------------- */

function getEncouragementMessage(completed: number, target: number, streak: number): string {
  if (streak === 0 && completed === 0) {
    return 'Start your wellness journey today!';
  }
  if (completed >= target) {
    return 'Amazing! Weekly goal achieved!';
  }
  const remaining = target - completed;
  if (remaining === 1) {
    return 'Just 1 more day to reach your goal!';
  }
  if (streak >= 7) {
    return "You're on fire! Keep it going!";
  }
  return `${remaining.toString()} more days to reach your goal`;
}

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function ProgressWidget({
  streakDays = 0,
  weeklyGoalCompleted = 0,
  weeklyGoalTarget = 5,
  currentDayOfWeek = new Date().getDay(),
}: ProgressWidgetProps) {
  // Week days starting from Monday
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Convert Sunday=0 to Monday=0 based week
  const adjustedCurrentDay = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

  return (
    <div className={styles.container}>
      <span className={styles.sectionHeader}>Your Progress</span>

      {/* Streak Section */}
      <div className={styles.streakSection}>
        <div className={styles.streakIcon}>
          <FlameIcon />
        </div>
        <div className={styles.streakInfo}>
          <div className={styles.streakCount}>{streakDays}</div>
          <div className={styles.streakLabel}>day{streakDays !== 1 ? 's' : ''} streak</div>
        </div>
      </div>

      {/* Weekly Goal Section */}
      <div className={styles.goalSection}>
        <div className={styles.goalHeader}>
          <span className={styles.goalLabel}>Weekly Goal</span>
          <span className={styles.goalProgress}>
            {weeklyGoalCompleted} / {weeklyGoalTarget}
          </span>
        </div>

        {/* Day Dots */}
        <div className={styles.dayDots}>
          {weekDays.map((day, index) => {
            const isCompleted = index < weeklyGoalCompleted;
            const isToday = index === adjustedCurrentDay;

            return (
              <div
                key={index}
                className={`${styles.dayDot} ${isCompleted ? styles.completed : ''} ${isToday ? styles.today : ''}`}
                title={`${day} - ${isCompleted ? 'Completed' : isToday ? 'Today' : 'Upcoming'}`}
              >
                {day}
              </div>
            );
          })}
        </div>

        {/* Encouragement */}
        <p className={styles.encouragement}>
          {getEncouragementMessage(weeklyGoalCompleted, weeklyGoalTarget, streakDays)}
        </p>
      </div>
    </div>
  );
}
