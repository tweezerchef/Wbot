/**
 * SidebarSkeleton - Loading skeleton for the sidebar
 *
 * Displays an animated placeholder that mirrors the sidebar layout.
 * Uses inline styles to avoid CSS module FOUC.
 *
 * Key features:
 * - Matches new sidebar structure with profile, discover, conversations
 * - Shimmer animation for modern loading effect
 * - All styles inline for immediate rendering
 */

/**
 * Skeleton loading state for Sidebar.
 */
export function SidebarSkeleton() {
  return (
    <>
      <style>{`
        @keyframes sidebar-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div
        style={{
          width: '280px',
          height: '100%',
          background: 'linear-gradient(180deg, #f8f9fb 0%, #f0f2f5 100%)', // --gradient-sidebar
          borderRight: '1px solid #e5e5e5',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
        }}
      >
        {/* Profile section skeleton */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 0',
            marginBottom: '16px',
            borderBottom: '1px solid #e5e5e5',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(90deg, #e5e5e5 25%, #d4d4d4 50%, #e5e5e5 75%)',
              backgroundSize: '200% 100%',
              animation: 'sidebar-shimmer 1.5s ease-in-out infinite',
            }}
          />
          {/* Name and streak */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                height: '14px',
                width: '80px',
                marginBottom: '4px',
                background: 'linear-gradient(90deg, #e5e5e5 25%, #d4d4d4 50%, #e5e5e5 75%)',
                backgroundSize: '200% 100%',
                borderRadius: '4px',
                animation: 'sidebar-shimmer 1.5s ease-in-out infinite',
                animationDelay: '0.1s',
              }}
            />
            <div
              style={{
                height: '12px',
                width: '60px',
                background: 'linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%)',
                backgroundSize: '200% 100%',
                borderRadius: '4px',
                animation: 'sidebar-shimmer 1.5s ease-in-out infinite',
                animationDelay: '0.2s',
              }}
            />
          </div>
        </div>

        {/* New Conversation button skeleton */}
        <div
          style={{
            height: '44px',
            marginBottom: '24px',
            background: 'linear-gradient(90deg, #e5e5e5 25%, #d4d4d4 50%, #e5e5e5 75%)',
            backgroundSize: '200% 100%',
            borderRadius: '8px',
            animation: 'sidebar-shimmer 1.5s ease-in-out infinite',
            animationDelay: '0.3s',
          }}
        />

        {/* Discover section skeleton */}
        <div style={{ marginBottom: '24px' }}>
          {/* Section header */}
          <div
            style={{
              height: '10px',
              width: '60px',
              marginBottom: '12px',
              background: 'linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%)',
              backgroundSize: '200% 100%',
              borderRadius: '4px',
              animation: 'sidebar-shimmer 1.5s ease-in-out infinite',
              animationDelay: '0.4s',
            }}
          />
          {/* Nav items */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: '40px',
                marginBottom: '4px',
                background: 'linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%)',
                backgroundSize: '200% 100%',
                borderRadius: '8px',
                animation: 'sidebar-shimmer 1.5s ease-in-out infinite',
                animationDelay: `${(0.5 + i * 0.1).toString()}s`,
              }}
            />
          ))}
        </div>

        {/* Conversations section skeleton */}
        <div style={{ flex: 1 }}>
          {/* Section header */}
          <div
            style={{
              height: '10px',
              width: '100px',
              marginBottom: '12px',
              background: 'linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%)',
              backgroundSize: '200% 100%',
              borderRadius: '4px',
              animation: 'sidebar-shimmer 1.5s ease-in-out infinite',
              animationDelay: '0.9s',
            }}
          />
          {/* Conversation items */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                padding: '12px',
                marginBottom: '4px',
                background: 'linear-gradient(90deg, #ffffff 25%, #f5f5f5 50%, #ffffff 75%)',
                backgroundSize: '200% 100%',
                borderRadius: '8px',
                animation: 'sidebar-shimmer 1.5s ease-in-out infinite',
                animationDelay: `${(1.0 + i * 0.1).toString()}s`,
              }}
            >
              <div
                style={{
                  height: '12px',
                  width: '70%',
                  marginBottom: '6px',
                  background: 'linear-gradient(90deg, #e5e5e5 25%, #d4d4d4 50%, #e5e5e5 75%)',
                  backgroundSize: '200% 100%',
                  borderRadius: '4px',
                  animation: 'sidebar-shimmer 1.5s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  height: '10px',
                  width: '90%',
                  background: 'linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%)',
                  backgroundSize: '200% 100%',
                  borderRadius: '4px',
                  animation: 'sidebar-shimmer 1.5s ease-in-out infinite',
                }}
              />
            </div>
          ))}
        </div>

        {/* Footer skeleton */}
        <div
          style={{
            borderTop: '1px solid #e5e5e5',
            paddingTop: '16px',
            display: 'flex',
            gap: '8px',
          }}
        >
          <div
            style={{
              flex: 1,
              height: '36px',
              background: 'linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%)',
              backgroundSize: '200% 100%',
              borderRadius: '8px',
              animation: 'sidebar-shimmer 1.5s ease-in-out infinite',
              animationDelay: '1.3s',
            }}
          />
          <div
            style={{
              flex: 1,
              height: '36px',
              background: 'linear-gradient(90deg, #f5f5f5 25%, #e5e5e5 50%, #f5f5f5 75%)',
              backgroundSize: '200% 100%',
              borderRadius: '8px',
              animation: 'sidebar-shimmer 1.5s ease-in-out infinite',
              animationDelay: '1.4s',
            }}
          />
        </div>
      </div>
    </>
  );
}
