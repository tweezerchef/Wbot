/* ============================================================================
   MeditationStreakBadge Component
   ============================================================================ */

import { useEffect, useState } from 'react';

import styles from './MeditationStreakBadge.module.css';

export interface MeditationStreakBadgeProps {
  streak: number;
  showCelebration?: boolean;
  variant?: 'compact' | 'expanded';
  onCelebrationComplete?: () => void;
}

export function MeditationStreakBadge({
  streak,
  showCelebration = false,
  variant = 'expanded',
  onCelebrationComplete,
}: MeditationStreakBadgeProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  useEffect(() => {
    if (showCelebration && streak > 0) {
      setIsAnimating(true);
      setShowSavedMessage(true);
      const t1 = setTimeout(() => {
        setIsAnimating(false);
      }, 1000);
      const t2 = setTimeout(() => {
        setShowSavedMessage(false);
        onCelebrationComplete?.();
      }, 2500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [showCelebration, streak, onCelebrationComplete]);

  if (streak <= 0) {
    return null;
  }

  const getStreakEmoji = () => {
    if (streak >= 30) {
      return '🏆';
    }
    if (streak >= 14) {
      return '⭐';
    }
    if (streak >= 7) {
      return '🌟';
    }
    return '🔥';
  };

  const getStreakMessage = () => {
    if (streak >= 30) {
      return 'Incredible dedication!';
    }
    if (streak >= 14) {
      return 'Amazing consistency!';
    }
    if (streak >= 7) {
      return 'One week strong!';
    }
    if (streak >= 3) {
      return 'Building momentum!';
    }
    return 'Great start!';
  };

  const containerClass = [styles.container, styles[variant], isAnimating ? styles.celebrating : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass}>
      <div className={styles.badge}>
        <span className={styles.emoji}>{getStreakEmoji()}</span>
        <span className={styles.count}>{streak}</span>
        {variant === 'expanded' && (
          <span className={styles.label}>day{streak !== 1 ? 's' : ''}</span>
        )}
      </div>
      {variant === 'expanded' && <p className={styles.message}>{getStreakMessage()}</p>}
      {showSavedMessage && (
        <div className={styles.savedMessage}>
          <span className={styles.checkmark}>✓</span>
          Streak saved!
        </div>
      )}
    </div>
  );
}
