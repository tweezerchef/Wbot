/* ============================================================================
   BadgeUnlock Component
   ============================================================================
   Celebration animation when user earns a badge.
   ============================================================================ */

import { useCallback, useEffect, useState } from 'react';

import styles from './BadgeUnlock.module.css';

export interface BadgeUnlockProps {
  badgeName: string;
  badgeEmoji: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function BadgeUnlock({
  badgeName,
  badgeEmoji,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000,
}: BadgeUnlockProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [autoClose, autoCloseDelay, handleClose]);

  return (
    <div
      className={`${styles.overlay} ${isVisible ? styles.visible : ''} ${isClosing ? styles.closing : ''}`}
    >
      <div className={styles.container}>
        <div className={styles.confetti}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={styles.particle}
              style={{ '--delay': `${String(i * 0.1)}s` } as React.CSSProperties}
            />
          ))}
        </div>

        <div className={styles.badge}>{badgeEmoji}</div>

        <h2 className={styles.title}>Badge Earned!</h2>
        <p className={styles.badgeName}>{badgeName}</p>

        <p className={styles.message}>Congratulations on completing this milestone!</p>

        <button className={styles.button} onClick={handleClose}>
          Continue
        </button>
      </div>
    </div>
  );
}
