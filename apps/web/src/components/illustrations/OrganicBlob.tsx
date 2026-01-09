/**
 * Organic Blob Component
 *
 * A reusable animated SVG blob shape that represents the fluidity
 * of emotional wellbeing. Uses soft, flowing curves inspired by nature.
 *
 * Features:
 * - Customizable size and colors
 * - Optional gentle breathing animation
 * - Gradient fill support
 */

import type { CSSProperties } from 'react';

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

interface OrganicBlobProps {
  /** Width and height of the blob (square) */
  size?: number;
  /** Primary color for gradient start */
  colorStart?: string;
  /** Secondary color for gradient end */
  colorEnd?: string;
  /** Opacity of the blob (0-1) */
  opacity?: number;
  /** Whether to animate the blob */
  animated?: boolean;
  /** Animation duration in seconds */
  animationDuration?: number;
  /** Custom className */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
}

/* ----------------------------------------------------------------------------
   Blob Path Data
   ---------------------------------------------------------------------------- */

// Different organic blob shapes for variety
const blobPaths = {
  default:
    'M44.7,-51.2C59.3,-42.8,73.2,-29.2,76.4,-13.4C79.6,2.4,72.2,20.3,61.4,34.2C50.7,48.1,36.6,58,20.5,63.4C4.3,68.8,-13.8,69.7,-29.5,63.4C-45.2,57,-58.4,43.4,-65.8,27C-73.2,10.6,-74.7,-8.6,-68.3,-24.5C-61.9,-40.3,-47.5,-52.8,-32.4,-61C-17.3,-69.2,-1.5,-73,12.1,-69.9C25.7,-66.7,30.1,-59.6,44.7,-51.2Z',
  rounded:
    'M40.8,-47.5C54.5,-38.4,68.4,-26.8,72.3,-12.4C76.2,2,70.1,19.2,60.3,33.2C50.4,47.1,36.8,57.8,21.1,63.2C5.4,68.5,-12.4,68.5,-27.8,62.3C-43.2,56.1,-56.2,43.6,-63.8,28.2C-71.4,12.8,-73.6,-5.5,-68.6,-21.5C-63.6,-37.5,-51.4,-51.2,-37.5,-60.3C-23.6,-69.4,-8,-73.9,4.1,-69.1C16.2,-64.3,27.1,-56.6,40.8,-47.5Z',
  flowing:
    'M39.5,-48.8C52.9,-40.9,66.5,-30.8,71.2,-17.5C75.9,-4.2,71.7,12.3,63.5,26C55.3,39.7,43.1,50.6,29,57.1C14.9,63.6,-1.1,65.7,-16.3,62.1C-31.5,58.5,-45.9,49.2,-55.3,36.1C-64.7,23,-69.1,6.1,-66.3,-9.6C-63.5,-25.3,-53.5,-39.8,-40.9,-47.9C-28.3,-56,-13.1,-57.7,0.3,-58.1C13.7,-58.5,26.1,-56.7,39.5,-48.8Z',
};

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function OrganicBlob({
  size = 200,
  colorStart = '#7ec8e3',
  colorEnd = '#9b8fd4',
  opacity = 0.6,
  animated = true,
  animationDuration = 8,
  className,
  style,
}: OrganicBlobProps) {
  // Generate unique ID for gradient
  const gradientId = `blob-gradient-${Math.random().toString(36).slice(2, 11)}`;

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: colorStart, stopOpacity: opacity }} />
          <stop offset="100%" style={{ stopColor: colorEnd, stopOpacity: opacity }} />
        </linearGradient>
      </defs>
      <g transform="translate(100 100)">
        <path fill={`url(#${gradientId})`} d={blobPaths.default}>
          {animated && (
            <animate
              attributeName="d"
              dur={`${animationDuration.toString()}s`}
              repeatCount="indefinite"
              values={`${blobPaths.default};${blobPaths.rounded};${blobPaths.flowing};${blobPaths.default}`}
              calcMode="spline"
              keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
            />
          )}
        </path>
      </g>
    </svg>
  );
}
