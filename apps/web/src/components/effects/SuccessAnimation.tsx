/**
 * Success Animation Component
 *
 * Subtle success checkmark animation with soft bounce.
 * Used for completing activities, goals, etc.
 */

import { useEffect, useState } from 'react';

/* ----------------------------------------------------------------------------
   Types
   ---------------------------------------------------------------------------- */

interface SuccessAnimationProps {
  /** Whether to show the animation */
  active?: boolean;
  /** Size of the animation */
  size?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function SuccessAnimation({ active = true, size = 64, onComplete }: SuccessAnimationProps) {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (active) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 1500);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [active, onComplete]);

  if (!visible) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes success-scale {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes success-check {
          0% {
            stroke-dashoffset: 50;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes success-circle {
          0% {
            stroke-dashoffset: 166;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        .success-container {
          display: flex;
          align-items: center;
          justify-content: center;
          animation: success-scale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .success-circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: success-circle 0.6s ease-out 0.2s forwards;
        }
        .success-check {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: success-check 0.3s ease-out 0.6s forwards;
        }
      `}</style>
      <div className="success-container" aria-label="Success">
        <svg width={size} height={size} viewBox="0 0 52 52">
          <circle
            className="success-circle"
            cx="26"
            cy="26"
            r="25"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
          />
          <path
            className="success-check"
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 27l7 7 16-16"
          />
        </svg>
      </div>
    </>
  );
}
