# Wbot Documentation

Welcome to the Wbot developer documentation. This folder contains all project documentation, organized by area.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start all services (web, AI, database, Redis)
pnpm dev:all

# Or start individual services
pnpm dev:web    # Frontend only (port 5173)
pnpm dev:ai     # AI backend only (LangGraph Studio)

# Open http://localhost:5173
```

## Documentation Structure

| Folder                           | Description                                        |
| -------------------------------- | -------------------------------------------------- |
| [architecture/](./architecture/) | System design, data flow diagrams                  |
| [web/](./web/)                   | Frontend (TanStack Start, React) documentation     |
| [ai/](./ai/)                     | AI backend (LangGraph, Python) documentation       |
| [database/](./database/)         | Database schema, migrations, Supabase              |
| [tooling/](./tooling/)           | Development tools (Docusaurus, Storybook, testing) |

## Key Documents

- [Architecture Overview](./architecture/overview.md) - System design and components
- [Data Flow](./architecture/data-flow.md) - How data moves through the system
- [ROADMAP](./ROADMAP.md) - Development progress and next steps

## Documentation Tools

This project uses two documentation tools:

### Docusaurus (Project Docs)

The Docusaurus configuration lives in this folder alongside the documentation.

```bash
pnpm docs              # Start docs site at http://localhost:3001
pnpm docs:build        # Build for production
```

See [tooling/docusaurus.md](./tooling/docusaurus.md) for details.

### Storybook (Component Docs)

```bash
pnpm storybook         # Start Storybook at http://localhost:6006
pnpm storybook:build   # Build for production
```

See [tooling/storybook.md](./tooling/storybook.md) for details.

## Tech Stack Reference

| Layer          | Technology                | Documentation                        |
| -------------- | ------------------------- | ------------------------------------ |
| **Frontend**   | TanStack Start + React 19 | [web/](./web/)                       |
| **AI Backend** | LangGraph + LangChain     | [ai/](./ai/)                         |
| **LLM**        | Claude (Anthropic)        | [ai/langgraph.md](./ai/langgraph.md) |
| **Database**   | Supabase (PostgreSQL)     | [database/](./database/)             |
| **Cache**      | Redis                     | [ai/memory.md](./ai/memory.md)       |

## Contributing to Docs

When adding new documentation:

1. Place files in the appropriate folder by area (web, ai, database, etc.)
2. Use kebab-case for filenames: `my-new-guide.md`
3. Add frontmatter for Docusaurus compatibility:

   ```yaml
   ---
   sidebar_position: 1
   ---
   ```

4. Update this README if adding a new section
