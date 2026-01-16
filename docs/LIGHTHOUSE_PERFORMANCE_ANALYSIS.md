# Lighthouse Performance Analysis

**Date:** January 15, 2026
**URL Tested:** http://localhost:3000/chat
**Lighthouse Version:** 13.0.1

---

## Executive Summary

The web application has a **Performance Score of 44/100**, which is considered **poor**. Two critical metrics are causing significant problems:

| Metric                         | Current Value | Target  | Status   |
| ------------------------------ | ------------- | ------- | -------- |
| LCP (Largest Contentful Paint) | **9.3s**      | < 2.5s  | Critical |
| CLS (Cumulative Layout Shift)  | **1.147**     | < 0.1   | Critical |
| Server Response Time           | **1,002ms**   | < 200ms | Poor     |
| TTI (Time to Interactive)      | **9.3s**      | < 3.8s  | Poor     |
| FCP (First Contentful Paint)   | 0.9s          | < 1.8s  | Good     |
| TBT (Total Blocking Time)      | 40ms          | < 200ms | Good     |
| Speed Index                    | 2.3s          | < 3.4s  | Moderate |

---

## Critical Issues

### 1. Massive Layout Shift (CLS: 1.147)

**This is the #1 priority issue** - the CLS is over **11x the acceptable threshold**.

#### Root Cause

All 14 layout shifts originate from the same element:

```css
div._chatMain_qxodm_685
/* Selector: body > div#app > div._container_qxodm_20 > div._chatMain_qxodm_685 */
```

#### Layout Shift Scores

| Shift # | Score       | Cumulative |
| ------- | ----------- | ---------- |
| 1       | 0.9994      | 0.9994     |
| 2       | 0.0234      | 1.0228     |
| 3       | 0.0230      | 1.0458     |
| 4-14    | ~0.015 each | 1.147      |

#### Cause Analysis

The chat main container is shifting repeatedly during page load, likely due to:

1. **Async content loading** - conversation history loads and pushes content around
2. **Missing skeleton/placeholder dimensions** - content loads without reserved space
3. **Sidebar state changes** - sidebar open/close affecting layout
4. **Dynamic height adjustments** - chat messages rendering incrementally

#### Proposed Solutions

**P1 - Reserve Layout Space:**

```css
/* ChatPage.module.css */
._chatMain_qxodm_685 {
  /* Reserve minimum height to prevent collapse */
  min-height: 100vh;
  min-height: 100dvh; /* Dynamic viewport for mobile */

  /* Prevent width changes from sidebar */
  width: calc(100vw - var(--sidebar-width, 280px));
  transition: width 0.3s ease; /* Smooth sidebar transitions */
}
```

**P2 - Add Content Placeholders:**

```tsx
// ChatPage.tsx - Add skeleton with exact dimensions
<div className={styles.chatMain}>
  <Suspense fallback={<ChatSkeleton height="100vh" />}>
    <ChatContent />
  </Suspense>
</div>
```

**P3 - Use CSS `contain` property:**

```css
._chatMain_qxodm_685 {
  contain: layout style; /* Isolate layout calculations */
}
```

---

### 2. Hydration Mismatch Error

**Console Error Found:**

```
A tree hydrated but some attributes of the server rendered HTML
didn't match the client properties.
```

#### Affected Component: `ThemeToggle`

The server renders:

```html
<button className="_option_1bn0j_15 _active_1bn0j_33" aria-checked="true" aria-label="System">
  <button className="_option_1bn0j_15" aria-checked="false" aria-label="Dark"></button>
</button>
```

The client hydrates:

```html
<button className="_option_1bn0j_15" aria-checked="false" aria-label="System">
  <button
    className="_option_1bn0j_15 _active_1bn0j_33"
    aria-checked="true"
    aria-label="Dark"
  ></button>
</button>
```

#### Why This Matters

- Causes visible UI "flash" as theme state changes
- Contributes to layout shift
- Indicates SSR/CSR state desynchronization

#### Proposed Solution

**Option A: Defer Theme Detection to Client Only**

```tsx
// ThemeToggle.tsx
export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    // Only read from localStorage after hydration
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
    if (stored) setTheme(stored);
    setMounted(true);
  }, []);

  // Return null or skeleton during SSR to avoid mismatch
  if (!mounted) {
    return <div className={styles.skeleton} aria-hidden="true" />;
  }

  return (/* ... actual toggle component */);
}
```

**Option B: Use suppressHydrationWarning (Not Recommended)**

```tsx
// Only use if the visual mismatch is acceptable
<button suppressHydrationWarning aria-checked={isActive}>
```

---

### 3. Slow Server Response Time (TTFB: 1,002ms)

The root document took **1 second** to respond. This delays everything.

#### Potential Causes (Development Environment)

- Vite HMR compilation on request
- SSR rendering time
- Database queries during SSR
- TanStack Router route matching

#### Proposed Investigations

1. **Profile SSR Performance:**

```bash
# Add timing logs to server entry
console.time('ssr-render');
// ... render
console.timeEnd('ssr-render');
```

2. **Check Route Loader Performance:**

```tsx
// routes/_authed/chat.tsx
export const loader = async () => {
  console.time('chat-loader');
  const data = await fetchConversations();
  console.timeEnd('chat-loader');
  return data;
};
```

3. **Consider Streaming SSR:**
   TanStack Start supports streaming - ensure it's enabled for large data.

---

### 4. Large JavaScript Bundles (Development)

**Note:** These numbers are from development mode. Production will be significantly smaller.

#### Unminified JavaScript: ~4.5 MB Potential Savings

| File                  | Size     | Potential Savings |
| --------------------- | -------- | ----------------- |
| seroval (dev)         | 432 KB   | 358 KB (83%)      |
| react-dom (dev)       | 1,006 KB | 307 KB (31%)      |
| @supabase/ssr         | 461 KB   | 201 KB (44%)      |
| @tanstack/router-core | 207 KB   | 174 KB (84%)      |
| @vite/client          | 180 KB   | 152 KB (85%)      |
| framer-motion         | 416 KB   | 141 KB (34%)      |
| ChatPage.tsx          | 180 KB   | 134 KB (74%)      |

#### Unused JavaScript: ~1.7 MB Potential Savings

| File              | Total    | Unused       |
| ----------------- | -------- | ------------ |
| zod schemas chunk | 451 KB   | 375 KB (83%) |
| framer-motion     | 416 KB   | 312 KB (75%) |
| react-dom (dev)   | 1,006 KB | 278 KB (28%) |
| @supabase/ssr     | 460 KB   | 266 KB (58%) |
| seroval           | 433 KB   | 95 KB (22%)  |

---

## Proposed Action Plan

### Phase 1: Fix Layout Shift (Immediate - Critical)

1. **Add explicit dimensions to chat container**
   - File: `apps/web/src/features/chat/components/ChatPage/ChatPage.module.css`
   - Set `min-height`, `width` constraints

2. **Fix skeleton placeholder dimensions**
   - File: `apps/web/src/components/skeletons/ChatSkeleton.tsx`
   - Ensure skeleton matches final layout exactly

3. **Add CSS containment**
   - Add `contain: layout style` to main containers

4. **Stabilize sidebar transitions**
   - Use CSS transforms instead of width changes where possible

### Phase 2: Fix Hydration Error (High Priority)

1. **Fix ThemeToggle SSR/CSR mismatch**
   - File: `apps/web/src/components/ThemeToggle/ThemeToggle.tsx`
   - Defer theme detection to client-side only
   - Use skeleton during hydration

2. **Audit other localStorage-dependent components**
   - Search for `localStorage` usage in components
   - Ensure all use `useEffect` for client-only reads

### Phase 3: Investigate Server Response Time (Medium Priority)

1. **Profile route loaders**
   - Add timing to chat route loader
   - Identify slow database queries

2. **Consider data caching**
   - Use TanStack Query's `staleTime` effectively
   - Cache conversation list on client

3. **Verify streaming SSR is enabled**
   - Check TanStack Start configuration

### Phase 4: Production Build Optimizations (For Deployment)

1. **Enable production mode**
   - `pnpm build` will minify and tree-shake

2. **Consider code splitting for meditation features**
   - Lazy load `GuidedMeditation`, `WimHofExercise`, etc.
   - These are not needed on initial chat load

3. **Analyze framer-motion usage**
   - 75% of framer-motion is unused
   - Consider lighter alternatives for simple animations
   - Or use dynamic imports: `const { motion } = await import('framer-motion')`

4. **Tree-shake Supabase client**
   - Import only needed modules: `@supabase/supabase-js/dist/module/lib/...`

---

## Testing Recommendations

After implementing fixes, test with:

```bash
# Build for production
pnpm build

# Run production locally
pnpm preview

# Run Lighthouse on production build
# Use Chrome DevTools > Lighthouse
```

Target metrics after fixes:

- **CLS:** < 0.1
- **LCP:** < 2.5s
- **Server Response:** < 200ms
- **Performance Score:** > 80

---

## Files to Modify

| Priority | File                          | Change                          |
| -------- | ----------------------------- | ------------------------------- |
| P1       | `ChatPage.module.css`         | Add layout constraints          |
| P1       | `ChatSkeleton.tsx`            | Match exact dimensions          |
| P1       | `ThemeToggle.tsx`             | Fix hydration mismatch          |
| P2       | `_authed/chat.tsx`            | Profile loader performance      |
| P3       | `vite.config.ts`              | Verify production optimizations |
| P3       | Various meditation components | Add lazy loading                |

---

## Additional Notes

### Why Development Mode Shows These Issues

- Vite serves unminified source for HMR
- React development mode includes extra checks
- No code splitting optimizations applied

### Expected Production Improvements

- JavaScript bundle: ~70-80% smaller
- Server response: Should be faster without HMR
- But CLS and hydration issues will persist - fix those first!

---

_This analysis was generated from Lighthouse report: `localhost_3000-20260115T150859.json`_
