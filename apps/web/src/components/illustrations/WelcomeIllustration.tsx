/**
 * Welcome Illustration Component
 *
 * A composed illustration for the chat empty state.
 * Combines multiple organic blobs in a layered composition
 * that represents the fluidity of emotional wellbeing.
 *
 * Features:
 * - Central main blob with gradient
 * - Smaller accent blobs for depth
 * - Gentle breathing-like animation
 */

import { OrganicBlob } from './OrganicBlob';
import styles from './WelcomeIllustration.module.css';

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function WelcomeIllustration() {
  return (
    <div className={styles.container} aria-hidden="true">
      {/* Background accent blob - largest, most transparent */}
      <div className={styles.backgroundBlob}>
        <OrganicBlob
          size={180}
          colorStart="#e8f4f3"
          colorEnd="#f0edf5"
          opacity={0.8}
          animated={true}
          animationDuration={12}
        />
      </div>

      {/* Main central blob - teal/purple gradient */}
      <div className={styles.mainBlob}>
        <OrganicBlob
          size={140}
          colorStart="#7ec8e3"
          colorEnd="#9b8fd4"
          opacity={0.6}
          animated={true}
          animationDuration={8}
        />
      </div>

      {/* Accent blob - green, smaller */}
      <div className={styles.accentBlobLeft}>
        <OrganicBlob
          size={50}
          colorStart="#7ed4a6"
          colorEnd="#6b9e7d"
          opacity={0.5}
          animated={true}
          animationDuration={10}
        />
      </div>

      {/* Accent blob - warm coral, smallest */}
      <div className={styles.accentBlobRight}>
        <OrganicBlob
          size={40}
          colorStart="#f8b4a9"
          colorEnd="#e6a87c"
          opacity={0.45}
          animated={true}
          animationDuration={11}
        />
      </div>

      {/* Floating sparkle dots */}
      <div className={styles.sparkle} style={{ top: '15%', left: '20%' }} />
      <div className={styles.sparkle} style={{ top: '70%', right: '25%', animationDelay: '-1s' }} />
      <div
        className={styles.sparkle}
        style={{ bottom: '25%', left: '30%', animationDelay: '-2s' }}
      />
    </div>
  );
}
