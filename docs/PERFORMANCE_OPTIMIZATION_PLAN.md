# Performance Optimization Plan

> **Status:** Planning phase
> **Created:** January 15, 2026
> **Current Score:** 93/100 (after CLS/hydration fixes)

## Executive Summary

After fixing the initial CLS (1.147 → 0) and hydration issues, Lighthouse now reports 93/100 but still shows critical errors:

| Issue                     | Severity | Impact             |
| ------------------------- | -------- | ------------------ |
| NO_LCP error              | Critical | Breaks core metric |
| Unused JavaScript         | High     | ~200KB+ wasted     |
| Unused CSS                | High     | ~100KB+ wasted     |
| Non-composited animations | Medium   | Minor jank         |
| Render-blocking CSS       | Medium   | Delays FCP         |

---

## Root Cause Analysis

### 1. NO_LCP Error

**What it means:** Lighthouse cannot identify a Largest Contentful Paint element.

**Why it happens:**

- `ChatSkeleton` renders first with placeholder elements only
- Real content (`ChatEmptyState` or messages) loads after hydration
- The skeleton has no significant text/image elements that qualify as LCP
- Transition from skeleton → content may be too fast for Lighthouse to detect

**Evidence:**

```
apps/web/src/routes/_authed/chat.tsx:
- pendingMs: 0 (shows skeleton immediately)
- pendingComponent: ChatSkeleton
```

### 2. Unused JavaScript (~200KB+)

**What it means:** JavaScript code is loaded but never executed.

**Why it happens:**

1. **Barrel export problem** - Feature index files use wildcard exports:

   ```typescript
   // apps/web/src/features/index.ts
   export * from './breathing'; // Exports 10+ components
   export * from './meditation'; // Exports 15+ components
   export * from './journaling'; // Exports 5+ components
   ```

2. **Eager imports in ChatPage** (lines 43-65):

   ```typescript
   import {
     BreathingConfirmation,
     WimHofExercise,
     ImmersiveBreathing,
     ImmersiveBreathingConfirmation,
   } from '@/features/breathing';
   ```

   Even though only 4 components are named, the barrel export bundles everything.

3. **No lazy loading** - Zero `React.lazy()` calls in the codebase. All activity components load upfront even though they're conditionally rendered.

4. **Conditional rendering ≠ conditional loading**:
   ```typescript
   // Components are imported at top → bundled
   // But only rendered conditionally → unused until triggered
   {currentActivity === 'breathing' && <ImmersiveBreathing />}
   ```

### 3. Unused CSS (~100KB+)

**What it means:** CSS rules are loaded but never applied.

**Why it happens:**

- CSS Modules follow the same bundling as JS
- All activity component styles (breathing, meditation, journaling) are bundled
- No CSS purging or tree-shaking configured
- Single `chat-*.css` file contains 123KB of styles

### 4. Non-Composited Animations

**What it means:** Animations use properties that require CPU repaint instead of GPU.

**Why it happens:**

```css
/* apps/web/src/features/settings/components/ThemeToggle/ThemeToggle.module.css */
.option {
  transition: all var(--duration-fast) var(--ease-gentle);
}
```

The `transition: all` animates:

- `color` - NOT GPU-accelerated
- `background` - NOT GPU-accelerated
- `box-shadow` - NOT GPU-accelerated

### 5. Render-Blocking CSS (134 KiB)

**What it means:** CSS files block page rendering until fully loaded.

**Current state:**

- `chat-*.css`: 123.5 KiB
- `main-*.css`: 10.8 KiB
- Critical CSS inlined: ~2-3 KiB only

---

## Implementation Plan

### Phase 1: Quick Wins (1-2 hours)

#### 1.1 Fix NO_LCP Error

**File:** `apps/web/src/components/skeletons/ChatSkeleton.tsx`

**Change:** Add a real headline element to the skeleton that matches the actual content:

```tsx
// Find the empty state placeholder area and replace with:
<div style={{ textAlign: 'center', marginBottom: '24px' }}>
  <h1
    style={{
      fontSize: '32px',
      fontWeight: 600,
      color: 'var(--color-text-primary)',
      margin: 0,
      lineHeight: 1.2,
    }}
  >
    Welcome to Wbot
  </h1>
  <p
    style={{
      fontSize: '16px',
      color: 'var(--color-text-secondary)',
      marginTop: '8px',
    }}
  >
    Your AI wellness companion
  </p>
</div>
```

**Why:** Provides a significant text element painted early that Lighthouse can identify as LCP.

#### 1.2 Fix Non-Composited Animations

**File:** `apps/web/src/features/settings/components/ThemeToggle/ThemeToggle.module.css`

**Before:**

```css
.option {
  /* ... */
  transition: all var(--duration-fast) var(--ease-gentle);
}

.option:hover {
  color: var(--color-text-secondary);
  background: var(--color-neutral-200);
}

.option.active {
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}
```

**After:**

```css
.option {
  /* ... */
  /* Only animate GPU-accelerated properties */
  transition:
    transform var(--duration-fast) var(--ease-gentle),
    opacity var(--duration-fast) var(--ease-gentle);
}

.option:hover {
  /* Keep visual states but remove from transition */
  color: var(--color-text-secondary);
  background: var(--color-neutral-200);
  /* Add GPU-accelerated feedback */
  transform: scale(1.05);
  opacity: 0.9;
}

.option:active {
  transform: scale(0.95);
}

.option.active {
  /* Active state applied instantly */
  background: var(--color-surface);
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}
```

**Why:** `transform` and `opacity` are GPU-accelerated, avoiding CPU repaints.

---

### Phase 2: Lazy Loading (2-4 hours)

#### 2.1 Create Activity Loading Skeleton

**File:** `apps/web/src/components/skeletons/ActivityLoadingSkeleton.tsx` (new file)

```tsx
export function ActivityLoadingSkeleton() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        padding: '24px',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-primary)',
          animation: 'spin 1s linear infinite',
        }}
      />
    </div>
  );
}
```

#### 2.2 Convert Activity Imports to Lazy

**File:** `apps/web/src/features/chat/components/ChatPage/ChatPage.tsx`

**Before (lines 43-65):**

```typescript
import {
  BreathingConfirmation,
  WimHofExercise,
  ImmersiveBreathing,
  ImmersiveBreathingConfirmation,
} from '@/features/breathing';
import { JournalingExercise, JournalingConfirmation, JournalHistory } from '@/features/journaling';
import {
  AIGeneratedMeditation,
  GuidedMeditation,
  VoiceSelectionConfirmation,
} from '@/features/meditation';
```

**After:**

```typescript
import { lazy, Suspense } from 'react';
import { ActivityLoadingSkeleton } from '@/components/skeletons/ActivityLoadingSkeleton';

// Lazy load breathing components
const ImmersiveBreathing = lazy(() =>
  import('@/features/breathing/components/ImmersiveBreathing/ImmersiveBreathing').then((m) => ({
    default: m.ImmersiveBreathing,
  }))
);
const ImmersiveBreathingConfirmation = lazy(() =>
  import('@/features/breathing/components/ImmersiveBreathingConfirmation/ImmersiveBreathingConfirmation').then(
    (m) => ({ default: m.ImmersiveBreathingConfirmation })
  )
);
const WimHofExercise = lazy(() =>
  import('@/features/breathing/components/WimHofExercise/WimHofExercise').then((m) => ({
    default: m.WimHofExercise,
  }))
);
const BreathingConfirmation = lazy(() =>
  import('@/features/breathing/components/BreathingConfirmation/BreathingConfirmation').then(
    (m) => ({ default: m.BreathingConfirmation })
  )
);

// Lazy load meditation components
const AIGeneratedMeditation = lazy(() =>
  import('@/features/meditation/components/AIGeneratedMeditation/AIGeneratedMeditation').then(
    (m) => ({ default: m.AIGeneratedMeditation })
  )
);
const GuidedMeditation = lazy(() =>
  import('@/features/meditation/components/GuidedMeditation/GuidedMeditation').then((m) => ({
    default: m.GuidedMeditation,
  }))
);
const VoiceSelectionConfirmation = lazy(() =>
  import('@/features/meditation/components/VoiceSelectionConfirmation/VoiceSelectionConfirmation').then(
    (m) => ({ default: m.VoiceSelectionConfirmation })
  )
);

// Lazy load journaling components
const JournalingExercise = lazy(() =>
  import('@/features/journaling/components/JournalingExercise/JournalingExercise').then((m) => ({
    default: m.JournalingExercise,
  }))
);
const JournalingConfirmation = lazy(() =>
  import('@/features/journaling/components/JournalingConfirmation/JournalingConfirmation').then(
    (m) => ({ default: m.JournalingConfirmation })
  )
);
const JournalHistory = lazy(() =>
  import('@/features/journaling/components/JournalHistory/JournalHistory').then((m) => ({
    default: m.JournalHistory,
  }))
);
```

#### 2.3 Wrap Activity Rendering with Suspense

Find the activity rendering section (around line 1125+) and wrap with Suspense:

```tsx
// Wrap each activity render with Suspense
<Suspense fallback={<ActivityLoadingSkeleton />}>{renderActivity()}</Suspense>;

// Or wrap individual components:
{
  currentActivity === 'breathing' && (
    <Suspense fallback={<ActivityLoadingSkeleton />}>
      <ImmersiveBreathing {...props} />
    </Suspense>
  );
}
```

---

### Phase 3: Critical CSS Expansion (1-2 hours)

#### 3.1 Identify Critical Styles

The critical CSS should include:

- CSS variables (already included)
- CSS reset (already included)
- ChatPage layout structure
- Message area basic styles
- Input area basic styles

#### 3.2 Add ChatPage Critical Styles

**File:** `apps/web/src/routes/__root.tsx`

Find the existing `<style>` block and add:

```css
/* ChatPage critical layout */
[data-page='chat'] {
  display: flex;
  height: 100dvh;
  overflow: hidden;
}

[data-page='chat'] .main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

[data-page='chat'] .header {
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-background);
}

[data-page='chat'] .messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
}

[data-page='chat'] .input-area {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
  background: var(--color-background);
}

/* Loading skeleton critical styles */
.skeleton-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

---

## Future Optimizations (Out of Scope)

These require more significant architectural changes:

### 1. Fix Barrel Exports

**Problem:** `export * from './feature'` bundles everything.

**Solution:** Convert to named exports:

```typescript
// Before
export * from './breathing';

// After
export { BreathingExercise, useBreathingLoop } from './breathing';
```

**Files affected:** All `*/index.ts` barrel files

### 2. CSS Code Splitting

**Problem:** All CSS bundled into single file.

**Solution:** Configure Vite for route-based CSS splitting:

```typescript
// vite.config.ts
build: {
  cssCodeSplit: true,
  rollupOptions: {
    output: {
      manualChunks: (id) => {
        if (id.includes('breathing')) return 'breathing';
        if (id.includes('meditation')) return 'meditation';
        // ...
      }
    }
  }
}
```

### 3. PurgeCSS Integration

**Problem:** Unused CSS rules shipped to production.

**Solution:** Add PurgeCSS to build pipeline:

```typescript
// vite.config.ts
import purgecss from 'vite-plugin-purgecss';

plugins: [
  purgecss({
    content: ['./src/**/*.tsx'],
  }),
];
```

### 4. Server Response Time

**Current:** 778ms (target < 200ms)

**Options:**

- Enable compression (gzip/brotli)
- Add CDN caching layer
- Optimize Docker image
- Pre-render static pages

---

## Verification Checklist

After implementing each phase:

### Phase 1 Verification

- [ ] Run `pnpm build:web`
- [ ] Start production server
- [ ] Run Lighthouse on `/chat`
- [ ] Verify LCP has a value (not "NO_LCP")
- [ ] Verify no "non-composited animations" warnings
- [ ] Verify ThemeToggle still works visually

### Phase 2 Verification

- [ ] Run `pnpm build:web`
- [ ] Check build output for new chunks (breathing.js, meditation.js, etc.)
- [ ] Open Network tab in DevTools
- [ ] Navigate to `/chat` - activity chunks should NOT load initially
- [ ] Trigger an activity - verify chunk loads on demand
- [ ] Run Lighthouse - verify unused JS decreased

### Phase 3 Verification

- [ ] Disable JavaScript in browser
- [ ] Load `/chat` route
- [ ] Verify basic layout is visible (header, messages area, input)
- [ ] Re-enable JavaScript
- [ ] Verify full functionality

---

## Expected Results

| Metric       | Before     | After Phase 1 | After Phase 2 | After Phase 3 |
| ------------ | ---------- | ------------- | ------------- | ------------- |
| LCP          | NO_LCP     | < 2.5s        | < 2.5s        | < 2.0s        |
| Performance  | 93         | 94            | 96+           | 97+           |
| Initial JS   | ~400KB     | ~400KB        | ~200KB        | ~200KB        |
| Animations   | 2 warnings | 0             | 0             | 0             |
| Blocking CSS | 134KB      | 134KB         | ~100KB        | ~80KB         |

---

## Files Modified Summary

| Phase | File                          | Change                      |
| ----- | ----------------------------- | --------------------------- |
| 1     | `ChatSkeleton.tsx`            | Add real headline for LCP   |
| 1     | `ThemeToggle.module.css`      | GPU-accelerated transitions |
| 2     | `ActivityLoadingSkeleton.tsx` | New loading component       |
| 2     | `ChatPage.tsx`                | Lazy imports + Suspense     |
| 3     | `__root.tsx`                  | Expanded critical CSS       |

---

## Appendix: Bundle Analysis Commands

```bash
# Build and analyze bundle
pnpm build:web

# View built files
ls -la apps/web/.output/public/assets/

# Check file sizes
du -sh apps/web/.output/public/assets/*.js
du -sh apps/web/.output/public/assets/*.css

# Generate bundle visualization (if vite-bundle-visualizer installed)
pnpm --filter @wbot/web build -- --report
```
