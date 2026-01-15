/**
 * ActivityLoadingSkeleton - Loading state for lazy-loaded activity components
 *
 * Used as a Suspense fallback when activity components (breathing, meditation,
 * journaling) are being loaded dynamically. Shows a centered spinner that
 * indicates content is loading without taking up full viewport.
 *
 * Uses inline styles to avoid CSS module FOUC and ensure immediate rendering.
 */

/**
 * Compact loading skeleton for activity components.
 * Shows a centered spinner within the activity container.
 */
export function ActivityLoadingSkeleton() {
  return (
    <>
      {/* Inline keyframes */}
      <style>{`
        @keyframes activity-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Container - centered within activity area */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          padding: '24px',
          width: '100%',
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
            animation: 'activity-spin 1s linear infinite',
          }}
        />
      </div>
    </>
  );
}
