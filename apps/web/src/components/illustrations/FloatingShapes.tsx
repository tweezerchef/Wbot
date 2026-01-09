/**
 * Floating Shapes Component
 *
 * Decorative floating organic shapes that create depth and visual interest.
 * Multiple translucent layers with gentle floating animation.
 *
 * Features:
 * - Multiple layered shapes at different depths
 * - Gentle floating/drifting motion
 * - Customizable color scheme
 */

import type { CSSProperties } from 'react';

import styles from './FloatingShapes.module.css';
import { OrganicBlob } from './OrganicBlob';

/* ----------------------------------------------------------------------------
   Props Interface
   ---------------------------------------------------------------------------- */

interface FloatingShapesProps {
  /** Container width */
  width?: number | string;
  /** Container height */
  height?: number | string;
  /** Custom className */
  className?: string;
  /** Custom inline styles */
  style?: CSSProperties;
}

/* ----------------------------------------------------------------------------
   Shape Configuration
   ---------------------------------------------------------------------------- */

const shapes = [
  {
    id: 1,
    size: 120,
    colorStart: '#7ec8e3',
    colorEnd: '#9b8fd4',
    opacity: 0.4,
    position: { top: '10%', left: '20%' },
    animationDelay: '0s',
  },
  {
    id: 2,
    size: 80,
    colorStart: '#7ed4a6',
    colorEnd: '#6b9e7d',
    opacity: 0.35,
    position: { top: '60%', right: '15%' },
    animationDelay: '-2s',
  },
  {
    id: 3,
    size: 60,
    colorStart: '#f8b4a9',
    colorEnd: '#e6a87c',
    opacity: 0.3,
    position: { bottom: '20%', left: '10%' },
    animationDelay: '-4s',
  },
  {
    id: 4,
    size: 100,
    colorStart: '#9b8fd4',
    colorEnd: '#6b5b95',
    opacity: 0.25,
    position: { top: '30%', right: '25%' },
    animationDelay: '-6s',
  },
];

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function FloatingShapes({
  width = '100%',
  height = '100%',
  className,
  style,
}: FloatingShapesProps) {
  return (
    <div
      className={`${styles.container} ${className ?? ''}`}
      style={{ width, height, ...style }}
      aria-hidden="true"
    >
      {shapes.map((shape) => (
        <div
          key={shape.id}
          className={styles.shape}
          style={{
            ...shape.position,
            animationDelay: shape.animationDelay,
          }}
        >
          <OrganicBlob
            size={shape.size}
            colorStart={shape.colorStart}
            colorEnd={shape.colorEnd}
            opacity={shape.opacity}
            animated={true}
            animationDuration={10 + shape.id * 2}
          />
        </div>
      ))}
    </div>
  );
}
