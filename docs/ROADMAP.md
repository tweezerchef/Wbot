# Wbot Development Roadmap

This document outlines the development progress and next steps for Wbot.

---

## Current State (Completed)

- [x] Monorepo structure with pnpm workspaces + Turborepo
- [x] TanStack Start web app with React 19
- [x] Python LangGraph AI backend with Claude integration
- [x] Supabase database with RLS policies
- [x] Shared TypeScript types package
- [x] Full authentication flow (Email + Google OAuth)
- [x] Chat interface with streaming responses
- [x] Conversation management with collapsible sidebar
- [x] Message persistence and auto-generated titles
- [x] Semantic memory system with vector embeddings
- [x] Redis embedding cache for performance
- [x] Interactive breathing exercises with audio (multiple techniques)
- [x] Full-text search for conversation history
- [x] Guided meditation with pre-recorded tracks
- [x] AI-generated personalized meditations with TTS
- [x] User profiling system with wellness tracking
- [x] Journaling prompts with AI-generated reflective prompts
- [x] Journal entry history and viewing
- [x] TanStack Query for data fetching patterns
- [x] Theme system (light/dark/system)
- [x] Feature-based frontend architecture
- [x] Gamification UI components (badges, streaks, goals - frontend only)
- [x] Activity navigation system with lazy loading

---

## Phase 1: Core Authentication Flow ✅

**Goal:** Users can sign up, log in, and access the chat interface.

### Tasks

- [x] **1.1 Supabase Project Setup**
- [x] **1.2 Landing Page (`/`)**
- [x] **1.3 Sign Up Flow (`/signup`)**
- [x] **1.4 Sign In Flow**
- [x] **1.5 Auth State Management**

---

## Phase 2: Chat Interface ✅

**Goal:** Users can have conversations with the AI wellness companion.

### Tasks

- [x] **2.1 Chat UI Components**
- [x] **2.2 Chat Route (`/chat`)**
- [x] **2.3 LangGraph Integration**
- [x] **2.4 Message Persistence**
- [x] **2.5 Conversation Management**

---

## Phase 3: AI Backend Implementation ✅

**Goal:** The AI provides meaningful wellness responses.

### Tasks

- [x] **3.1 Generate Response Node**
- [x] **3.2 Activity Detection Node**
- [x] **3.3 LangGraph State Management**
- [x] **3.4 Semantic Memory System**
- [x] **3.5 Error Handling**

---

## Phase 4: Interactive Activities (Mostly Complete)

**Goal:** Users can do guided activities within the chat.

### Tasks

- [x] **4.1 Activity UI Framework**
  - Activity container component (renders inside chat)
  - Activity parsing with Zod validation
  - Multiple activity type support (breathing, meditation, etc.)
  - Progress indicators and completion states

- [x] **4.2 Breathing Exercise**
  - Visual breathing guide (expand/contract animation)
  - Multiple techniques (4-7-8, box breathing, etc.)
  - Wim Hof Method with immersive fullscreen mode
  - Audio cues with ambient sounds
  - Duration and cycle selection
  - Mood before/after tracking

- [x] **4.3 Guided Meditation**
  - Pre-recorded UCLA MARC meditation tracks
  - AI-generated personalized meditations with TTS
  - Track selection via LLM analysis
  - Audio player with progress and seeking
  - Visual meditation animations (orb, rings)
  - Ambient sound mixer (ocean, rain, forest)
  - Mood before/after tracking
  - Meditation library for saved AI-generated sessions
  - Meditation series/courses with progress tracking
  - MeditationStreakBadge component

- [x] **4.4 Journaling Prompts** ✅
  - AI-generated prompts with 5 categories (reflection, gratitude, processing, growth, self-compassion)
  - LLM-based prompt selection from conversation context
  - HITL confirmation flow for prompt selection
  - Text editor with word count and writing time tracking
  - Mood tracking before/after writing
  - Share with AI option for discussion
  - Journal entries saved to database with RLS
  - Journal history sidebar component

- [ ] **4.5 Activity History** ⚠️ PARTIAL
  - [x] Database tables (user_wellness_profiles, activity_effectiveness, journal_entries)
  - [x] MeditationLibrary shows saved AI-generated meditations
  - [x] JournalHistory shows saved journal entries
  - [x] Gamification UI components (Badge, StreakDisplay, WeeklyGoals)
  - [ ] Backend integration for gamification (fetch real badges/streaks)
  - [ ] Unified activity history dashboard
  - [ ] Breathing session history view
  - [ ] Activity statistics and insights

---

## Phase 4.5: Backend Cleanup (In Progress)

**Goal:** Fix TODOs and complete partial implementations.

### Tasks

- [ ] **4.5.1 Thread Deletion**
  - Current: API returns success without actually deleting checkpoints
  - File: `apps/ai/src/api/graph.py:455`
  - TODO: Implement actual deletion via checkpointer

- [ ] **4.5.2 Exercise Completion Notifications**
  - Current: Frontend callback is empty after exercise completion
  - File: `apps/web/src/features/chat/components/MessageBubble/MessageBubble.tsx:90`
  - TODO: Notify AI that exercise completed for follow-up message

- [ ] **4.5.3 Activity Stats Backend Tracking**
  - Current: Frontend collects stats but doesn't send to backend
  - File: `apps/web/src/features/navigation/components/ActivityRenderer/ActivityRenderer.tsx`
  - TODO: Send breathing/meditation/journaling stats to backend for tracking

- [x] ~~**4.5.4 TanStack Query Integration**~~ ✅ COMPLETE
  - Implemented in `apps/web/src/lib/queries/conversations.ts`

- [ ] **4.5.5 Web Audio Tests**
  - Current: 3 tests have TODO comments about mock setup
  - File: `apps/web/src/features/breathing/.../useBreathingAudio.test.tsx`
  - Note: Functionality works in browser, tests verify implementation details

- [ ] **4.5.6 Gamification Backend Integration** (NEW)
  - Current: Frontend uses placeholder data for badges, streaks, goals
  - File: `apps/web/src/features/navigation/components/ActivityRenderer/ActivityRenderer.tsx`
  - TODO: Fetch actual badge/streak/goal data from backend

---

## Phase 5: Polish & Production

**Goal:** App is ready for real users.

### Tasks

- [ ] **5.1 UI/UX Polish**
  - Loading states and skeletons
  - Empty states
  - Error boundaries
  - Animations and transitions
  - Accessibility audit (a11y)

- [ ] **5.2 Performance**
  - Code splitting optimization
  - Image optimization
  - API response caching
  - Bundle size analysis

- [ ] **5.3 Testing**
  - Unit tests for utility functions
  - Integration tests for auth flow
  - E2E tests for critical paths
  - AI response quality testing

- [ ] **5.4 Security Review**
  - RLS policy audit
  - Input sanitization
  - Rate limiting
  - CORS configuration
  - Content Security Policy

- [ ] **5.5 Analytics & Monitoring**
  - Error tracking (Sentry)
  - Usage analytics
  - Performance monitoring
  - AI cost tracking

---

## Phase 6: Future Enhancements (Post-MVP)

### Ideas for Later

- [ ] Voice input/output
- [ ] Push notifications for check-ins
- [ ] Mood tracking over time
- [ ] Export conversation history
- [ ] Multiple AI personality options
- [ ] Integration with health apps
- [ ] Group wellness sessions
- [ ] Wellness coach dashboard for oversight
- [ ] Multi-language support
- [ ] Offline mode with sync

---

## Quick Start for Next Session

When resuming development, start here:

```bash
# 1. Start everything with one command (uses remote Supabase & Redis)
pnpm dev:all

# 2. Open http://localhost:5173
```

Or start services individually:

```bash
pnpm dev:web    # Web frontend
pnpm dev:ai     # AI backend
```

### Recommended Next Tasks

**Priority 1 - Complete Phase 4:**

1. ~~Journaling Prompts~~ ✅ COMPLETE
2. **Activity History Dashboard** - Create unified view for all activities
3. **Gamification Backend** - Implement real badge/streak tracking

**Priority 2 - Backend Cleanup (Phase 4.5):**

1. Thread deletion implementation
2. Exercise completion notifications to AI
3. Activity stats tracking to backend

**Priority 3 - Move to Phase 5 (Polish):**

1. Storybook stories for components
2. Test coverage for chat and auth features
3. Accessibility audit

---

## Files to Reference

| Task             | Key Files                             |
| ---------------- | ------------------------------------- |
| Auth             | `apps/web/src/features/auth/`         |
| Routing          | `apps/web/src/routes/`                |
| Chat UI          | `apps/web/src/features/chat/`         |
| Breathing        | `apps/web/src/features/breathing/`    |
| Meditation       | `apps/web/src/features/meditation/`   |
| Journaling       | `apps/web/src/features/journaling/`   |
| Wellness         | `apps/web/src/features/wellness/`     |
| Gamification     | `apps/web/src/features/gamification/` |
| Navigation       | `apps/web/src/features/navigation/`   |
| Settings/Theme   | `apps/web/src/features/settings/`     |
| Shared UI        | `apps/web/src/components/`            |
| Activity Parsing | `apps/web/src/lib/parseActivity.ts`   |
| TanStack Queries | `apps/web/src/lib/queries/`           |
| Supabase Client  | `apps/web/src/lib/supabase/`          |
| AI Graph         | `apps/ai/src/graph/wellness.py`       |
| AI Nodes         | `apps/ai/src/nodes/*/`                |
| Memory System    | `apps/ai/src/memory/`                 |
| TTS System       | `apps/ai/src/tts/`                    |
| DB Schema        | `supabase/migrations/*.sql`           |
| Shared Types     | `packages/shared/src/types/`          |

---

## Notes

- The chatbot is the PRIMARY interface - no traditional navigation
- Activities render INSIDE the chat, not as separate pages
- Use CSS Modules for component styles
- Add comments explaining what things do
- Use Anthropic Claude as primary LLM, Gemini as experimental
- Semantic memory uses vector embeddings with Redis caching
- Conversation history supports full-text search
- Meditation audio from UCLA MARC (CC BY-NC-ND 4.0) and AI-generated via OpenAI TTS

---

_Last updated: January 21, 2026_
