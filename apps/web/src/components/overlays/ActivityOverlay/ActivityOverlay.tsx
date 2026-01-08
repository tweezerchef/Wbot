import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useCallback, type KeyboardEvent } from 'react';

import styles from './ActivityOverlay.module.css';
import type { ActivityOverlayProps } from './types';
import { useActivityTransition } from './useActivityTransition';

/**
 * ActivityOverlay - Full-screen immersive overlay for wellness activities
 *
 * Provides a distraction-free environment for breathing exercises,
 * meditation sessions, and other wellness activities. Replaces the
 * previous inline card-based rendering in chat messages.
 *
 * Features:
 * - Smooth enter/exit animations via Framer Motion
 * - Responsive: full-screen on mobile, centered card on tablet/desktop
 * - Keyboard accessible (Escape to close)
 * - Close button always visible and accessible
 * - Backdrop click to close
 *
 * @example
 * ```tsx
 * <ActivityOverlay
 *   isOpen={activityState !== null}
 *   onClose={handleClose}
 *   activityType="breathing"
 * >
 *   <ImmersiveBreathing technique={technique} onComplete={handleComplete} />
 * </ActivityOverlay>
 * ```
 */
export function ActivityOverlay({
  isOpen,
  onClose,
  activityType,
  children,
  onExitComplete,
}: ActivityOverlayProps) {
  const { shouldRender, overlayProps } = useActivityTransition({
    isOpen,
    onExitComplete,
  });

  // Handle Escape key to close
  const handleKeyDown = useCallback(
    (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault();
        onClose();
      }
    },
    [isOpen, onClose]
  );

  // Add global keyboard listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when overlay is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Prevent clicks inside content from closing
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Handle close button click
  const handleCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle close button keyboard interaction
  const handleCloseKeyDown = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  if (!shouldRender) {
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label={`${activityType} activity`}
          data-activity-type={activityType}
          {...overlayProps}
        >
          {/* Backdrop */}
          <motion.div
            className={styles.backdrop}
            onClick={handleBackdropClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            aria-hidden="true"
          />

          {/* Content */}
          <div
            className={styles.content}
            onClick={handleContentClick}
            onKeyDown={(e) => {
              e.stopPropagation();
            }}
            role="document"
          >
            {/* Close button */}
            <button
              type="button"
              className={styles.closeButton}
              onClick={handleCloseClick}
              onKeyDown={handleCloseKeyDown}
              aria-label="Close activity"
            >
              <span className={styles.closeIcon} aria-hidden="true" />
            </button>

            {/* Activity content */}
            <div className={styles.activityWrapper}>{children}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
