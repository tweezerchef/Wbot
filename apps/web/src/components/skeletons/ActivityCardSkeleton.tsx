/**
 * ActivityCardSkeleton - Loading skeleton for activity cards
 *
 * Displays an animated placeholder for activity cards (breathing, meditation, etc).
 * Uses inline styles to avoid CSS module FOUC.
 *
 * Key features:
 * - Matches activity card layout with gradient, icon, title, description
 * - Shimmer animation for modern loading effect
 * - Customizable size variants
 */

interface ActivityCardSkeletonProps {
  /** Size variant */
  variant?: 'default' | 'compact';
}

/**
 * Skeleton loading state for ActivityCard.
 */
export function ActivityCardSkeleton({ variant = 'default' }: ActivityCardSkeletonProps) {
  const isCompact = variant === 'compact';

  return (
    <>
      <style>{`
        @keyframes activity-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div
        style={{
          padding: isCompact ? '16px' : '24px',
          borderRadius: '16px',
          background:
            'linear-gradient(135deg, rgba(126,200,227,0.15) 0%, rgba(155,143,212,0.15) 100%)',
          border: '1px solid #e5e5e5',
        }}
      >
        {/* Icon placeholder */}
        <div
          style={{
            width: isCompact ? '32px' : '48px',
            height: isCompact ? '32px' : '48px',
            borderRadius: '12px',
            marginBottom: isCompact ? '12px' : '16px',
            background:
              'linear-gradient(90deg, rgba(126,200,227,0.3) 25%, rgba(155,143,212,0.4) 50%, rgba(126,200,227,0.3) 75%)',
            backgroundSize: '200% 100%',
            animation: 'activity-shimmer 1.5s ease-in-out infinite',
          }}
        />

        {/* Title placeholder */}
        <div
          style={{
            height: isCompact ? '16px' : '20px',
            width: '60%',
            marginBottom: '8px',
            background: 'linear-gradient(90deg, #e5e5e5 25%, #d4d4d4 50%, #e5e5e5 75%)',
            backgroundSize: '200% 100%',
            borderRadius: '4px',
            animation: 'activity-shimmer 1.5s ease-in-out infinite',
            animationDelay: '0.1s',
          }}
        />

        {/* Description placeholder */}
        <div
          style={{
            height: isCompact ? '12px' : '14px',
            width: '90%',
            marginBottom: '4px',
            background: 'linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%)',
            backgroundSize: '200% 100%',
            borderRadius: '4px',
            animation: 'activity-shimmer 1.5s ease-in-out infinite',
            animationDelay: '0.2s',
          }}
        />
        <div
          style={{
            height: isCompact ? '12px' : '14px',
            width: '70%',
            marginBottom: isCompact ? '12px' : '16px',
            background: 'linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%)',
            backgroundSize: '200% 100%',
            borderRadius: '4px',
            animation: 'activity-shimmer 1.5s ease-in-out infinite',
            animationDelay: '0.3s',
          }}
        />

        {/* Metadata row */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: isCompact ? '12px' : '16px',
          }}
        >
          <div
            style={{
              height: '12px',
              width: '60px',
              background: 'linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%)',
              backgroundSize: '200% 100%',
              borderRadius: '4px',
              animation: 'activity-shimmer 1.5s ease-in-out infinite',
              animationDelay: '0.4s',
            }}
          />
          <div
            style={{
              height: '12px',
              width: '50px',
              background: 'linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%)',
              backgroundSize: '200% 100%',
              borderRadius: '4px',
              animation: 'activity-shimmer 1.5s ease-in-out infinite',
              animationDelay: '0.5s',
            }}
          />
        </div>

        {/* Button placeholder */}
        <div
          style={{
            height: isCompact ? '36px' : '44px',
            width: isCompact ? '80px' : '100px',
            background: 'linear-gradient(90deg, #2d7a78 25%, #246563 50%, #2d7a78 75%)',
            backgroundSize: '200% 100%',
            borderRadius: '8px',
            opacity: 0.6,
            animation: 'activity-shimmer 1.5s ease-in-out infinite',
            animationDelay: '0.6s',
          }}
        />
      </div>
    </>
  );
}
