/**
 * ChatSkeleton - Loading skeleton for the ChatPage
 *
 * Displays an animated placeholder that mirrors the chat interface layout.
 * Uses inline styles to avoid CSS module FOUC (Flash of Unstyled Content).
 *
 * Key features:
 * - Matches ChatPage layout with header, messages area, and input
 * - Shows placeholder for welcome message bubble
 * - Animated pulse effect indicates loading state
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
      `}</style>

      {/* Container - matches ChatPage.module.css .container */}
      <div
        style={{
          height: '100dvh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fafafa', // --color-background-secondary
        }}
      >
        {/* Header - matches .header */}
        <header
          style={{
            height: '64px', // --header-height
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            backgroundColor: '#ffffff', // --color-surface
            borderBottom: '1px solid #e5e5e5', // --border-color
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
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              animation: 'skeleton-pulse 2s ease-in-out infinite',
            }}
          />

          {/* Logo placeholder - "Wbot" */}
          <div
            style={{
              height: '24px',
              width: '60px',
              backgroundColor: '#e5e5e5',
              borderRadius: '6px',
              animation: 'skeleton-pulse 2s ease-in-out infinite',
              animationDelay: '0.1s',
            }}
          />
        </header>

        {/* Messages area - matches .messages */}
        <div
          style={{
            flex: 1,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflow: 'hidden',
          }}
        >
          {/* Welcome message skeleton - matches .welcome */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px',
            }}
          >
            <div
              style={{
                maxWidth: '400px',
                width: '100%',
                textAlign: 'center',
              }}
            >
              {/* Welcome text lines */}
              <div
                style={{
                  height: '16px',
                  width: '100%',
                  backgroundColor: '#e5e5e5',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  animation: 'skeleton-pulse 2s ease-in-out infinite',
                  animationDelay: '0.2s',
                }}
              />
              <div
                style={{
                  height: '16px',
                  width: '85%',
                  backgroundColor: '#e5e5e5',
                  borderRadius: '4px',
                  marginBottom: '8px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  animation: 'skeleton-pulse 2s ease-in-out infinite',
                  animationDelay: '0.3s',
                }}
              />
              <div
                style={{
                  height: '16px',
                  width: '70%',
                  backgroundColor: '#e5e5e5',
                  borderRadius: '4px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                  animation: 'skeleton-pulse 2s ease-in-out infinite',
                  animationDelay: '0.4s',
                }}
              />
            </div>
          </div>
        </div>

        {/* Input area - matches .inputArea */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '16px',
            backgroundColor: '#ffffff', // --color-surface
            borderTop: '1px solid #e5e5e5', // --border-color
            flexShrink: 0,
            // Safe area padding for mobile
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          }}
        >
          {/* Input field skeleton */}
          <div
            style={{
              flex: 1,
              height: '44px',
              backgroundColor: '#fafafa', // --color-background
              border: '1px solid #e5e5e5',
              borderRadius: '9999px', // --radius-full (pill shape)
              animation: 'skeleton-pulse 2s ease-in-out infinite',
              animationDelay: '0.5s',
            }}
          />

          {/* Send button skeleton */}
          <div
            style={{
              width: '44px',
              height: '44px',
              minWidth: '44px',
              backgroundColor: '#4a9d9a', // --color-primary
              borderRadius: '50%',
              opacity: 0.6,
              animation: 'skeleton-pulse 2s ease-in-out infinite',
              animationDelay: '0.6s',
            }}
          />
        </div>
      </div>
    </>
  );
}
