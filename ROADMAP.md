# Wbot Development Roadmap

This document outlines the next steps for developing Wbot from the current scaffolding to a fully functional wellness chatbot.

---

## Current State (Completed)

- [x] Monorepo structure with pnpm workspaces + Turborepo
- [x] TanStack Start web app scaffolding
- [x] Python LangGraph AI backend scaffolding
- [x] Supabase database migrations
- [x] Shared TypeScript types package
- [x] Environment configuration
- [x] Dev server running successfully

---

## Phase 1: Core Authentication Flow

**Goal:** Users can sign up, log in, and access the chat interface.

### Tasks

- [ ] **1.1 Supabase Project Setup**
  - Create production Supabase project
  - Run database migrations
  - Enable Email auth provider
  - Configure Google OAuth provider
  - Set up redirect URLs for OAuth

- [ ] **1.2 Landing Page (`/`)**
  - Design hero section with app value proposition
  - Add "Get Started" and "Sign In" buttons
  - Implement session check to redirect authenticated users to `/chat`
  - Mobile-responsive layout

- [ ] **1.3 Sign Up Flow (`/signup`)**
  - Implement the 8-question onboarding wizard
  - Each question as a step with multiple-choice buttons
  - Progress indicator
  - Save preferences to `profiles` table on completion
  - Google OAuth button integration
  - Redirect to `/chat` after completion

- [ ] **1.4 Sign In Flow**
  - Email/password sign in form
  - Google OAuth sign in
  - "Forgot password" flow
  - Error handling and validation

- [ ] **1.5 Auth State Management**
  - Create auth context/hook for session management
  - Protected route wrapper for `/chat`
  - Auto-redirect unauthenticated users
  - Handle token refresh

---

## Phase 2: Chat Interface

**Goal:** Users can have conversations with the AI wellness companion.

### Tasks

- [ ] **2.1 Chat UI Components**
  - Message bubble component (user vs assistant styling)
  - Message list with auto-scroll
  - Input area with send button
  - Typing indicator while AI responds
  - Full-screen mobile layout

- [ ] **2.2 Chat Route (`/chat`)**
  - Load user profile and preferences
  - Create or resume conversation
  - Display conversation history
  - Handle new message submission

- [ ] **2.3 LangGraph Integration**
  - Connect to LangGraph API via SDK
  - Implement SSE streaming for responses
  - Handle connection errors gracefully
  - Pass user context to AI

- [ ] **2.4 Message Persistence**
  - Save messages to Supabase `messages` table
  - Load conversation history on page load
  - Optimistic UI updates

- [ ] **2.5 Conversation Management**
  - Create new conversation
  - List past conversations (sidebar or menu)
  - Switch between conversations
  - Delete conversation

---

## Phase 3: AI Backend Implementation

**Goal:** The AI provides meaningful wellness responses.

### Tasks

- [ ] **3.1 Generate Response Node**
  - Implement Claude integration
  - System prompt with wellness guidelines
  - Include user preferences in context
  - Conversation memory management
  - Response streaming

- [ ] **3.2 Activity Detection Node**
  - Detect when user might benefit from an activity
  - Keywords/intent detection
  - Suggest appropriate activity type
  - Let user accept or decline

- [ ] **3.3 LangGraph State Management**
  - Define complete WellnessState schema
  - Implement state persistence
  - Handle conversation checkpoints

- [ ] **3.4 Error Handling**
  - Graceful fallbacks for API failures
  - Rate limiting handling
  - User-friendly error messages

---

## Phase 4: Interactive Activities

**Goal:** Users can do guided activities within the chat.

### Tasks

- [ ] **4.1 Activity UI Framework**
  - Activity container component (renders inside chat)
  - Activity header with title and close button
  - Progress indicator for multi-step activities
  - Completion celebration

- [ ] **4.2 Breathing Exercise**
  - Visual breathing guide (expand/contract animation)
  - Customizable breath patterns (4-7-8, box breathing, etc.)
  - Audio cues (optional)
  - Duration selection
  - Completion tracking

- [ ] **4.3 Meditation Guidance**
  - Text-based guided meditation
  - Timer with gentle chime
  - Different meditation types (body scan, gratitude, etc.)
  - Session length options

- [ ] **4.4 Journaling Prompts**
  - AI-generated reflective prompts
  - Text input area
  - Save journal entries to database
  - Optional sharing with AI for discussion

- [ ] **4.5 Activity History**
  - Track completed activities
  - Display in user profile/dashboard
  - Streak tracking (optional)

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

- [ ] **5.5 Deployment**
  - Set up Vercel project for web
  - Deploy LangGraph to LangGraph Cloud
  - Configure production environment variables
  - Set up monitoring and logging
  - Domain and SSL configuration

- [ ] **5.6 Analytics & Monitoring**
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
# 1. Make sure Docker is running

# 2. Start everything with one command
pnpm dev:all

# 3. Open http://localhost:5173
```

Or start services individually:

```bash
pnpm dev:web    # Web frontend
pnpm dev:ai     # AI backend
pnpm db:start   # Database
```

### Recommended Next Task

**Start with Phase 1.2 - Landing Page** because:

1. It's visually satisfying to see progress
2. Doesn't require external API setup
3. Sets the foundation for auth flow
4. Good for getting familiar with the codebase

---

## Files to Reference

| Task      | Key Files                           |
| --------- | ----------------------------------- |
| Auth      | `apps/web/src/lib/supabase.ts`      |
| Routing   | `apps/web/src/routes/*.tsx`         |
| Styling   | `apps/web/src/styles/variables.css` |
| AI Graph  | `apps/ai/src/graph/wellness.py`     |
| AI Nodes  | `apps/ai/src/nodes/*/node.py`       |
| DB Schema | `database/migrations/*.sql`         |
| Types     | `packages/shared/src/types/*.ts`    |

---

## Notes

- The chatbot is the PRIMARY interface - no traditional navigation
- Activities render INSIDE the chat, not as separate pages
- Use CSS Modules for component styles
- Add comments explaining what things do
- Use Anthropic Claude as primary LLM, Gemini as experimental
- All placeholder nodes currently just console.log for routing validation

---

_Last updated: December 30, 2024_
