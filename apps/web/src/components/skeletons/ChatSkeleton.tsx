/**
 * ChatSkeleton - Loading skeleton for the ChatPage
 *
 * Displays an animated placeholder that mirrors the chat interface layout.
 * Uses inline styles to avoid CSS module FOUC (Flash of Unstyled Content).
 *
 * Key features:
 * - Matches ChatPage layout with header, messages area, and input
 * - Shows placeholder for new empty state (illustration + quick actions)
 * - Shimmer animation for modern loading effect
 * - All styles inline to ensure immediate rendering
 */

/**
 * Skeleton loading state for ChatPage.
 * Shows header, message area placeholder, and input area.
 */
export function ChatSkeleton() {
  return (
    <>
      {/* Inline keyframes - can't use CSS modules here */}
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes skeleton-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      {/* Container - matches ChatPage.module.css .container */}
      <div
        style={{
          height: '100dvh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #e8f4f3 0%, #f0edf5 100%)', // --gradient-calm
        }}
      >
        {/* Header - matches .header */}
        <header
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e5e5e5',
            flexShrink: 0,
          }}
        >
          {/* Menu button placeholder */}
          <div
            style={{
              position: 'absolute',
              left: '16px',
              width: '44px',
              height: '44px',
              background: 'linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%)',
              backgroundSize: '200% 100%',
              borderRadius: '8px',
              animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
            }}
          />

          {/* Logo placeholder */}
          <div
            style={{
              height: '24px',
              width: '60px',
              background: 'linear-gradient(90deg, #e5e5e5 25%, #d4d4d4 50%, #e5e5e5 75%)',
              backgroundSize: '200% 100%',
              borderRadius: '6px',
              animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
              animationDelay: '0.1s',
            }}
          />
        </header>

        {/* Messages area with empty state skeleton */}
        <div
          style={{
            flex: 1,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            overflow: 'hidden',
          }}
        >
          {/* Illustration placeholder - circular blob area */}
          <div
            style={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background:
                'linear-gradient(90deg, rgba(126,200,227,0.2) 25%, rgba(155,143,212,0.3) 50%, rgba(126,200,227,0.2) 75%)',
              backgroundSize: '200% 100%',
              animation: 'skeleton-shimmer 2s ease-in-out infinite',
            }}
          />

          {/* Welcome text skeleton */}
          <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
            {/* Headline */}
            <div
              style={{
                height: '28px',
                width: '200px',
                margin: '0 auto 12px',
                background: 'linear-gradient(90deg, #e5e5e5 25%, #d4d4d4 50%, #e5e5e5 75%)',
                backgroundSize: '200% 100%',
                borderRadius: '6px',
                animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
                animationDelay: '0.2s',
              }}
            />
            {/* Subtext lines */}
            <div
              style={{
                height: '16px',
                width: '100%',
                background: 'linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%)',
                backgroundSize: '200% 100%',
                borderRadius: '4px',
                marginBottom: '8px',
                animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
                animationDelay: '0.3s',
              }}
            />
            <div
              style={{
                height: '16px',
                width: '80%',
                margin: '0 auto',
                background: 'linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%)',
                backgroundSize: '200% 100%',
                borderRadius: '4px',
                animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
                animationDelay: '0.4s',
              }}
            />
          </div>

          {/* Quick action cards skeleton */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              maxWidth: '500px',
              width: '100%',
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  padding: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '12px',
                  border: '1px solid #e5e5e5',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {/* Icon placeholder */}
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'linear-gradient(90deg, #e5e5e5 25%, #d4d4d4 50%, #e5e5e5 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
                    animationDelay: `${(0.5 + i * 0.1).toString()}s`,
                  }}
                />
                {/* Title */}
                <div
                  style={{
                    height: '14px',
                    width: '60px',
                    background: 'linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%)',
                    backgroundSize: '200% 100%',
                    borderRadius: '4px',
                    animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
                    animationDelay: `${(0.6 + i * 0.1).toString()}s`,
                  }}
                />
                {/* Description */}
                <div
                  style={{
                    height: '10px',
                    width: '80px',
                    background: 'linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%)',
                    backgroundSize: '200% 100%',
                    borderRadius: '4px',
                    animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
                    animationDelay: `${(0.7 + i * 0.1).toString()}s`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Input area */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '16px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e5e5e5',
            flexShrink: 0,
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          }}
        >
          {/* Input field skeleton */}
          <div
            style={{
              flex: 1,
              height: '44px',
              background: 'linear-gradient(90deg, #fafafa 25%, #f0f0f0 50%, #fafafa 75%)',
              backgroundSize: '200% 100%',
              border: '1px solid #e5e5e5',
              borderRadius: '9999px',
              animation: 'skeleton-shimmer 1.5s ease-in-out infinite',
              animationDelay: '0.8s',
            }}
          />

          {/* Send button skeleton */}
          <div
            style={{
              width: '44px',
              height: '44px',
              minWidth: '44px',
              backgroundColor: '#2d7a78', // Updated to accessible primary
              borderRadius: '50%',
              opacity: 0.6,
              animation: 'skeleton-pulse 2s ease-in-out infinite',
              animationDelay: '0.9s',
            }}
          />
        </div>
      </div>
    </>
  );
}
