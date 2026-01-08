import { useState, useEffect, useCallback, useRef } from 'react';

import type {
  AnimationState,
  UseActivityTransitionOptions,
  UseActivityTransitionReturn,
} from './types';

/**
 * Hook to manage animation state for enter/exit transitions
 *
 * Handles the lifecycle of overlay animations:
 * - exited → entering → entered (when opening)
 * - entered → exiting → exited (when closing)
 *
 * The shouldRender flag controls DOM mounting - the overlay stays mounted
 * during exit animation to allow smooth fade-out.
 */
export function useActivityTransition(
  options: UseActivityTransitionOptions
): UseActivityTransitionReturn {
  const { isOpen, onExitComplete } = options;

  // Track previous isOpen value to detect changes
  const prevIsOpenRef = useRef(isOpen);
  const isFirstRenderRef = useRef(true);

  const [animationState, setAnimationState] = useState<AnimationState>(
    isOpen ? 'entered' : 'exited'
  );

  // Track whether we should render the overlay DOM
  const shouldRender = animationState !== 'exited';

  // Handle isOpen changes (only after initial render)
  useEffect(() => {
    // Skip the first render - initial state is already set correctly
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    const prevIsOpen = prevIsOpenRef.current;
    prevIsOpenRef.current = isOpen;

    // Only respond to actual changes
    if (isOpen === prevIsOpen) {
      return;
    }

    if (isOpen) {
      // Start entering
      setAnimationState('entering');
    } else {
      // Start exiting
      setAnimationState('exiting');
    }
  }, [isOpen]);

  // Handle animation completion
  const handleAnimationComplete = useCallback(() => {
    if (animationState === 'entering') {
      setAnimationState('entered');
    } else if (animationState === 'exiting') {
      setAnimationState('exited');
      onExitComplete?.();
    }
  }, [animationState, onExitComplete]);

  // Framer Motion animation props
  // Duration values match CSS variables:
  // --transition-activity-enter: 500ms
  // --transition-activity-exit: 400ms
  const overlayProps = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98, y: 20 },
    transition: {
      duration: animationState === 'exiting' ? 0.4 : 0.5,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number], // Matches cubic-bezier(0.4, 0, 0.2, 1)
    },
    onAnimationComplete: handleAnimationComplete,
  };

  return {
    shouldRender,
    animationState,
    overlayProps,
  };
}
