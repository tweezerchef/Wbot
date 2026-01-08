# TanStack Best Practices - Remaining Implementation Items

**Date:** January 8, 2026
**Status:** Post-Audit Follow-up
**Reference:** [TANSTACK_BEST_PRACTICES_AUDIT.md](./TANSTACK_BEST_PRACTICES_AUDIT.md)

---

## Summary

The TanStack Best Practices audit identified improvements across 4 phases. **Phases 1-2 and Phase 4 are fully completed**. **Phase 3 was partially completed** (patterns created but not connected to real data).

This document provides guidance for remaining items.

### Quick Status

| Phase   | Status          | Description                       |
| ------- | --------------- | --------------------------------- |
| Phase 1 | ✅ Complete     | Router & Query integration        |
| Phase 2 | ✅ Complete     | Auth pattern improvements         |
| Phase 3 | ⚠️ Partial      | Query patterns (scaffolding only) |
| Phase 4 | ✅ **Complete** | File structure reorganization     |

---

## Phase 3: Query Pattern Integration (Partially Complete)

### Current State

The query infrastructure has been set up but is **not actively used**:

| File                              | Status             | Notes                        |
| --------------------------------- | ------------------ | ---------------------------- |
| `lib/queries/conversationKeys.ts` | ✅ Complete        | Hierarchical key factory     |
| `lib/queries/conversations.ts`    | ⚠️ Scaffolding     | TODO placeholders in queryFn |
| `routes/_authed/chat.tsx`         | ⚠️ Not using Query | Direct server function call  |
| Components using Query            | ❌ None            | No `useSuspenseQuery` usage  |

### Why Not Completed

The audit notes: _"Ready for future Query adoption"_

The chat functionality uses **SSE streaming** for real-time message updates, which doesn't fit the TanStack Query caching model. Query is better suited for:

- Conversation list (could be cached)
- User preferences
- Static data that benefits from caching

### Remaining Tasks

#### Task 3.1: Connect Conversation List to Query

**When to implement:** When conversation list needs caching/revalidation features.

**Files to modify:**

- `lib/queries/conversations.ts` - Replace TODO with real server function call
- `routes/_authed/chat.tsx` - Use `queryClient.ensureQueryData()` in loader

**Implementation:**

```typescript
// lib/queries/conversations.ts
import { getConversationsServerFn } from '../conversations.server';

export const conversationListOptions = (userId: string) =>
  queryOptions({
    queryKey: conversationKeys.list(userId),
    queryFn: () => getConversationsServerFn({ data: userId }),
    staleTime: 5 * 60 * 1000,
  });
```

```typescript
// routes/_authed/chat.tsx
export const Route = createFileRoute('/_authed/chat')({
  loader: async ({ context }) => {
    const { queryClient } = context;
    const { user } = context; // From _authed parent

    // Prefetch conversation list for SSR
    await queryClient.ensureQueryData(conversationListOptions(user.id));

    // Continue with current logic...
  },
});
```

#### Task 3.2: Add useSuspenseQuery for Conversation List UI

**When to implement:** After Task 3.1, when component needs cached data.

**Files to modify:**

- `components/ConversationHistory/ConversationHistory.tsx`

**Implementation:**

```typescript
import { useSuspenseQuery } from '@tanstack/react-query';
import { conversationListOptions } from '@/lib/queries';

function ConversationHistory({ userId }: Props) {
  const { data: conversations } = useSuspenseQuery(conversationListOptions(userId));
  // ...
}
```

---

## Phase 4: File Structure Reorganization

### Status: ✅ **COMPLETE** (January 8, 2026)

The file structure reorganization has been fully implemented:

- Created feature-based organization under `src/features/`
- Moved all components to appropriate feature folders (auth, breathing, chat, meditation, wellness)
- Consolidated hooks into feature-specific `hooks/` directories
- Created shared UI components under `src/components/ui/`, `feedback/`, and `overlays/`
- Updated all imports throughout the codebase
- All 563 tests pass, TypeScript checks pass, build succeeds
- Updated CLAUDE.md and .cursorrules with new structure documentation

---

### Current Structure Analysis

**Total Component Files:** ~60+ TSX files
**Total Hooks:** 11 custom hooks
**Total Type Files:** 7 scattered type files

#### Current Directory Layout

```
src/
├── components/                    # ALL components mixed together (problem!)
│   ├── buttons/                   # 9 icon components
│   ├── pages/                     # Page components (ChatPage, LandingPage, SignupPage)
│   ├── DefaultCatchBoundary/      # Error boundary
│   ├── NotFound/                  # 404 component
│   ├── BreathingExercise/         # Basic breathing + hooks + types
│   ├── BreathingConfirmation/     # Breathing confirmation dialog
│   ├── ImmersiveBreathing/        # Advanced breathing (6 components + hooks)
│   ├── WimHofExercise/            # Wim Hof breathing + hook
│   ├── GuidedMeditation/          # Meditation (8 components + 4 hooks + types)
│   ├── MeditationSeries/          # Series tracking (3 components + types)
│   ├── MeditationLibrary/         # Library browser (2 components + hook + types)
│   ├── VoiceSelectionConfirmation/# Voice selection dialog
│   ├── ConversationHistory/       # Chat sidebar
│   ├── ActivityOverlay/           # Activity wrapper + hook + types
│   ├── WellnessProfile/           # User profile + types
│   └── MoodCheck/                 # Mood tracking
│
├── lib/                           # Utilities (well organized)
│   ├── supabase/                  # Client/server split
│   ├── queries/                   # TanStack Query patterns
│   ├── schemas/                   # Zod schemas
│   ├── breathing/                 # Breathing session hook
│   └── *.ts                       # Various utilities
│
├── routes/                        # File-based routing (good)
├── styles/                        # Global styles (good)
└── router.tsx
```

#### Problems Identified

| Problem                     | Impact                     | Current State                             |
| --------------------------- | -------------------------- | ----------------------------------------- |
| Flat component structure    | Hard to find related files | All 18+ folders at same level             |
| Mixed concerns              | Features mixed with UI     | ActivityOverlay next to BreathingExercise |
| No clear feature boundaries | Duplicate patterns         | Similar hooks in different folders        |
| Page components buried      | Confusing navigation       | `components/pages/ChatPage/`              |
| No shared types             | Type duplication           | 7 separate `types.ts` files               |

---

### Target Structure

```
src/
├── components/                    # SHARED UI components only
│   ├── ui/                        # Atomic/primitive components
│   │   ├── icons/                 # Icon components (from buttons/)
│   │   │   ├── MenuIcon.tsx
│   │   │   ├── CloseIcon.tsx
│   │   │   ├── ChevronLeftIcon.tsx
│   │   │   ├── ChevronRightIcon.tsx
│   │   │   ├── ChevronDownIcon.tsx
│   │   │   ├── NewChatIcon.tsx
│   │   │   ├── LogoutIcon.tsx
│   │   │   ├── HistoryIcon.tsx
│   │   │   ├── SearchIcon.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── feedback/                  # Feedback/status components
│   │   ├── DefaultCatchBoundary/
│   │   ├── NotFound/
│   │   └── index.ts
│   │
│   ├── overlays/                  # Overlay/modal components
│   │   ├── ActivityOverlay/       # Generic activity wrapper
│   │   └── index.ts
│   │
│   └── index.ts                   # Main barrel export
│
├── features/                      # FEATURE-BASED organization
│   ├── chat/                      # Chat feature
│   │   ├── components/
│   │   │   ├── ChatPage/
│   │   │   │   ├── ChatPage.tsx
│   │   │   │   ├── ChatPage.module.css
│   │   │   │   └── index.ts
│   │   │   └── ConversationHistory/
│   │   │       ├── ConversationHistory.tsx
│   │   │       ├── ConversationHistory.module.css
│   │   │       └── index.ts
│   │   ├── hooks/                 # Chat-specific hooks (future)
│   │   ├── types.ts               # Chat types
│   │   └── index.ts
│   │
│   ├── breathing/                 # Breathing exercises feature
│   │   ├── components/
│   │   │   ├── BreathingExercise/
│   │   │   │   ├── BreathingExercise.tsx
│   │   │   │   ├── BreathingAnimation.tsx
│   │   │   │   ├── BreathingExercise.module.css
│   │   │   │   ├── __tests__/
│   │   │   │   └── index.ts
│   │   │   ├── BreathingConfirmation/
│   │   │   ├── ImmersiveBreathing/
│   │   │   │   ├── ImmersiveBreathing.tsx
│   │   │   │   ├── BreathingCircle.tsx
│   │   │   │   ├── BreathingControls.tsx
│   │   │   │   ├── BreathingProgress.tsx
│   │   │   │   ├── BreathingBackground.tsx
│   │   │   │   ├── ImmersiveBreathingConfirmation.tsx
│   │   │   │   ├── __tests__/
│   │   │   │   └── index.ts
│   │   │   └── WimHofExercise/
│   │   ├── hooks/
│   │   │   ├── useBreathingLoop.ts
│   │   │   ├── useBreathingAudio.ts
│   │   │   ├── useBreathingSession.ts  # Move from lib/breathing/
│   │   │   ├── useWimHofLoop.ts
│   │   │   ├── useHapticFeedback.ts
│   │   │   └── index.ts
│   │   ├── types.ts               # Consolidated breathing types
│   │   └── index.ts
│   │
│   ├── meditation/                # Meditation feature
│   │   ├── components/
│   │   │   ├── GuidedMeditation/
│   │   │   │   ├── GuidedMeditation.tsx
│   │   │   │   ├── AIGeneratedMeditation.tsx
│   │   │   │   ├── PersonalizedMeditation.tsx
│   │   │   │   ├── TimerMeditation.tsx
│   │   │   │   ├── MeditationPlayer.tsx
│   │   │   │   ├── MeditationVisual.tsx
│   │   │   │   ├── MeditationStreakBadge.tsx
│   │   │   │   ├── VoiceSelector.tsx
│   │   │   │   ├── MoodCheck.tsx
│   │   │   │   ├── __tests__/
│   │   │   │   └── index.ts
│   │   │   ├── MeditationSeries/
│   │   │   │   ├── MeditationSeries.tsx
│   │   │   │   ├── SeriesProgressBar.tsx
│   │   │   │   ├── BadgeUnlock.tsx
│   │   │   │   ├── __tests__/
│   │   │   │   └── index.ts
│   │   │   ├── MeditationLibrary/
│   │   │   │   ├── MeditationLibrary.tsx
│   │   │   │   ├── MeditationCard.tsx
│   │   │   │   └── index.ts
│   │   │   └── VoiceSelectionConfirmation/
│   │   ├── hooks/
│   │   │   ├── useMeditationAudio.ts
│   │   │   ├── useBinauralBeats.ts
│   │   │   ├── useAmbientMixer.ts
│   │   │   ├── useTTSGeneration.ts
│   │   │   ├── useMeditationLibrary.ts
│   │   │   └── index.ts
│   │   ├── types.ts               # Consolidated meditation types
│   │   └── index.ts
│   │
│   ├── wellness/                  # Wellness tracking feature
│   │   ├── components/
│   │   │   ├── WellnessProfile/
│   │   │   └── MoodCheck/
│   │   ├── hooks/                 # Future wellness hooks
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── auth/                      # Authentication feature
│   │   ├── components/
│   │   │   ├── LandingPage/
│   │   │   └── SignupPage/
│   │   ├── hooks/                 # Future auth hooks
│   │   └── index.ts
│   │
│   └── index.ts                   # Feature barrel export
│
├── lib/                           # Core utilities (keep mostly as-is)
│   ├── supabase/
│   ├── queries/
│   ├── schemas/
│   ├── ai-client.ts
│   ├── conversations.ts
│   ├── conversations.server.ts
│   ├── conversationHistory.ts
│   ├── meditation-tts.ts
│   ├── parseActivity.ts
│   └── redis.ts
│
├── types/                         # NEW: Global shared types
│   ├── router.ts                  # RouterContext type
│   ├── activity.ts                # Activity types used across features
│   └── index.ts
│
├── routes/                        # File-based routing (unchanged)
│   ├── __root.tsx
│   ├── index.tsx
│   ├── signup.tsx
│   ├── _authed.tsx
│   └── _authed/
│       └── chat.tsx
│
├── styles/                        # Global styles (unchanged)
│   ├── globals.css
│   └── variables.css
│
└── router.tsx
```

---

### Implementation Plan

#### Step 1: Create Directory Structure (30 mins)

Create the new directories without moving files yet:

```bash
# Create feature directories
mkdir -p apps/web/src/features/{chat,breathing,meditation,wellness,auth}/{components,hooks}
mkdir -p apps/web/src/components/{ui/icons,feedback,overlays}
mkdir -p apps/web/src/types
```

#### Step 2: Move Shared UI Components (1 hour)

**Task 2.1: Move icons**

```
components/buttons/* → components/ui/icons/*
```

- Update `components/ui/icons/index.ts` barrel export
- Update all imports across codebase

**Task 2.2: Move feedback components**

```
components/DefaultCatchBoundary/ → components/feedback/DefaultCatchBoundary/
components/NotFound/ → components/feedback/NotFound/
```

**Task 2.3: Move overlay components**

```
components/ActivityOverlay/ → components/overlays/ActivityOverlay/
```

#### Step 3: Move Chat Feature (1 hour)

```
components/pages/ChatPage/ → features/chat/components/ChatPage/
components/ConversationHistory/ → features/chat/components/ConversationHistory/
```

- Create `features/chat/types.ts` (if needed)
- Create `features/chat/index.ts` barrel export
- Update route imports in `routes/_authed/chat.tsx`

#### Step 4: Move Breathing Feature (2 hours)

```
components/BreathingExercise/ → features/breathing/components/BreathingExercise/
components/BreathingConfirmation/ → features/breathing/components/BreathingConfirmation/
components/ImmersiveBreathing/ → features/breathing/components/ImmersiveBreathing/
components/WimHofExercise/ → features/breathing/components/WimHofExercise/
lib/breathing/useBreathingSession.ts → features/breathing/hooks/useBreathingSession.ts
```

- Extract hooks from component folders to `features/breathing/hooks/`:
  - `useBreathingLoop.ts`
  - `useBreathingAudio.ts`
  - `useWimHofLoop.ts`
  - `useHapticFeedback.ts`
- Consolidate types into `features/breathing/types.ts`
- Create barrel exports

#### Step 5: Move Meditation Feature (2 hours)

```
components/GuidedMeditation/ → features/meditation/components/GuidedMeditation/
components/MeditationSeries/ → features/meditation/components/MeditationSeries/
components/MeditationLibrary/ → features/meditation/components/MeditationLibrary/
components/VoiceSelectionConfirmation/ → features/meditation/components/VoiceSelectionConfirmation/
```

- Extract hooks to `features/meditation/hooks/`:
  - `useMeditationAudio.ts`
  - `useBinauralBeats.ts`
  - `useAmbientMixer.ts`
  - `useTTSGeneration.ts`
  - `useMeditationLibrary.ts`
- Consolidate types into `features/meditation/types.ts`
- Create barrel exports

#### Step 6: Move Wellness Feature (30 mins)

```
components/WellnessProfile/ → features/wellness/components/WellnessProfile/
components/MoodCheck/ → features/wellness/components/MoodCheck/
```

- Consolidate types into `features/wellness/types.ts`

#### Step 7: Move Auth Feature (30 mins)

```
components/pages/LandingPage/ → features/auth/components/LandingPage/
components/pages/SignupPage/ → features/auth/components/SignupPage/
```

- Update route imports in `routes/index.tsx` and `routes/signup.tsx`

#### Step 8: Create Global Types (30 mins)

Create `src/types/`:

- `router.ts` - Move RouterContext type from router.tsx
- `activity.ts` - Shared activity types
- `index.ts` - Barrel export

#### Step 9: Update Imports (1-2 hours)

Use IDE refactoring or search/replace to update all imports:

```typescript
// Old imports
import { ChatPage } from '@/components/pages';
import { BreathingExercise } from '@/components/BreathingExercise';
import { MenuIcon } from '@/components/buttons';

// New imports
import { ChatPage } from '@/features/chat';
import { BreathingExercise } from '@/features/breathing';
import { MenuIcon } from '@/components/ui/icons';
```

#### Step 10: Update Storybook Paths (30 mins)

Update any Storybook story imports to use new paths.

#### Step 11: Cleanup (30 mins)

- Delete empty `components/pages/` directory
- Delete empty `components/buttons/` directory
- Delete `lib/breathing/` directory
- Verify all tests pass
- Verify Storybook works
- Verify app builds and runs

---

### Import Path Mapping

| Old Path                                  | New Path                                                            |
| ----------------------------------------- | ------------------------------------------------------------------- |
| `@/components/pages`                      | `@/features/auth` (Landing, Signup) or `@/features/chat` (ChatPage) |
| `@/components/buttons`                    | `@/components/ui/icons`                                             |
| `@/components/DefaultCatchBoundary`       | `@/components/feedback`                                             |
| `@/components/NotFound`                   | `@/components/feedback`                                             |
| `@/components/ActivityOverlay`            | `@/components/overlays`                                             |
| `@/components/BreathingExercise`          | `@/features/breathing`                                              |
| `@/components/BreathingConfirmation`      | `@/features/breathing`                                              |
| `@/components/ImmersiveBreathing`         | `@/features/breathing`                                              |
| `@/components/WimHofExercise`             | `@/features/breathing`                                              |
| `@/components/GuidedMeditation`           | `@/features/meditation`                                             |
| `@/components/MeditationSeries`           | `@/features/meditation`                                             |
| `@/components/MeditationLibrary`          | `@/features/meditation`                                             |
| `@/components/VoiceSelectionConfirmation` | `@/features/meditation`                                             |
| `@/components/ConversationHistory`        | `@/features/chat`                                                   |
| `@/components/WellnessProfile`            | `@/features/wellness`                                               |
| `@/components/MoodCheck`                  | `@/features/wellness`                                               |
| `@/lib/breathing/*`                       | `@/features/breathing/hooks`                                        |

---

### Estimated Effort

| Step      | Task                       | Time             |
| --------- | -------------------------- | ---------------- |
| 1         | Create directory structure | 30 mins          |
| 2         | Move shared UI components  | 1 hour           |
| 3         | Move chat feature          | 1 hour           |
| 4         | Move breathing feature     | 2 hours          |
| 5         | Move meditation feature    | 2 hours          |
| 6         | Move wellness feature      | 30 mins          |
| 7         | Move auth feature          | 30 mins          |
| 8         | Create global types        | 30 mins          |
| 9         | Update imports             | 1-2 hours        |
| 10        | Update Storybook           | 30 mins          |
| 11        | Cleanup & verification     | 30 mins          |
| **Total** |                            | **~10-11 hours** |

---

### Benefits After Reorganization

1. **Clear feature boundaries** - Easy to find all chat-related code
2. **Consolidated hooks** - No more hunting for hooks in component folders
3. **Shared types** - Single source of truth for common types
4. **Better discoverability** - New developers can navigate intuitively
5. **Easier testing** - Feature-level test organization
6. **Scalability** - Easy to add new features following the pattern

---

## Low Priority Items (Nice to Have)

These are cosmetic or minor optimizations from the audit:

### 1. Path Alias Convention

**Current:** `@/` prefix
**TanStack convention:** `~/` prefix

**Recommendation:** Keep `@/` - it works fine and changing would require updating many imports.

### 2. Selective SSR

Add `ssr: false` or `ssr: 'data-only'` to routes that don't need server rendering.

**Candidates:**

- Settings page (if created) - localStorage dependent
- Any pure client-side interactive pages

**Example:**

```typescript
export const Route = createFileRoute('/settings')({
  ssr: false,
  component: SettingsPage,
});
```

### 3. Route Co-location

Use `-components/` prefix for route-specific components:

```
routes/
├── chat.tsx
├── chat/
│   └── -components/
│       └── QuickActions.tsx  # Only used by chat route
```

**When to use:** When a component is only used by a single route.

### 4. Server Function Improvements

Add `notFound()` helper for missing resources:

```typescript
import { notFound } from '@tanstack/react-start';

const getConversation = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const conv = await findConversation(data.id);
    if (!conv) throw notFound();
    return conv;
  });
```

### 5. Vite Configuration

**Explicit server port:**

```typescript
server: {
  port: 3000,
  open: false,
},
```

**Nitro preset for deployment:**

```typescript
tanstackStart({
  nitro: {
    preset: 'node-server', // or 'vercel', 'cloudflare'
  },
}),
```

---

## Implementation Priority

| Priority | Item                                          | Effort          | Status                         |
| -------- | --------------------------------------------- | --------------- | ------------------------------ |
| ~~1~~    | ~~File Structure Reorganization (Phase 4)~~   | ~~10-11 hours~~ | ✅ **Complete**                |
| 1        | Task 3.1 - Connect Query to conversation list | 2-4 hours       | When list caching needed       |
| 2        | Task 3.2 - useSuspenseQuery in components     | 1-2 hours       | After Task 3.1                 |
| 3        | Selective SSR                                 | 30 mins         | When adding client-only routes |
| 4        | notFound() helper                             | 30 mins         | When adding detail routes      |

---

## Completed Items Reference

For reference, these items from the audit are **fully completed**:

- ✅ Router configuration with per-request QueryClient
- ✅ `routerWithQueryClient()` for SSR hydration
- ✅ `createRootRouteWithContext<RouterContext>()`
- ✅ DefaultCatchBoundary global error component
- ✅ `_authed.tsx` protected route layout
- ✅ Auth check moved to `beforeLoad`
- ✅ Chat route migrated to `/_authed/chat`
- ✅ Query key factory pattern
- ✅ Query options scaffolding
- ✅ Tests for new components
- ✅ **Phase 4: File structure reorganization** (feature-based organization)

---

## Decision Log

| Date       | Decision                                   | Rationale                                                              |
| ---------- | ------------------------------------------ | ---------------------------------------------------------------------- |
| 2026-01-08 | Defer full Query integration               | App uses SSE streaming; Query pattern set up for future                |
| 2026-01-08 | ~~Keep current file structure~~            | ~~Not large enough to justify reorganization effort~~                  |
| 2026-01-08 | Keep `@/` path alias                       | Works fine, not worth changing existing imports                        |
| 2026-01-08 | **Approve file structure reorganization**  | User requested; 60+ component files justify feature-based organization |
| 2026-01-08 | **Complete file structure reorganization** | All files moved, imports updated, tests passing                        |

---

_Document created: January 8, 2026_
_Last updated: January 8, 2026_
