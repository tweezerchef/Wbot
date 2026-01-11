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

- [ ] **4.4 Journaling Prompts** ⚠️ STUB
  - [x] Backend node scaffold (returns placeholder message)
  - [ ] AI-generated reflective prompts based on conversation
  - [ ] Text input area in chat
  - [ ] Save journal entries to database
  - [ ] Frontend journaling component
  - [ ] Optional sharing with AI for discussion

- [ ] **4.5 Activity History** ⚠️ PARTIAL
  - [x] Database tables (user_wellness_profiles, activity_effectiveness)
  - [x] MeditationLibrary shows saved AI-generated meditations
  - [x] MeditationStreakBadge UI component
  - [ ] Unified activity history dashboard
  - [ ] Breathing session history view
  - [ ] Activity statistics and insights
  - [ ] Streak tracking backend integration
  - [ ] Progress visualization over time

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
  - File: `apps/web/src/components/pages/ChatPage/ChatPage.tsx:1035`
  - TODO: Notify AI that exercise completed for follow-up message

- [ ] **4.5.3 Exercise Stats Backend Tracking**
  - Current: Frontend collects stats but doesn't send to backend
  - File: `apps/web/src/components/pages/ChatPage/ChatPage.tsx:636`
  - TODO: Send breathing/meditation stats to backend for user tracking

- [ ] **4.5.4 TanStack Query Integration**
  - Current: Query functions return placeholder empty arrays
  - File: `apps/web/src/lib/queries/conversations.ts`
  - TODO: Implement actual fetch when Query is used for conversation lists

- [ ] **4.5.5 Web Audio Tests**
  - Current: 3 tests skipped due to mock setup issues
  - File: `apps/web/src/components/BreathingExercise/__tests__/useBreathingAudio.test.tsx`
  - Note: Functionality works in browser, tests verify implementation details

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

- [ ] **5.4 Analytics & Monitoring**
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

1. **4.4 Journaling Prompts** - Build frontend component and connect backend
2. **4.5 Activity History** - Create unified dashboard for all activities

**Priority 2 - Backend Cleanup (Phase 4.5):**

1. Thread deletion implementation
2. Exercise completion notifications to AI
3. Stats tracking to backend

**Priority 3 - Move to Phase 5 (Polish):**

1. Add loading states and skeletons
2. Improve error boundaries
3. Accessibility audit

---

## Files to Reference

| Task               | Key Files                                       |
| ------------------ | ----------------------------------------------- |
| Auth               | `apps/web/src/lib/supabase.ts`                  |
| Routing            | `apps/web/src/routes/*.tsx`                     |
| Chat UI            | `apps/web/src/components/pages/ChatPage/`       |
| Breathing          | `apps/web/src/components/BreathingExercise/`    |
| Wim Hof            | `apps/web/src/components/WimHofExercise/`       |
| Immersive Mode     | `apps/web/src/components/ImmersiveBreathing/`   |
| Meditation         | `apps/web/src/components/GuidedMeditation/`     |
| Meditation Library | `apps/web/src/components/MeditationLibrary/`    |
| Meditation Series  | `apps/web/src/components/MeditationSeries/`     |
| Activity Parsing   | `apps/web/src/lib/parseActivity.ts`             |
| Conversations      | `apps/web/src/lib/conversations.ts`             |
| Styling            | `apps/web/src/styles/variables.css`             |
| AI Graph           | `apps/ai/src/graph/wellness.py`                 |
| AI Nodes           | `apps/ai/src/nodes/*/node.py`                   |
| Memory System      | `apps/ai/src/memory/`                           |
| Meditation Gen     | `apps/ai/src/nodes/generate_meditation_script/` |
| Journaling Stub    | `apps/ai/src/nodes/journaling_prompt/`          |
| DB Schema          | `supabase/migrations/*.sql`                     |
| Types              | `packages/shared/src/types/*.ts`                |

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

_Last updated: January 8, 2025_
