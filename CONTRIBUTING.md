# Contributing to Wbot

Thank you for your interest in contributing to Wbot! This guide will help you get started with development and explain our contribution process.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

Be respectful, inclusive, and constructive. We're building something to help people with their wellness - let's make the contributor experience positive too.

## Getting Started

### Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9.0.0
- **Python** >= 3.11
- **uv** (Python package manager)
- **Docker** (optional, for containerized deployment)

### Quick Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/wbot.git
cd wbot

# Install dependencies
pnpm install

# Set up Python environment
cd apps/ai && uv sync && cd ../..

# Copy environment files
cp .env.example .env
cp apps/ai/.env.example apps/ai/.env
cp apps/web/.env.example apps/web/.env

# Fill in your API keys and Supabase credentials in each .env file

# Start development servers
pnpm dev:all
```

## Development Setup

### Environment Variables

You'll need accounts and API keys for:

1. **Supabase** (required) - Database and authentication
   - Create a project at [supabase.com](https://supabase.com)
   - Get your project URL and keys from Settings > API

2. **Anthropic** (required) - Claude LLM
   - Get API key from [console.anthropic.com](https://console.anthropic.com)

3. **OpenAI** (optional) - TTS for meditation
   - Get API key from [platform.openai.com](https://platform.openai.com)

4. **Google AI** (optional) - Gemini LLM alternative
   - Get API key from [makersuite.google.com](https://makersuite.google.com)

### Database Setup

Run migrations against your Supabase project:

```bash
# Link to your Supabase project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
pnpm db:push
```

### Running Services

```bash
# Start everything (recommended)
pnpm dev:all

# Or start services individually
pnpm dev:web    # Frontend at http://localhost:5173
pnpm dev:ai     # AI backend at http://localhost:2024
```

## Project Structure

```text
wbot/
├── apps/
│   ├── web/                    # TanStack Start frontend
│   │   └── src/
│   │       ├── routes/         # File-based routing
│   │       ├── features/       # Feature-based organization
│   │       ├── components/     # Shared UI components
│   │       └── lib/            # Utilities and clients
│   │
│   └── ai/                     # Python LangGraph backend
│       └── src/
│           ├── api/            # FastAPI server
│           ├── graph/          # LangGraph state machine
│           ├── nodes/          # Graph nodes
│           ├── memory/         # Semantic memory system
│           └── tts/            # Text-to-speech providers
│
├── packages/
│   └── shared/                 # Shared TypeScript types
│
├── supabase/
│   └── migrations/             # Database migrations
│
└── k8s/                        # Kubernetes manifests
```

## Development Workflow

### Branching Strategy

1. Create a feature branch from `main`:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes with clear, atomic commits

3. Keep your branch up to date:

   ```bash
   git fetch origin
   git rebase origin/main
   ```

### Commit Messages

Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Formatting, missing semicolons, etc.
- `refactor:` - Code change that neither fixes a bug nor adds a feature
- `test:` - Adding or fixing tests
- `chore:` - Maintenance tasks

Examples:

```text
feat: add binaural beats to meditation player
fix: resolve audio playback issue on iOS Safari
docs: update API reference for meditation endpoints
```

## Code Style

### TypeScript (Frontend)

- Use TypeScript strict mode
- Prefer named exports over default exports
- Use Zod for all data validation
- Follow the existing patterns in `features/`

```typescript
// Good
export function MyComponent({ title }: { title: string }) {
  return <div>{title}</div>;
}

// Avoid
export default function(props: any) {
  return <div>{props.title}</div>;
}
```

### Python (Backend)

- Follow PEP 8 style guidelines
- Use type hints
- Run `ruff check` and `ruff format` before committing

```python
# Good
def process_message(content: str, user_id: str) -> dict[str, Any]:
    """Process a user message and return the response."""
    ...

# Avoid
def process_message(content, user_id):
    ...
```

### CSS

- Use CSS Modules for component styles
- Use CSS Variables from `variables.css` for colors, spacing, etc.
- Use camelCase for class names

```css
/* Good */
.messageContainer {
  padding: var(--spacing-md);
  background: var(--color-surface);
}

/* Avoid */
.message-container {
  padding: 16px;
  background: #ffffff;
}
```

## Testing

### Frontend Tests (Vitest)

```bash
pnpm test              # Run tests in watch mode
pnpm test:coverage     # Run with coverage report
pnpm test:ui           # Open interactive UI
```

### Backend Tests (pytest)

```bash
cd apps/ai
uv run pytest          # Run all tests
uv run pytest -v       # Verbose output
uv run pytest -k "test_name"  # Run specific test
```

### Writing Tests

- Test behavior, not implementation details
- Use descriptive test names
- Mock external services (APIs, databases)

```typescript
describe('BreathingExercise', () => {
  it('should transition from inhale to hold after the inhale duration', async () => {
    // ...
  });
});
```

## Pull Request Process

### Before Submitting

1. **Run linters:**

   ```bash
   pnpm lint
   cd apps/ai && uv run ruff check .
   ```

2. **Run tests:**

   ```bash
   pnpm test
   cd apps/ai && uv run pytest
   ```

3. **Test your changes locally** with `pnpm dev:all`

### PR Guidelines

1. **Title:** Use conventional commit format (e.g., `feat: add meditation timer`)

2. **Description:** Include:
   - What changes were made
   - Why they were made
   - How to test them
   - Screenshots for UI changes

3. **Size:** Keep PRs focused and reasonably sized. Split large changes into smaller PRs.

4. **Review:** Address all review comments before merging.

### PR Template

```markdown
## Description

Brief description of the changes.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing

- [ ] Tests pass locally
- [ ] New tests added for new functionality

## Screenshots (if applicable)

Add screenshots for UI changes.
```

## Reporting Issues

### Bug Reports

Include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Browser/environment details
- Screenshots or error messages

### Feature Requests

Include:

- Clear description of the feature
- Use case or problem it solves
- Any implementation ideas (optional)

## Questions?

Open a discussion or reach out in issues. We're happy to help new contributors get started!
