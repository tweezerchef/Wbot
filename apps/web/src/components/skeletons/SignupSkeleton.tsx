/**
 * SignupSkeleton - Loading skeleton for the SignupPage
 *
 * Displays an animated placeholder that mirrors the signup form layout.
 * Uses inline styles to avoid CSS module FOUC (Flash of Unstyled Content).
 *
 * Key features:
 * - Matches SignupPage card layout with gradient background
 * - Shows placeholder elements for title, subtitle, form fields, and button
 * - Animated pulse effect indicates loading state
 * - All styles inline to ensure immediate rendering
 */

/**
 * Skeleton loading state for SignupPage.
 * Mirrors the auth form layout with animated placeholders.
 */
export function SignupSkeleton() {
  return (
    <>
      {/* Inline keyframes - can't use CSS modules here */}
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Container - matches SignupPage.module.css .container */}
      <div
        style={{
          minHeight: '100dvh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Gradient from --color-primary-light to --color-secondary-light
          background: 'linear-gradient(135deg, #e8f4f3 0%, #f0edf5 100%)',
          padding: '16px',
        }}
      >
        {/* Card - matches .card */}
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#ffffff', // --color-surface
            borderRadius: '16px', // --radius-xl
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', // --shadow-lg
            padding: '32px', // --spacing-xl
          }}
        >
          {/* Title skeleton - "Welcome to Wbot" */}
          <div
            style={{
              height: '36px',
              width: '180px',
              backgroundColor: '#e5e5e5', // --color-neutral-200
              borderRadius: '8px',
              margin: '0 auto 8px',
              animation: 'skeleton-pulse 2s ease-in-out infinite',
            }}
          />

          {/* Subtitle skeleton */}
          <div
            style={{
              height: '20px',
              width: '320px',
              maxWidth: '100%',
              backgroundColor: '#e5e5e5',
              borderRadius: '6px',
              margin: '0 auto 32px',
              animation: 'skeleton-pulse 2s ease-in-out infinite',
              animationDelay: '0.1s',
            }}
          />

          {/* Form fields skeleton - Email and Password */}
          {[0, 1].map((i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              {/* Label */}
              <div
                style={{
                  height: '14px',
                  width: '60px',
                  backgroundColor: '#e5e5e5',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  animation: 'skeleton-pulse 2s ease-in-out infinite',
                  animationDelay: `${(0.2 + i * 0.1).toFixed(1)}s`,
                }}
              />
              {/* Input field */}
              <div
                style={{
                  height: '52px',
                  width: '100%',
                  backgroundColor: '#fafafa', // --color-background-secondary
                  borderRadius: '8px',
                  border: '1px solid #e5e5e5',
                  animation: 'skeleton-pulse 2s ease-in-out infinite',
                  animationDelay: `${(0.3 + i * 0.1).toFixed(1)}s`,
                }}
              />
            </div>
          ))}

          {/* Submit button skeleton */}
          <div
            style={{
              height: '52px',
              width: '100%',
              backgroundColor: '#4a9d9a', // --color-primary
              borderRadius: '8px',
              marginTop: '8px',
              opacity: 0.6,
              animation: 'skeleton-pulse 2s ease-in-out infinite',
              animationDelay: '0.5s',
            }}
          />

          {/* Toggle link skeleton */}
          <div
            style={{
              height: '16px',
              width: '180px',
              backgroundColor: '#e5e5e5',
              borderRadius: '4px',
              margin: '16px auto',
              animation: 'skeleton-pulse 2s ease-in-out infinite',
              animationDelay: '0.6s',
            }}
          />

          {/* Divider skeleton */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e5e5' }} />
            <div
              style={{
                height: '14px',
                width: '20px',
                backgroundColor: '#e5e5e5',
                borderRadius: '4px',
              }}
            />
            <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e5e5' }} />
          </div>

          {/* Google button skeleton */}
          <div
            style={{
              height: '52px',
              width: '100%',
              backgroundColor: '#fafafa',
              borderRadius: '8px',
              border: '1px solid #e5e5e5',
              animation: 'skeleton-pulse 2s ease-in-out infinite',
              animationDelay: '0.7s',
            }}
          />
        </div>
      </div>
    </>
  );
}
