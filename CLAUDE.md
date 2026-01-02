# Claude Code Instructions for TBot

This file provides instructions and context for Claude Code when working on this project.

---

## Project Overview

TBot is an AI therapy chatbot built as a monorepo with:

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

### TypeScript Typing Rules

- **NEVER** use `any` - define proper types or interfaces
- **AVOID** `unknown` - prefer specific types; use type guards when needed
- **ALWAYS** type function parameters and return types
- **PREFER** inferring types from Zod schemas with `z.infer<typeof schema>`
- **USE** the shared types from `@tbot/shared` for database entities
- Generate database types with `pnpm db:generate-types` after schema changes

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
│   ├── components/      # Reusable UI components (create as needed)
│   │   └── ComponentName/
│   │       ├── ComponentName.tsx
│   │       └── ComponentName.module.css
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility modules and clients
│   ├── styles/          # Global styles and CSS variables
│   └── types/           # TypeScript type definitions
│
├── ai/src/
│   ├── graph/           # LangGraph definitions
│   ├── nodes/           # One folder per node
│   │   └── node_name/
│   │       └── node.py
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
| Python classes   | PascalCase                  | `TherapyState`           |
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
- **Package Manager**: uv
- **Linting**: Ruff

### Database

- **Platform**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Security**: Row Level Security (RLS) enabled

---

## Common Commands

```bash
# Development (start everything with one command)
pnpm dev:all              # Start web + AI + Supabase together
pnpm dev:web              # Start web frontend only
pnpm dev:ai               # Start AI backend only

# Database (requires Docker running)
pnpm db:start             # Start local Supabase
pnpm db:stop              # Stop local Supabase
pnpm db:reset             # Reset database and rerun migrations
pnpm db:generate-types    # Generate TypeScript types from DB

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
pnpm add <package> --filter @tbot/web
pnpm add -D <package> --filter @tbot/shared

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

| Purpose         | File Path                               |
| --------------- | --------------------------------------- |
| Root layout     | `apps/web/src/routes/__root.tsx`        |
| Router config   | `apps/web/src/router.tsx`               |
| Supabase client | `apps/web/src/lib/supabase.ts`          |
| CSS variables   | `apps/web/src/styles/variables.css`     |
| AI graph        | `apps/ai/src/graph/therapy.py`          |
| Graph state     | `apps/ai/src/graph/state.py`            |
| System prompt   | `apps/ai/src/prompts/therapy_system.py` |
| DB migrations   | `database/migrations/*.sql`             |
| Shared types    | `packages/shared/src/types/*.ts`        |
| Roadmap         | `ROADMAP.md`                            |

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
3. Register node in `apps/ai/src/graph/therapy.py`
4. Add placeholder console.log for routing validation during development

### Adding Database Tables

1. Create new migration file in `database/migrations/`
2. Use sequential numbering (e.g., `004_table_name.sql`)
3. Include RLS policies for security
4. Update types in `packages/shared/src/types/database.ts`

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

1. Read `ROADMAP.md` to understand current progress
2. Check for any uncommitted changes with `git status`
3. Run `pnpm install` to ensure dependencies are current
4. Start dev server with `pnpm dev:web`
5. Ask user which task to work on

---

_This file helps Claude Code understand the project conventions and constraints._
