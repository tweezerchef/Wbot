/**
 * DefaultSkeleton - Generic fallback loading skeleton
 *
 * A simple centered loading skeleton that can be used as a fallback
 * for routes that don't have a specific skeleton component.
 *
 * Uses inline styles to avoid CSS module FOUC.
 */

/**
 * Generic skeleton loading state.
 * Shows a centered animated loader with a subtle pulsing effect.
 */
export function DefaultSkeleton() {
  return (
    <>
      {/* Inline keyframes */}
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes skeleton-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Container - full viewport centered */}
      <div
        style={{
          minHeight: '100dvh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa', // --color-background-secondary
          gap: '16px',
        }}
      >
        {/* Spinner */}
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e5e5e5', // --color-neutral-200
            borderTopColor: '#4a9d9a', // --color-primary
            borderRadius: '50%',
            animation: 'skeleton-spin 1s linear infinite',
          }}
        />

        {/* Loading text placeholder */}
        <div
          style={{
            height: '16px',
            width: '80px',
            backgroundColor: '#e5e5e5',
            borderRadius: '4px',
            animation: 'skeleton-pulse 2s ease-in-out infinite',
          }}
        />
      </div>
    </>
  );
}
