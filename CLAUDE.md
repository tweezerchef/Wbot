# Claude Code Instructions for Wbot

This file provides instructions and context for Claude Code when working on this project.

---

## Project Overview

Wbot is an AI wellness chatbot built as a monorepo with:

- **Web Frontend**: TanStack Start (React + Vite)
- **AI Backend**: Python with LangGraph/LangChain
- **Database**: Supabase (PostgreSQL)

The chatbot is the PRIMARY interface - activities render inside the chat, not as separate pages.

---

## Critical Rules

### Git & Commits

- **NEVER** run `git add` or `git commit` without explicit user authorization
- **NEVER** include Claude credits, co-author tags, or AI attribution in commits
- **NEVER** push to remote without explicit permission
- Always show the user what will be committed before committing
- Use conventional commit messages (feat:, fix:, refactor:, docs:, etc.)

### Code Quality

- **ALWAYS** use latest best practices - check documentation and web sources when unsure
- **ALWAYS** research solutions using web search and official docs before implementing
- **ALWAYS** separate concerns with clear folder structure and descriptive filenames
- **ALWAYS** add comments explaining what code does and why
- **ALWAYS** use proper TypeScript types - avoid `any` and `unknown` where possible
- **NEVER** add unnecessary complexity or over-engineer solutions
- **NEVER** add features not explicitly requested

### Testing

#### ⚠️ CRITICAL: Never Rewrite Tests to Make Them Pass

**Tests reveal bugs - FIX THE CODE, not the tests.**

- **NEVER** change tests to avoid failures - tests reveal bugs that need fixing
- **ALWAYS** fix code bugs when tests fail, not the tests themselves
- **ONLY** change failing tests if the issue is actually in the test (incorrect assertions, wrong mocks, etc.)
- **NEVER** weaken test assertions or add workarounds to make tests pass
- **NEVER** use `sys.modules` mocking or other hacks to work around import/code issues
- **NEVER** skip tests with `.skip()` or `@pytest.skip` to hide failures
- **NEVER** change expected values to match buggy output
- Failing tests are valuable - they document expected behavior and identify bugs
- If tests fail due to circular imports, fix the imports in the code, not the tests

**When tests fail, ask yourself:**

1. Is the test correct? (Does it test the right behavior?)
2. Is the implementation wrong? (Most likely - fix the code!)
3. Did requirements change? (Only then update the test, with user approval)

**Examples of what NOT to do:**

```typescript
// ❌ BAD: Changing expected value to match buggy output
expect(result).toBe(42);  // Test was failing
expect(result).toBe(41);  // Changed to make it pass - WRONG!

// ❌ BAD: Weakening assertions
expect(result).toEqual({ id: 1, name: 'test' });  // Was failing
expect(result).toBeDefined();  // Weakened to pass - WRONG!

// ❌ BAD: Skipping tests
it.skip('should handle edge case', () => { ... });  // WRONG!

// ✅ GOOD: Fix the implementation
// If test expects 42 but gets 41, find and fix the bug in the code
```

#### Testing Tools & Packages

**Frontend (apps/web) - Vitest + Testing Library:**

| Package                       | Purpose                         | Usage                       |
| ----------------------------- | ------------------------------- | --------------------------- |
| `vitest`                      | Test runner (fast, Vite-native) | `pnpm test`                 |
| `@vitest/ui`                  | Interactive test browser UI     | `pnpm test:ui`              |
| `@vitest/coverage-v8`         | Code coverage reports           | `pnpm test:coverage`        |
| `@testing-library/react`      | React component testing         | Render and query components |
| `@testing-library/jest-dom`   | DOM assertion matchers          | `toBeInTheDocument()`, etc. |
| `@testing-library/user-event` | User interaction simulation     | `userEvent.click()`, etc.   |
| `happy-dom`                   | Fast DOM implementation         | Configured in vitest.config |

**Backend (apps/ai) - Pytest:**

| Package          | Purpose            | Usage                                 |
| ---------------- | ------------------ | ------------------------------------- |
| `pytest`         | Testing framework  | `uv run pytest`                       |
| `pytest-asyncio` | Async test support | Automatic via `asyncio_mode = "auto"` |
| `pytest-mock`    | Mocking utilities  | `mocker` fixture                      |

#### Testing Commands Reference

```bash
# Frontend (apps/web)
pnpm test                      # Run all tests in watch mode
pnpm test:ui                   # Open interactive Vitest UI
pnpm test:coverage             # Run tests with coverage report
pnpm test ComponentName        # Run specific test file
pnpm --filter @wbot/web test   # Run from monorepo root

# Backend (apps/ai)
cd apps/ai && uv run pytest              # Run all Python tests
cd apps/ai && uv run pytest -v           # Verbose output
cd apps/ai && uv run pytest tests/test_file.py  # Run specific file
cd apps/ai && uv run pytest -k "test_name"      # Run tests matching pattern
cd apps/ai && uv run pytest --cov=src    # With coverage (if configured)

# Full test suite
pnpm test:web                  # All frontend tests
pnpm test:ai                   # All backend tests
pnpm test                      # All tests (via Turbo)
```

#### Comprehensive Testing Requirements

When adding new features or components, **ALWAYS** create comprehensive tests:

**1. Unit Tests for Hooks and Utilities**

- Test all hook functions (start, stop, pause, resume, etc.)
- Test state transitions and edge cases
- Test with fake timers for time-dependent logic
- Test error handling and fallbacks
- Minimum 80% code coverage for new code

**2. Component Tests**

- Test all component states (idle, active, complete, error)
- Test user interactions (clicks, keyboard events)
- Test conditional rendering based on props
- Test accessibility (ARIA labels, keyboard navigation)
- Test responsive behavior if applicable

**3. Integration Tests**

- Test data flow from backend to frontend
- Test parsing and validation of API data
- Test error handling for invalid data
- Test backward compatibility with existing features

**4. Test Structure**

- Use `describe` blocks to organize related tests
- Use descriptive test names that explain what is being tested
- Include setup/teardown in `beforeEach`/`afterEach`
- Mock external dependencies (API calls, timers, audio)
- Use factories or mock data for consistency

**5. Storybook Stories**

- Create stories for all major component variations
- Include interactive test stories with play functions
- Document props and usage in story descriptions
- Include edge cases and error states
- Add visual regression test stories when appropriate

**Example Test Coverage:**

```typescript
// ✅ Good: Comprehensive test coverage
describe('useWimHofLoop', () => {
  describe('initialization', () => {
    /* ... */
  });
  describe('phase transitions', () => {
    /* ... */
  });
  describe('timing', () => {
    /* ... */
  });
  describe('user interactions', () => {
    /* ... */
  });
  describe('edge cases', () => {
    /* ... */
  });
});
```

### TypeScript Typing Rules

- **NEVER** use `any` - define proper types or interfaces
- **AVOID** `unknown` - prefer specific types; use type guards when needed
- **ALWAYS** type function parameters and return types
- **PREFER** inferring types from Zod schemas with `z.infer<typeof schema>`
- **USE** the shared types from `@wbot/shared` for database entities
- Generate database types with `pnpm db:generate-types` after schema changes

### Library Preferences

- **ALWAYS** prefer TanStack libraries over alternatives:
  - TanStack Query over Zustand/Redux for state management
  - TanStack Router (already in use via TanStack Start)
  - TanStack Table for data tables (if needed)
- This ensures consistency with the TanStack Start architecture

### When Uncertain

- Search the web for current best practices (libraries update frequently)
- Fetch official documentation before implementing unfamiliar patterns
- Ask the user for clarification rather than guessing
- Check package versions and compatibility before suggesting dependencies

---

## Project Structure Conventions

### File Organization

```
apps/
├── web/src/
│   ├── routes/          # File-based routing (one file per route)
│   ├── components/      # Reusable UI components
│   │   ├── pages/       # Page-level components (ChatPage, LandingPage, SignupPage)
│   │   ├── BreathingExercise/  # Interactive breathing activity
│   │   ├── ConversationHistory/  # Sidebar conversation panel
│   │   ├── buttons/     # Icon button components
│   │   └── ComponentName/
│   │       ├── ComponentName.tsx
│   │       └── ComponentName.module.css
│   ├── lib/             # Utility modules and clients
│   │   ├── supabase.ts  # Supabase client
│   │   ├── ai-client.ts # LangGraph SDK client
│   │   ├── conversations.ts     # Conversation CRUD
│   │   ├── conversationHistory.ts  # History utilities
│   │   └── parseActivity.ts     # Activity parsing
│   ├── styles/          # Global styles and CSS variables
│   └── types/           # TypeScript type definitions
│
├── ai/src/
│   ├── graph/           # LangGraph definitions (state.py, wellness.py)
│   ├── nodes/           # One folder per node
│   │   ├── generate_response/   # Main response generation
│   │   ├── detect_activity/     # Activity detection
│   │   ├── breathing_exercise/  # Breathing activity
│   │   ├── meditation_guidance/ # Meditation activity
│   │   ├── journaling_prompt/   # Journaling activity
│   │   ├── retrieve_memories/   # Semantic memory retrieval
│   │   └── store_memory/        # Memory persistence
│   ├── memory/          # Semantic memory system
│   │   ├── cache.py     # Redis embedding cache
│   │   ├── embeddings.py  # Vector embeddings
│   │   └── store.py     # Memory storage
│   ├── prompts/         # System prompts and templates
│   ├── llm/             # LLM provider configurations
│   └── utils/           # Utility functions
```

### Naming Conventions

| Type             | Convention                  | Example                  |
| ---------------- | --------------------------- | ------------------------ |
| React Components | PascalCase                  | `ChatMessage.tsx`        |
| CSS Modules      | camelCase                   | `ChatMessage.module.css` |
| Hooks            | camelCase with `use` prefix | `useAuth.ts`             |
| Utilities        | camelCase                   | `formatDate.ts`          |
| Routes           | kebab-case                  | `sign-up.tsx`            |
| Python modules   | snake_case                  | `generate_response.py`   |
| Python classes   | PascalCase                  | `WellnessState`          |
| Environment vars | SCREAMING_SNAKE_CASE        | `VITE_SUPABASE_URL`      |

### Component Structure

When creating new React components:

```tsx
// components/MessageBubble/MessageBubble.tsx

// Imports grouped: React, external libs, internal modules, styles
import { type ReactNode } from 'react';
import styles from './MessageBubble.module.css';

// Props interface with JSDoc comments
interface MessageBubbleProps {
  /** The message content to display */
  content: string;
  /** Whether this is from the user or assistant */
  role: 'user' | 'assistant';
}

// Named export for components
export function MessageBubble({ content, role }: MessageBubbleProps) {
  return (
    <div className={styles.bubble} data-role={role}>
      {content}
    </div>
  );
}
```

---

## Tech Stack Reference

### Frontend

- **Framework**: TanStack Start v1.145+
- **React**: v19
- **Vite**: v7
- **Routing**: TanStack Router (file-based)
- **Styling**: CSS Modules + CSS Variables
- **State**: React hooks (no external state library yet)
- **Auth Client**: Supabase JS v2
- **Validation**: Zod (required for all data validation)

### Backend

- **Runtime**: Python 3.11+
- **Framework**: LangGraph + LangChain
- **LLM**: Anthropic Claude (primary), Google Gemini (experimental)
- **Memory**: Semantic memory with vector embeddings
- **Cache**: Upstash Redis (remote) for embedding cache
- **Package Manager**: uv
- **Linting**: Ruff

### Database

- **Platform**: Supabase (PostgreSQL) - Remote hosted
- **Auth**: Supabase Auth
- **Security**: Row Level Security (RLS) enabled
- **Migrations**: `database/migrations/` pushed via `pnpm db:push`

---

## MCP Integrations

This project uses Model Context Protocol (MCP) servers to enhance Claude Code capabilities.

### Storybook MCP

When Storybook is running (`pnpm storybook`), Claude has access to component documentation via MCP.

**Available Tools:**

| Tool                           | Description                                     |
| ------------------------------ | ----------------------------------------------- |
| `list-all-components`          | List all UI components in the Storybook library |
| `get-component-documentation`  | Get detailed props and docs for a component     |
| `get-story-urls`               | Get URLs for specific component stories         |
| `get-ui-building-instructions` | Get instructions for UI component development   |

**When to Use:**

- **ALWAYS** call `get-ui-building-instructions` before creating or modifying UI components
- Use `list-all-components` to discover existing components before creating new ones
- Use `get-component-documentation` to understand component APIs and usage patterns

**Configuration:**

The MCP server is configured in `.mcp.json`:

```json
{
  "mcpServers": {
    "storybook": {
      "type": "http",
      "url": "http://localhost:6006/mcp"
    }
  }
}
```

**Requirements:**

- Storybook must be running: `pnpm storybook`
- Node.js 24+ required for the `@storybook/addon-mcp` addon

---

## Common Commands

```bash
# Development (start everything - uses remote Supabase & Upstash Redis)
pnpm dev:all              # Start web + AI (no Docker required)
pnpm dev:web              # Start web frontend only
pnpm dev:ai               # Start AI backend only

# Database (remote Supabase)
pnpm db:push              # Push migrations to remote Supabase
pnpm db:generate-types    # Generate TypeScript types from remote DB
pnpm db:status            # Check migration status
pnpm db:new <name>        # Create new migration file

# Local development (optional - requires Docker)
pnpm db:local:start       # Start local Supabase
pnpm db:local:stop        # Stop local Supabase
pnpm db:local:reset       # Reset local database
pnpm redis:local:start    # Start local Redis
pnpm redis:local:stop     # Stop local Redis

# Building
pnpm build                # Build all packages

# Linting & Formatting
pnpm lint                 # Lint all packages (ESLint 9)
pnpm lint:fix             # Lint with auto-fix
pnpm format               # Format all files with Prettier
pnpm format:check         # Check formatting without fixing
cd apps/ai && uv run ruff check .   # Lint Python
cd apps/ai && uv run ruff format .  # Format Python
```

---

## Package Management (pnpm Monorepo)

This is a pnpm workspace monorepo. Follow these patterns:

### Adding Dependencies

```bash
# To workspace root (shared dev tools like ESLint, Prettier)
pnpm add -wD <package>

# To a specific app/package
pnpm add <package> --filter @wbot/web
pnpm add -D <package> --filter @wbot/shared

# ALWAYS run install after adding packages to sync lockfile
pnpm install
```

### Important Rules

- **ALWAYS** run `pnpm install` after adding packages to ensure lockfile is synced
- **NEVER** use npm or yarn - this project uses pnpm exclusively
- **NEVER** install packages globally - add them as project dependencies
- Use `-w` flag for workspace root, `--filter` for specific packages

---

## Environment Variables

### Web App (apps/web/.env)

Variables must have `VITE_` prefix to be exposed to client:

```bash
VITE_SUPABASE_URL=        # Supabase project URL
VITE_SUPABASE_ANON_KEY=   # Supabase anonymous key
VITE_LANGGRAPH_API_URL=   # LangGraph API endpoint
```

### AI Backend (apps/ai/.env)

```bash
ANTHROPIC_API_KEY=        # Claude API key
GOOGLE_API_KEY=           # Gemini API key (optional)
SUPABASE_URL=             # For token validation
SUPABASE_SERVICE_KEY=     # Service role key (server only)
```

---

## Key Files Reference

| Purpose            | File Path                                    |
| ------------------ | -------------------------------------------- |
| Root layout        | `apps/web/src/routes/__root.tsx`             |
| Router config      | `apps/web/src/router.tsx`                    |
| Chat page          | `apps/web/src/components/pages/ChatPage/`    |
| Breathing activity | `apps/web/src/components/BreathingExercise/` |
| Conversations      | `apps/web/src/lib/conversations.ts`          |
| Supabase client    | `apps/web/src/lib/supabase.ts`               |
| AI client          | `apps/web/src/lib/ai-client.ts`              |
| CSS variables      | `apps/web/src/styles/variables.css`          |
| AI graph           | `apps/ai/src/graph/wellness.py`              |
| Graph state        | `apps/ai/src/graph/state.py`                 |
| Memory system      | `apps/ai/src/memory/`                        |
| System prompt      | `apps/ai/src/prompts/wellness_system.py`     |
| DB migrations      | `database/migrations/*.sql`                  |
| Shared types       | `packages/shared/src/types/*.ts`             |
| Roadmap            | `ROADMAP.md`                                 |

---

## Development Guidelines

### Adding a New Route

1. Create file in `apps/web/src/routes/` (e.g., `settings.tsx`)
2. Use `createFileRoute` from TanStack Router
3. Create corresponding `.module.css` file for styles
4. Route is automatically registered by file-based routing

### Adding a New Component

1. Create folder in `apps/web/src/components/ComponentName/`
2. Create `ComponentName.tsx` and `ComponentName.module.css`
3. Use named exports
4. Add prop types with JSDoc comments

### Adding a New LangGraph Node

1. Create folder in `apps/ai/src/nodes/node_name/`
2. Create `node.py` with the node function
3. Register node in `apps/ai/src/graph/wellness.py`
4. Reference existing nodes for patterns:
   - `generate_response/` - Claude integration with streaming
   - `retrieve_memories/` - Semantic memory retrieval
   - `breathing_exercise/` - Activity generation

### Adding a New Interactive Activity

1. Create component folder in `apps/web/src/components/ActivityName/`
2. Reference `BreathingExercise/` for patterns:
   - Main component with activity logic
   - Animation component (if needed)
   - Custom hooks for audio/timing
   - CSS module for styling
3. Create corresponding node in `apps/ai/src/nodes/activity_name/`
4. Update `parseActivity.ts` to handle the new activity type

### Adding Database Tables

1. Create new migration file: `pnpm db:new <name>`
2. Write SQL in `database/migrations/` (uses sequential numbering)
3. Include RLS policies for security
4. Push to remote: `pnpm db:push`
5. Generate types: `pnpm db:generate-types`

---

## CSS Guidelines

### Use CSS Variables

All colors, spacing, and typography should use variables from `variables.css`:

```css
.container {
  background: var(--color-background);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
```

### CSS Module Naming

Use camelCase for class names in CSS Modules:

```css
/* Good */
.messageContainer {
}
.userMessage {
}

/* Avoid */
.message-container {
}
.user_message {
}
```

---

## Zod Validation Guidelines

**ALWAYS use Zod for data validation.** This includes:

- API response validation
- Form input validation
- Environment variable validation
- Props validation (when complex)
- Any external data parsing

### Schema Location

Store Zod schemas in `apps/web/src/lib/schemas/` or colocate with the component/feature that uses them.

### Example Usage

```tsx
// lib/schemas/user.ts
import { z } from 'zod';

// Define the schema
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1).max(100).optional(),
  preferences: z.record(z.unknown()).optional(),
});

// Infer TypeScript type from schema
export type User = z.infer<typeof userSchema>;

// Use for validation
const result = userSchema.safeParse(data);
if (!result.success) {
  console.error('Validation failed:', result.error.flatten());
}
```

### Best Practices

- Use `safeParse()` for graceful error handling (returns `{ success, data, error }`)
- Use `parse()` only when you want to throw on invalid data
- Infer TypeScript types from schemas with `z.infer<typeof schema>`
- Add `.describe()` for self-documenting schemas
- Use `.refine()` for custom validation logic

---

## Python Logging Guidelines

### Philosophy: Minimal & Focused

**Show only what matters** - the AI agent's decision-making flow. Suppress all framework noise.

### Using NodeLogger

All Python nodes use the `NodeLogger` class for clean, minimal output:

```python
from src.logging_config import NodeLogger

# Create logger with node name
logger = NodeLogger("my_node")

# Node lifecycle - automatic visual separators
logger.node_start()   # Shows: ▶ MY_NODE
logger.node_end()     # Shows: ✓ MY_NODE

# Logging with context (appears on separate lines)
logger.info("Activity detected",
    activity="breathing",
    confidence="85%"
)

logger.warning("Rate limit approaching", requests_remaining=5)
logger.error("Processing failed", error=str(e))
```

### Output Example

```
──────────────────────────────────────────────────────────────────────
▶ DETECT_ACTIVITY
19:15:30 | INFO | [detect_activity] Activity detected → routing
  activity: breathing
  confidence: 85%
✓ DETECT_ACTIVITY
──────────────────────────────────────────────────────────────────────
```

### What Gets Logged

**DO log:**

- Node entry/exit (using `node_start()` / `node_end()`)
- Key decisions (routing choices, technique selections)
- Important context (memory usage, user choices)
- Errors and warnings

**DON'T log:**

- Verbose details like full message previews
- Redundant information already in context
- Step-by-step progress within a node
- Framework/HTTP logs (already suppressed)

### Guidelines

1. **Keep it minimal** - Each node should have 1-3 info logs max
2. **Focus on decisions** - Log the "what" and "why", not the "how"
3. **Use context params** - Put data in keyword args, not in the message string
4. **Be descriptive** - Message should explain the decision/action

### Good Examples

```python
# ✅ Good - Clear decision with context
logger.info("Activity detected → routing",
    activity="breathing",
    confidence="85%"
)

# ✅ Good - Simple decision point
logger.info("No activity needed → conversation")

# ✅ Good - Important context
logger.info("Using memories", count=3)

# ❌ Bad - Too verbose
logger.info(
    "Analyzing message",
    message_preview=last_message[:100],
    message_count=len(messages),
    user_id=user_context.get("id"),
    timestamp=datetime.now()
)

# ❌ Bad - Redundant progress updates
logger.info("Starting LLM call")
logger.info("LLM response received")
logger.info("Formatting response")
```

### Suppressed Logs

These loggers are set to ERROR-only (you won't see them unless something breaks):

- `langgraph_api` - Framework logs
- `langgraph_runtime` - Runtime logs
- `httpx` / `httpcore` - HTTP requests
- `browser_opener` - Studio UI logs

### Advanced Configuration

Enable verbose logging when debugging:

```python
import logging

# Show all node logs including DEBUG
logging.getLogger("node").setLevel(logging.DEBUG)

# Show framework logs
logging.getLogger("langgraph_api").setLevel(logging.INFO)

# Show HTTP requests
logging.getLogger("httpx").setLevel(logging.INFO)
```

### Files

- `apps/ai/src/logging_config.py` - Logging configuration
- `apps/ai/LOGGING.md` - Quick reference guide
- All nodes use `NodeLogger` instead of standard `logging.getLogger()`

---

## Error Handling

### Frontend

- Use error boundaries for component-level errors
- Show user-friendly error messages
- Log errors to console in development
- Gracefully handle network failures

### Backend

- Return structured error responses
- Log errors with context
- Never expose internal errors to clients
- Handle LLM API rate limits gracefully

---

## Security Reminders

- Never expose `SUPABASE_SERVICE_KEY` to the client
- Always use RLS policies for database access
- Validate user input on both client and server
- Sanitize content before rendering
- Use HTTPS in production

---

## When Starting a New Session

1. Read `ROADMAP.md` to understand current progress (Phases 1-3 complete, Phase 4 in progress)
2. Check for any uncommitted changes with `git status`
3. Run `pnpm install` to ensure dependencies are current
4. Start dev server with `pnpm dev:all` (or `pnpm dev:web` for frontend only)
5. Ask user which task to work on

---

_This file helps Claude Code understand the project conventions and constraints._

_Last updated: January 5, 2025_
