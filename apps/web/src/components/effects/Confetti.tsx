/**
 * Confetti Effect Component
 *
 * CSS-only confetti burst animation for celebrations.
 * Triggers on mount and auto-cleans up.
 */

import { useEffect, useState } from 'react';

/* ----------------------------------------------------------------------------
   Types
   ---------------------------------------------------------------------------- */

interface ConfettiProps {
  /** Whether to show the confetti */
  active?: boolean;
  /** Duration in ms before auto-hiding */
  duration?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  delay: number;
  color: string;
  rotation: number;
}

/* ----------------------------------------------------------------------------
   Colors
   ---------------------------------------------------------------------------- */

const colors = [
  '#7ec8e3', // sky
  '#9b8fd4', // lavender
  '#7ed4a6', // sage
  '#f8b4a9', // dawn
  '#e6a87c', // sunset
  '#2d7a78', // primary
];

/* ----------------------------------------------------------------------------
   Component
   ---------------------------------------------------------------------------- */

export function Confetti({ active = true, duration = 2000, onComplete }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (active) {
      // Generate particles
      const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
      }));
      setParticles(newParticles);
      setVisible(true);

      // Auto-hide after duration
      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [active, duration, onComplete]);

  if (!visible || particles.length === 0) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9999;
          overflow: hidden;
        }
        .confetti-particle {
          position: absolute;
          width: 10px;
          height: 10px;
          animation: confetti-fall 2s ease-out forwards;
        }
      `}</style>
      <div className="confetti-container" aria-hidden="true">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="confetti-particle"
            style={{
              left: `${particle.x.toString()}%`,
              backgroundColor: particle.color,
              animationDelay: `${particle.delay.toString()}s`,
              transform: `rotate(${particle.rotation.toString()}deg)`,
              borderRadius: particle.id % 2 === 0 ? '50%' : '0',
            }}
          />
        ))}
      </div>
    </>
  );
}
