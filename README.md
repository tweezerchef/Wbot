# Wbot - AI Wellness Companion

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)

> **Note:** This project is in early development and very much a work in progress. Features may be incomplete, APIs may change, and documentation may lag behind the code. Contributions and feedback are welcome!

A web-based wellness chatbot that provides personalized mental wellness support through conversational AI, guided breathing exercises, meditation with voice synthesis, journaling prompts, and semantic memory.

## Features

- **Conversational AI** - Empathetic chat powered by Claude with personalized responses
- **Breathing Exercises** - Multiple techniques including Box Breathing, 4-7-8, and Wim Hof
- **Guided Meditation** - AI-generated scripts with TTS voice synthesis and ambient audio
- **Journaling** - Reflective prompts with persistent journal entries
- **Semantic Memory** - Remembers context across conversations using vector embeddings
- **User Profiling** - Learns preferences and adapts recommendations over time
- **Gamification** - Streaks, badges, and progress tracking for motivation

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Client (Browser)                                   │
│                      TanStack Start + React 19                               │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    Chat      │  │  Breathing   │  │  Meditation  │  │  Journaling  │    │
│  │   Feature    │  │   Feature    │  │   Feature    │  │   Feature    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ SSE (Streaming)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AI Backend (Python)                                   │
│                    FastAPI + LangGraph + LangChain                           │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                        Wellness Graph                               │    │
│  │                                                                     │    │
│  │  START ──┬── retrieve_memories ──┐                                  │    │
│  │          ├── inject_user_context ├── prepare_routing ──┐            │    │
│  │          └── detect_activity ────┘                     │            │    │
│  │                                                        ▼            │    │
│  │                                          ┌── generate_response      │    │
│  │                                          ├── breathing_exercise     │    │
│  │                                          ├── meditation_guidance ───┼─┐  │
│  │                                          └── journaling_prompt      │ │  │
│  │                                                    │                │ │  │
│  │                     store_memory ◄─── analyze_profile ◄─────────────┘ │  │
│  │                          │                                            │  │
│  │                          ▼                                            │  │
│  │                         END ◄─────────────────────────────────────────┘  │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                       │
│  │ Memory Store │  │  TTS Engine  │  │   Embedding  │                       │
│  │  (pgvector)  │  │ (OpenAI/11L) │  │    Cache     │                       │
│  └──────────────┘  └──────────────┘  └──────────────┘                       │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Supabase        │  │  Redis           │  │  PostgreSQL      │
│  (PostgreSQL +   │  │  (Embedding      │  │  (Checkpointer   │
│   Auth + RLS)    │  │   Cache)         │  │   via Supabase)  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Tech Stack

| Component         | Technology                                |
| ----------------- | ----------------------------------------- |
| Frontend          | TanStack Start, React 19, Vite 7          |
| Styling           | CSS Modules, CSS Variables                |
| AI Backend        | Python, FastAPI, LangGraph, LangChain     |
| LLM Providers     | Anthropic Claude (primary), Google Gemini |
| TTS Providers     | OpenAI TTS, ElevenLabs                    |
| Database          | Supabase (PostgreSQL + pgvector)          |
| Embedding Cache   | Redis (Upstash or self-hosted)            |
| State Persistence | langgraph-checkpoint-postgres             |
| Auth              | Supabase Auth (Email + Google OAuth)      |
| Package Manager   | pnpm (frontend), uv (Python)              |
| Build System      | Turborepo                                 |
| Linting           | ESLint 9 + Prettier, Ruff (Python)        |

## Directory Structure

```
wbot/
├── apps/
│   ├── web/                         # TanStack Start frontend
│   │   └── src/
│   │       ├── routes/              # File-based routing (TanStack Router)
│   │       │   ├── __root.tsx       # Root layout
│   │       │   ├── _authed.tsx      # Protected route layout
│   │       │   ├── _authed/         # Protected routes
│   │       │   └── index.tsx        # Landing page
│   │       │
│   │       ├── features/            # Feature-based organization
│   │       │   ├── auth/            # LandingPage, SignupPage
│   │       │   ├── breathing/       # Breathing exercises & hooks
│   │       │   ├── chat/            # Chat interface components
│   │       │   ├── meditation/      # Guided meditation, library, series
│   │       │   ├── journaling/      # Journaling exercise & history
│   │       │   ├── wellness/        # Wellness profile, mood check
│   │       │   ├── gamification/    # Badges, streaks, progress
│   │       │   ├── navigation/      # Navigation components
│   │       │   ├── settings/        # Theme toggle, preferences
│   │       │   └── user/            # User profile components
│   │       │
│   │       ├── components/          # Shared UI components
│   │       │   ├── ui/              # Atomic components, icons
│   │       │   ├── feedback/        # Error boundaries, NotFound
│   │       │   └── overlays/        # Activity overlay
│   │       │
│   │       ├── lib/                 # Utilities and clients
│   │       │   ├── supabase/        # Supabase client (client.ts, server.ts)
│   │       │   ├── queries/         # TanStack Query patterns
│   │       │   ├── schemas/         # Zod validation schemas
│   │       │   └── ai-client.ts     # LangGraph SDK client
│   │       │
│   │       └── styles/              # Global styles
│   │
│   └── ai/                          # Python LangGraph backend
│       └── src/
│           ├── api/                 # FastAPI server
│           │   ├── server.py        # Main application
│           │   ├── graph.py         # Graph endpoint handlers
│           │   ├── meditation.py    # Meditation API routes
│           │   └── auth.py          # Auth middleware
│           │
│           ├── graph/               # LangGraph definitions
│           │   ├── state.py         # WellnessState definition
│           │   └── wellness.py      # Main graph definition
│           │
│           ├── nodes/               # Graph nodes (one folder each)
│           │   ├── generate_response/
│           │   ├── detect_activity/
│           │   ├── breathing_exercise/
│           │   ├── meditation_guidance/
│           │   ├── generate_meditation_script/
│           │   ├── journaling_prompt/
│           │   ├── retrieve_memories/
│           │   ├── store_memory/
│           │   ├── inject_user_context/
│           │   └── analyze_profile/
│           │
│           ├── memory/              # Semantic memory system
│           │   ├── store.py         # Memory storage (pgvector)
│           │   ├── embeddings.py    # Vector embeddings
│           │   └── cache.py         # Redis embedding cache
│           │
│           ├── tts/                 # Text-to-speech providers
│           │   ├── openai_audio.py  # OpenAI TTS
│           │   ├── elevenlabs.py    # ElevenLabs TTS
│           │   ├── voices.py        # Voice configurations
│           │   └── parallel_streaming.py
│           │
│           ├── prompts/             # System prompts
│           └── llm/                 # LLM provider configs
│       │
│       └── docker-compose.self-hosted.yml  # Self-hosted Docker
│
├── packages/
│   └── shared/                      # Shared TypeScript types
│
├── supabase/
│   └── migrations/                  # SQL migrations (11 files)
│
├── k8s/                             # Kubernetes manifests
│   ├── 00-namespace.yaml
│   ├── 01-secrets.yaml
│   ├── 02-configmap.yaml
│   ├── 03-redis.yaml
│   ├── 04-ai-backend.yaml
│   ├── 05-web-frontend.yaml
│   ├── 06-ingress.yaml
│   └── README.md
│
└── turbo.json                       # Turborepo configuration
```

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 9.0.0
- **Python** >= 3.11
- **uv** (Python package manager) - `brew install uv` or `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **Docker** (optional) - For containerized deployment

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/wbot.git
cd wbot
pnpm install
cd apps/ai && uv sync && cd ../..
```

### 2. Configure Environment

```bash
# Copy environment templates
cp .env.example .env
cp apps/ai/.env.example apps/ai/.env
cp apps/web/.env.example apps/web/.env

# Edit each .env file with your credentials
```

### 3. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Add credentials to your `.env` files
3. Run migrations:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
pnpm db:push
```

### 4. Start Development

```bash
pnpm dev:all
```

**Services:**

- Web frontend: http://localhost:5173
- AI backend: http://localhost:2024

## Environment Variables

### Root `.env`

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Client-side (VITE_ prefix required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# LLM APIs
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...                    # Optional

# LangGraph API (port 2024 in development)
LANGGRAPH_API_URL=http://localhost:2024
VITE_LANGGRAPH_API_URL=http://localhost:2024
```

### AI Backend (`apps/ai/.env`)

```bash
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
ANTHROPIC_API_KEY=sk-ant-...

# Database checkpointing
SUPABASE_DB_PASSWORD=your-database-password

# Redis (embedding cache)
REDIS_URI=redis://localhost:6379

# TTS (for meditation)
OPENAI_API_KEY=sk-...                 # Optional

# Observability
LANGSMITH_TRACING=true                # Optional
LANGSMITH_API_KEY=lsv2_pt_...         # Optional
LANGSMITH_PROJECT=wbot-wellness       # Optional

# Production
CORS_ORIGINS=https://your-domain.com  # Optional, defaults to *
```

### Web Frontend (`apps/web/.env`)

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_LANGGRAPH_API_URL=http://localhost:2024

# Optional: Redis cache for server-side rendering
REDIS_URL=redis://localhost:6379
```

## Database Schema

The database uses Supabase PostgreSQL with the **pgvector** extension for semantic search.

### Tables

| Table                        | Purpose                                 |
| ---------------------------- | --------------------------------------- |
| `profiles`                   | User profile and preferences            |
| `conversations`              | Chat conversation sessions              |
| `messages`                   | Individual chat messages                |
| `memories`                   | Semantic memory store (with embeddings) |
| `journal_entries`            | User journal entries                    |
| `user_profiling`             | Learned user preferences and patterns   |
| `meditation_scripts`         | AI-generated meditation scripts         |
| `user_generated_meditations` | User's saved meditation sessions        |
| `conversation_history`       | Extended conversation metadata          |

### Migrations

Migrations are in `supabase/migrations/`. Run them with:

```bash
pnpm db:push              # Push to remote Supabase
pnpm db:generate-types    # Generate TypeScript types
```

## LangGraph Nodes

The AI backend uses a LangGraph state machine with 10 nodes:

| Node                         | Purpose                                          | Execution  |
| ---------------------------- | ------------------------------------------------ | ---------- |
| `retrieve_memories`          | Fetches relevant context from semantic memory    | Parallel   |
| `inject_user_context`        | Adds user profile and preferences to context     | Parallel   |
| `detect_activity`            | Determines if a wellness activity is appropriate | Parallel   |
| `generate_response`          | Main conversational response using Claude        | Routed     |
| `breathing_exercise`         | Generates guided breathing instructions          | Routed     |
| `meditation_guidance`        | Provides meditation guidance and prompts         | Routed     |
| `generate_meditation_script` | Creates full meditation script with TTS          | Routed     |
| `journaling_prompt`          | Creates reflective journaling prompts            | Routed     |
| `store_memory`               | Persists important information to memory store   | Sequential |
| `analyze_profile`            | Updates user profile based on interactions       | Sequential |

### Execution Flow

```
START
   │
   ├── retrieve_memories ────┐
   ├── inject_user_context ──┼── (parallel) ──► prepare_routing
   └── detect_activity ──────┘                        │
                                                      ▼
                                         ┌── generate_response
                                         ├── breathing_exercise
                                         ├── meditation_guidance ──► generate_meditation_script
                                         └── journaling_prompt
                                                      │
                                                      ▼
                                              analyze_profile
                                                      │
                                                      ▼
                                               store_memory
                                                      │
                                                      ▼
                                                    END
```

## Development Commands

### Core Commands

```bash
pnpm dev:all              # Start web + AI (recommended)
pnpm dev:web              # Start web frontend only (port 5173)
pnpm dev:ai               # Start AI backend only (port 2024)
pnpm build                # Build all packages
```

### Database

```bash
pnpm db:push              # Push migrations to Supabase
pnpm db:generate-types    # Generate TypeScript types
pnpm db:status            # Check migration status
pnpm db:new <name>        # Create new migration
```

### Linting & Formatting

```bash
pnpm lint                 # Lint all packages
pnpm lint:fix             # Auto-fix lint issues
pnpm format               # Format with Prettier
pnpm format:check         # Check formatting

# Python
cd apps/ai
uv run ruff check .       # Lint Python
uv run ruff format .      # Format Python
```

### Testing

```bash
# Frontend
pnpm test                 # Run tests in watch mode
pnpm test:coverage        # With coverage report
pnpm test:ui              # Interactive Vitest UI

# Backend
cd apps/ai
uv run pytest             # Run all tests
uv run pytest -v          # Verbose output
```

### Docker (Self-Hosted)

```bash
pnpm ai:build             # Build AI Docker image
pnpm ai:up                # Start Docker services
pnpm ai:down              # Stop Docker services
pnpm ai:logs              # View logs
```

## Deployment

### Option 1: Docker Compose (Self-Hosted)

For self-hosted deployment with Docker:

```bash
# Build and start
cd apps/ai
docker compose -f docker-compose.self-hosted.yml up -d

# View logs
docker compose -f docker-compose.self-hosted.yml logs -f
```

This starts:

- Redis (embedding cache)
- Wbot AI (FastAPI server on port 2024 → internal 8000)

### Option 2: Kubernetes

Full Kubernetes manifests are in `k8s/`. See [k8s/README.md](k8s/README.md) for detailed instructions.

```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/02-configmap.yaml
# Create secrets (see k8s/README.md)
kubectl apply -f k8s/03-redis.yaml
kubectl apply -f k8s/04-ai-backend.yaml
kubectl apply -f k8s/05-web-frontend.yaml
kubectl apply -f k8s/06-ingress.yaml
```

### Option 3: LangGraph Cloud

For managed deployment:

```bash
cd apps/ai
langgraph deploy
```

### Web Frontend Deployment

Deploy to any platform supporting Node.js:

- **Vercel** (recommended for TanStack Start)
- **Netlify**
- **Railway**

Set environment variables in your deployment platform matching `apps/web/.env.example`.

## API Reference

The AI backend exposes a FastAPI server with these endpoints:

### Health Check

```
GET /health
```

Returns service health status.

### Chat Stream

```
POST /api/chat/stream
Content-Type: application/json
Authorization: Bearer <supabase-jwt>

{
  "messages": [...],
  "thread_id": "uuid",
  "user_id": "uuid"
}
```

Streams chat responses via Server-Sent Events (SSE).

### Meditation Generation

```
POST /api/meditation/generate
Content-Type: application/json
Authorization: Bearer <supabase-jwt>

{
  "theme": "stress relief",
  "duration_minutes": 10,
  "voice": "alloy"
}
```

Generates a meditation script with optional TTS audio.

## Security Notes

- **Row Level Security (RLS)** is enabled on all Supabase tables
- Users can only access their own data
- `SUPABASE_ANON_KEY` is safe for client-side use
- `SUPABASE_SERVICE_KEY` must NEVER be exposed to the client
- All LLM API keys are server-side only

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style guidelines, and the pull request process.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
