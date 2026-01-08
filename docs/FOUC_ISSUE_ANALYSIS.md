# Flash of Unstyled Content (FOUC) Issue Analysis

**Date:** January 8, 2026
**Issue:** Unstyled HTML briefly visible on initial load/refresh for SignupPage and ChatPage
**Affected Pages:** `/signup`, `/chat`
**Working Page:** `/` (LandingPage)

---

## Executive Summary

The SignupPage and ChatPage components display unstyled HTML for approximately 1 second on initial load and browser refresh before the styled content appears. The LandingPage does not exhibit this issue. This document analyzes the root cause and provides implementation recommendations based on TanStack Start best practices.

---

## Table of Contents

1. [Problem Analysis](#1-problem-analysis)
2. [Root Cause Identification](#2-root-cause-identification)
3. [Why LandingPage Works](#3-why-landingpage-works)
4. [Solution Options](#4-solution-options)
5. [Recommended Implementation](#5-recommended-implementation)
6. [Implementation Plan](#6-implementation-plan)
7. [References](#7-references)

---

## 1. Problem Analysis

### Current Behavior

| Page        | Route           | FOUC on Load | FOUC on Refresh |
| ----------- | --------------- | ------------ | --------------- |
| LandingPage | `/`             | ❌ None      | ❌ None         |
| SignupPage  | `/signup`       | ✅ ~1 second | ✅ ~1 second    |
| ChatPage    | `/_authed/chat` | ✅ ~1 second | ✅ ~1 second    |

### Symptoms

1. **Initial Page Load:** HTML structure renders with browser default styles before CSS modules load
2. **Browser Refresh:** Same behavior as initial load
3. **Client Navigation:** No FOUC when navigating between pages after initial load
4. **Affected Elements:** Form inputs, buttons, layout containers, gradients all appear unstyled

### Technical Context

- **Framework:** TanStack Start v1.145+
- **React:** v19
- **Vite:** v7
- **Styling:** CSS Modules (`.module.css` files)
- **SSR:** Enabled (default for TanStack Start)

---

## 2. Root Cause Identification

### The Core Issue: CSS Modules Load After HTML

In Vite + TanStack Start SSR, **CSS Modules are loaded asynchronously on the client side**, not included in the server-rendered HTML. The hydration timeline is:

```
1. Server renders HTML (no CSS module styles)
2. Client receives HTML → renders immediately (unstyled)
3. JavaScript chunks load
4. CSS module imports in JS trigger style loading
5. Styles applied → page looks correct
```

The gap between steps 2 and 5 causes the FOUC.

### Why This Is a Known Issue

This is a documented limitation with CSS Modules in TanStack Start:

> "When using CSS Modules in TanStack Start, styles may load only on the client side, leading to FOUC during the initial render."
> — [GitHub Issue #3023](https://github.com/TanStack/router/issues/3023)

### Current Mitigation Attempt

The `__root.tsx` file already has **critical inline CSS** with all CSS variables and basic styles:

```typescript
// __root.tsx - Critical CSS is inlined
<style dangerouslySetInnerHTML={{ __html: `
  :root { --color-primary: #4a9d9a; ... }
  body { font-family: var(--font-family-sans); ... }
  // ~200 lines of inline CSS
`}} />
```

**Problem:** This critical CSS only covers:

- CSS variables
- Reset styles
- Base element styles
- Sidebar hide/show rules

It does **NOT** cover:

- Component-specific layouts (`.container`, `.card`, `.hero`)
- Component backgrounds (gradients)
- Form styling
- Button styling

---

## 3. Why LandingPage Works

The LandingPage appears to work because:

1. **Simpler Structure:** Less complex layout, fewer styled elements visible "above the fold"
2. **Gradient Background:** The gradient uses CSS variables that ARE in the critical CSS
3. **Loading State:** Has a "Loading..." state that shows while checking session
4. **Faster CSS Load:** Smaller CSS file loads faster than Chat/Signup

However, **the LandingPage still has FOUC** - it's just less noticeable because:

- The container has `display: flex; align-items: center; justify-content: center` from inline styles
- The gradient uses `var(--color-primary-light)` which IS defined in critical CSS
- The "Loading..." text provides a valid visual during the brief unstyled period

---

## 4. Solution Options

### Option A: Extend Critical CSS (Quick Fix) ⚠️

**Approach:** Add more component styles to the inline critical CSS in `__root.tsx`

**Pros:**

- Quick to implement
- No architecture changes needed

**Cons:**

- Increases HTML payload size
- Doesn't scale - need to add CSS for every new page
- Duplicates styles (in critical CSS AND module files)
- Maintenance burden

**Verdict:** Not recommended - doesn't address root cause

---

### Option B: Hide Until Styles Load (Simple)

**Approach:** Hide the page content until CSS modules have loaded using the `hidden` attribute or CSS visibility.

```html
<html hidden>
  <!-- Hidden initially -->
</html>
```

Then remove `hidden` via JavaScript after styles load.

**Pros:**

- Simple to implement
- Prevents all FOUC

**Cons:**

- Brief blank page (white screen vs unstyled content)
- Accessibility concerns (screen readers may not read hidden content)
- Feels hacky

**Verdict:** Not recommended - trades one problem for another

---

### Option C: Loading Skeletons (Best UX) ✅

**Approach:** Show skeleton components that mirror the page layout with animated placeholders. Skeletons use **inline styles** to avoid the same FOUC issue.

```tsx
// In route definition
export const Route = createFileRoute('/signup')({
  pendingMs: 0, // Show immediately for FOUC prevention
  pendingComponent: SignupSkeleton, // Uses inline styles only
  component: SignupPage,
});
```

**Skeleton Benefits:**

- Shows expected page structure (reduces perceived load time)
- Animated pulse effect indicates loading state
- Users understand content is coming
- Better than spinner (more informative)
- Better than blank page (maintains engagement)

**Pros:**

- Best UX of all options
- Perceived performance improvement (50%+ faster in studies)
- Follows TanStack Router best practices
- Inline styles = no FOUC for skeletons themselves

**Cons:**

- Need to create skeleton for each unique page layout
- Must maintain skeleton when page layout changes

**Verdict:** Recommended - best user experience

---

### Option D: CSS-in-JS Migration (Major Change)

**Approach:** Migrate from CSS Modules to a CSS-in-JS solution with proper SSR support (styled-components, Emotion, Vanilla Extract).

**Pros:**

- Solves FOUC at the architecture level
- Styles included in SSR HTML
- Better DX for dynamic styles

**Cons:**

- Major refactor (~60+ component files)
- Bundle size increase
- Different mental model
- Potential runtime overhead

**Verdict:** Not recommended - too disruptive for this issue

---

### Option E: Combined with Option D (Not Needed)

Since Option C (Loading Skeletons) provides an excellent solution on its own, combining with other options adds unnecessary complexity. The inline-styled skeleton approach handles FOUC completely.

---

## 5. Recommended Implementation

### Strategy Overview

```
┌─────────────────────────────────────────────────────────┐
│           FOUC Prevention with Skeleton Loading         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Create Skeleton Components                          │
│     └── Inline styles only (no CSS modules)             │
│     └── Mirror actual page layouts                      │
│     └── Animated pulse effect for visual feedback       │
│                                                         │
│  2. Configure Route pendingComponent                    │
│     └── pendingMs: 0 (show immediately)                 │
│     └── pendingComponent: <PageSkeleton />              │
│                                                         │
│  3. Result                                              │
│     └── Skeleton shows instantly on load                │
│     └── Actual page replaces skeleton when CSS ready    │
│     └── Smooth, professional loading experience         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Part 1: Create Skeleton Loading Components

Create skeleton components that mirror the actual page layouts. Skeletons provide better UX than spinners by showing the expected page structure with animated placeholders.

**Key principles for skeletons:**

- Use inline styles (no CSS modules) to avoid the same FOUC issue
- Match the actual component layout as closely as possible
- Use subtle pulse animation for the loading effect
- Include the skeleton keyframes animation inline

```tsx
// apps/web/src/components/skeletons/SignupSkeleton.tsx
/**
 * Skeleton loading state for SignupPage.
 * Mirrors the auth form layout with animated placeholders.
 * Uses inline styles to avoid CSS module FOUC.
 */
export function SignupSkeleton() {
  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div
        style={{
          minHeight: '100dvh',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #e8f4f3 0%, #f0edf5 100%)',
          padding: '16px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
            padding: '32px',
          }}
        >
          {/* Title skeleton */}
          <div
            style={{
              height: '36px',
              width: '120px',
              backgroundColor: '#e5e5e5',
              borderRadius: '8px',
              margin: '0 auto 8px',
              animation: 'skeleton-pulse 2s ease-in-out infinite',
            }}
          />
          {/* Subtitle skeleton */}
          <div
            style={{
              height: '20px',
              width: '280px',
              backgroundColor: '#e5e5e5',
              borderRadius: '6px',
              margin: '0 auto 32px',
              animation: 'skeleton-pulse 2s ease-in-out infinite',
              animationDelay: '0.1s',
            }}
          />
          {/* Form fields skeleton */}
          {[0, 1].map((i) => (
            <div key={i} style={{ marginBottom: '16px' }}>
              <div
                style={{
                  height: '14px',
                  width: '60px',
                  backgroundColor: '#e5e5e5',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  animation: 'skeleton-pulse 2s ease-in-out infinite',
                  animationDelay: `${0.2 + i * 0.1}s`,
                }}
              />
              <div
                style={{
                  height: '52px',
                  width: '100%',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  border: '1px solid #e5e5e5',
                  animation: 'skeleton-pulse 2s ease-in-out infinite',
                  animationDelay: `${0.3 + i * 0.1}s`,
                }}
              />
            </div>
          ))}
          {/* Submit button skeleton */}
          <div
            style={{
              height: '52px',
              width: '100%',
              backgroundColor: '#4a9d9a',
              borderRadius: '8px',
              marginTop: '8px',
              opacity: 0.6,
              animation: 'skeleton-pulse 2s ease-in-out infinite',
              animationDelay: '0.5s',
            }}
          />
        </div>
      </div>
    </>
  );
}
```

```tsx
// apps/web/src/components/skeletons/ChatSkeleton.tsx
/**
 * Skeleton loading state for ChatPage.
 * Shows header, message area placeholder, and input area.
 * Uses inline styles to avoid CSS module FOUC.
 */
export function ChatSkeleton() {
  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div
        style={{
          height: '100dvh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fafafa',
        }}
      >
        {/* Header skeleton */}
        <div
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e5e5e5',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              height: '24px',
              width: '80px',
              backgroundColor: '#e5e5e5',
              borderRadius: '6px',
              animation: 'skeleton-pulse 2s ease-in-out infinite',
            }}
          />
        </div>

        {/* Messages area skeleton */}
        <div
          style={{
            flex: 1,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Welcome message skeleton */}
          <div
            style={{
              alignSelf: 'flex-start',
              maxWidth: '80%',
              padding: '12px 16px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
            }}
          >
            <div
              style={{
                height: '16px',
                width: '240px',
                backgroundColor: '#e5e5e5',
                borderRadius: '4px',
                animation: 'skeleton-pulse 2s ease-in-out infinite',
              }}
            />
            <div
              style={{
                height: '16px',
                width: '180px',
                backgroundColor: '#e5e5e5',
                borderRadius: '4px',
                marginTop: '8px',
                animation: 'skeleton-pulse 2s ease-in-out infinite',
                animationDelay: '0.1s',
              }}
            />
          </div>
        </div>

        {/* Input area skeleton */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '16px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e5e5e5',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              height: '44px',
              backgroundColor: '#fafafa',
              border: '1px solid #e5e5e5',
              borderRadius: '9999px',
              animation: 'skeleton-pulse 2s ease-in-out infinite',
            }}
          />
          <div
            style={{
              width: '44px',
              height: '44px',
              backgroundColor: '#4a9d9a',
              borderRadius: '50%',
              opacity: 0.6,
              animation: 'skeleton-pulse 2s ease-in-out infinite',
              animationDelay: '0.1s',
            }}
          />
        </div>
      </div>
    </>
  );
}
```

### Part 2: Configure Route pendingComponent

Update routes to use skeleton components:

```tsx
// apps/web/src/routes/signup.tsx
import { createFileRoute } from '@tanstack/react-router';
import { SignupSkeleton } from '../components/skeletons';
import { SignupPage } from '../features/auth';

export const Route = createFileRoute('/signup')({
  // Show skeleton immediately (no delay) since we're preventing FOUC
  pendingMs: 0,
  pendingComponent: SignupSkeleton,
  component: SignupPage,
});
```

```tsx
// apps/web/src/routes/_authed/chat.tsx
import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ChatSkeleton } from '../../components/skeletons';
import { ChatPage } from '../../features/chat';
// ... other imports

export const Route = createFileRoute('/_authed/chat')({
  // Show skeleton immediately since we're preventing FOUC
  pendingMs: 0,
  pendingComponent: ChatSkeleton,
  loader: () => getConversationData(),
  component: ChatPage,
});
```

**Note:** Setting `pendingMs: 0` shows the skeleton immediately, which is ideal for FOUC prevention. For navigation between already-loaded routes, TanStack Router will use cached data and skip the skeleton.

### Part 3: Router-Level Default Configuration (Optional)

Optionally set default pending behavior in router configuration for routes without explicit skeletons:

```tsx
// apps/web/src/router.tsx
import { DefaultSkeleton } from './components/skeletons';

export function getRouter() {
  const queryClient = new QueryClient({ ... });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',

    // Default pending configuration for routes without explicit skeletons
    // Routes with their own pendingComponent will override these
    defaultPendingMs: 100,        // Small delay for client navigation
    defaultPendingMinMs: 200,     // Show for at least 200ms to avoid flicker
    defaultPendingComponent: DefaultSkeleton,  // Generic skeleton fallback

    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: NotFound,
  });

  return routerWithQueryClient(router, queryClient);
}
```

**Note:** Route-specific `pendingComponent` settings override router defaults. For FOUC prevention, each page should have its own skeleton that matches its layout.

---

## 6. Implementation Plan

### Phase 1: Create Skeleton Components (1.5 hours)

| Task | File                                                    | Description                                  |
| ---- | ------------------------------------------------------- | -------------------------------------------- |
| 1.1  | `apps/web/src/components/skeletons/SignupSkeleton.tsx`  | Auth form skeleton with inline styles        |
| 1.2  | `apps/web/src/components/skeletons/ChatSkeleton.tsx`    | Chat interface skeleton with inline styles   |
| 1.3  | `apps/web/src/components/skeletons/DefaultSkeleton.tsx` | Generic fallback skeleton                    |
| 1.4  | `apps/web/src/components/skeletons/index.ts`            | Create barrel export                         |
| 1.5  | Test                                                    | Verify skeletons render correctly standalone |

### Phase 2: Update Routes (30 mins)

| Task | File                                   | Description                                               |
| ---- | -------------------------------------- | --------------------------------------------------------- |
| 2.1  | `apps/web/src/routes/signup.tsx`       | Add `pendingMs: 0` and `pendingComponent: SignupSkeleton` |
| 2.2  | `apps/web/src/routes/_authed/chat.tsx` | Add `pendingMs: 0` and `pendingComponent: ChatSkeleton`   |
| 2.3  | Test                                   | Verify skeletons appear on refresh/initial load           |

### Phase 3: Update Router Config (Optional, 15 mins)

| Task | File                      | Description                                                |
| ---- | ------------------------- | ---------------------------------------------------------- |
| 3.1  | `apps/web/src/router.tsx` | Add DefaultSkeleton as fallback (optional)                 |
| 3.2  | Test                      | Verify defaults work for routes without explicit skeletons |

### Phase 4: Testing & Refinement (30 mins)

| Task | Description                                                          |
| ---- | -------------------------------------------------------------------- |
| 4.1  | Test initial page load (hard refresh)                                |
| 4.2  | Test browser back/forward navigation                                 |
| 4.3  | Test client-side navigation (should skip skeleton for cached routes) |
| 4.4  | Verify skeleton layout matches actual page layout                    |
| 4.5  | Test on mobile viewport                                              |

### Total Estimated Time: 2.5-3 hours

---

## 7. References

### Official Documentation

- [TanStack Router - Route Loading](https://tanstack.com/router/latest/docs/framework/react/guide/route-loading)
- [TanStack Router - Preloading](https://tanstack.com/router/latest/docs/framework/react/guide/preloading)
- [TanStack Start - SSR](https://tanstack.com/start/latest/docs/framework/react/guide/ssr)

### Relevant GitHub Issues

- [CSS Modules SSR Issue #3023](https://github.com/TanStack/router/issues/3023) - CSS modules only load client-side
- [Mantine FOUC Issue #2589](https://github.com/TanStack/router/issues/2589) - Theme provider FOUC

### Community Resources

- [TanStack Start SSR-Friendly Theme Provider](https://dev.to/tigawanna/tanstack-start-ssr-friendly-theme-provider-5gee)
- [Leonardo Montini - TanStack Start Theme](https://leonardomontini.dev/tanstack-start-theme/)
- [Preventing FOUC](https://rc.css.master.co/guide/flash-of-unstyled-content)

### Related Technologies

- [Vite CSS Handling](https://vite.dev/guide/features#css)
- [CSS Modules Specification](https://github.com/css-modules/css-modules)

---

## Appendix: Alternative Approaches Considered

### A. Static Prerendering

TanStack Start supports static prerendering which generates static HTML at build time:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        routes: ['/signup'], // Pre-render these routes
      },
    }),
  ],
});
```

**Why Not Chosen:** The SignupPage has dynamic auth checks and redirects that don't work well with static prerendering. ChatPage requires authentication which makes prerendering impractical.

### B. SPA Mode

TanStack Start can run in SPA mode without SSR:

```typescript
// vite.config.ts
tanstackStart({
  ssr: false, // Disable SSR entirely
}),
```

**Why Not Chosen:** We want SSR for:

- Faster initial load
- Better SEO (LandingPage)
- Server-side data fetching (ChatPage)

### C. Vanilla Extract / Linaria

Zero-runtime CSS-in-JS solutions that extract CSS at build time:

**Why Not Chosen:** Requires significant migration effort and changes the styling workflow. The pendingComponent approach solves the immediate problem with minimal changes.

---

_Document created: January 8, 2026_
_Author: Claude (AI Assistant)_
