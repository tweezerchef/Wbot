/**
 * Types for ActivityOverlay component
 *
 * The ActivityOverlay provides a full-screen immersive experience for
 * wellness activities (breathing, meditation, etc.), replacing the
 * previous inline card-based rendering.
 */

/** Types of activities that can be displayed in the overlay */
export type ActivityType =
  | 'breathing'
  | 'meditation'
  | 'library'
  | 'series'
  | 'wellness'
  | 'gamification';

/** Animation state for enter/exit transitions */
export type AnimationState = 'entering' | 'entered' | 'exiting' | 'exited';

/** Props for the ActivityOverlay component */
export interface ActivityOverlayProps {
  /** Whether the overlay is visible */
  isOpen: boolean;
  /** Called when user requests to close (X button, Escape key, or backdrop click) */
  onClose: () => void;
  /** The type of activity being displayed (affects styling) */
  activityType: ActivityType;
  /** The activity content to render */
  children: React.ReactNode;
  /** Optional callback when exit animation completes */
  onExitComplete?: () => void;
}

/** Options for the useActivityTransition hook */
export interface UseActivityTransitionOptions {
  /** Whether the overlay should be open */
  isOpen: boolean;
  /** Callback when exit animation completes */
  onExitComplete?: () => void;
}

/** Return type for the useActivityTransition hook */
export interface UseActivityTransitionReturn {
  /** Whether to mount the overlay DOM (true during entering/entered/exiting) */
  shouldRender: boolean;
  /** Current animation state */
  animationState: AnimationState;
  /** Props to spread on the motion.div overlay element */
  overlayProps: {
    initial: { opacity: number; scale: number };
    animate: { opacity: number; scale: number };
    exit: { opacity: number; scale: number; y: number };
    transition: { duration: number; ease: [number, number, number, number] };
    onAnimationComplete: () => void;
  };
}
