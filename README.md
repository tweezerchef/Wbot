# TBot - AI Therapy Companion

A web-based therapy chatbot that provides personalized mental wellness support through conversational AI, guided breathing exercises, meditation, and journaling prompts.

## Architecture Overview

TBot is a monorepo containing three main components:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
│                    TanStack Start + React                        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ SSE (Streaming)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI Backend (Python)                         │
│                 LangGraph + LangChain                            │
│         ┌─────────────────────────────────────────┐             │
│         │            Therapy Graph                 │             │
│         │  ┌─────────┐  ┌─────────┐  ┌─────────┐  │             │
│         │  │Generate │  │Breathing│  │Meditation│ │             │
│         │  │Response │  │Exercise │  │ Guidance │  │             │
│         │  └─────────┘  └─────────┘  └─────────┘  │             │
│         └─────────────────────────────────────────┘             │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase (PostgreSQL)                         │
│              Auth + Database + Row Level Security                │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | TanStack Start, React 19, Vite 7 |
| Styling | CSS Modules, CSS Variables |
| AI Backend | Python, LangGraph, LangChain |
| LLM Providers | Anthropic Claude, Google Gemini |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email + Google OAuth) |
| Package Manager | pnpm |
| Build System | Turborepo |
| Linting | ESLint (Airbnb), Ruff (Python) |

## Directory Structure

```
tbot/
├── apps/
│   ├── web/                    # TanStack Start frontend
│   │   ├── src/
│   │   │   ├── routes/         # File-based routing (TanStack Router)
│   │   │   │   ├── __root.tsx  # Root layout (HTML shell)
│   │   │   │   ├── index.tsx   # Landing page
│   │   │   │   ├── signup.tsx  # Onboarding flow
│   │   │   │   └── chat.tsx    # Main chat interface
│   │   │   ├── lib/            # Utility modules
│   │   │   │   ├── supabase.ts # Supabase client
│   │   │   │   └── ai-client.ts# LangGraph SDK client
│   │   │   ├── styles/         # Global styles
│   │   │   │   ├── globals.css # CSS reset & base styles
│   │   │   │   └── variables.css # Design tokens
│   │   │   └── router.tsx      # Router configuration
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── ai/                     # Python LangGraph backend
│       ├── src/
│       │   ├── graph/
│       │   │   ├── state.py    # TherapyState definition
│       │   │   └── therapy.py  # Main graph definition
│       │   ├── nodes/          # Graph nodes (one folder each)
│       │   │   ├── generate_response/
│       │   │   ├── breathing_exercise/
│       │   │   ├── meditation_guidance/
│       │   │   ├── journaling_prompt/
│       │   │   └── detect_activity/
│       │   ├── prompts/
│       │   │   └── therapy_system.py
│       │   ├── llm/
│       │   │   └── providers.py # Claude + Gemini setup
│       │   ├── utils/
│       │   │   └── user_context.py
│       │   └── auth.py         # Supabase token validation
│       ├── langgraph.json      # LangGraph Deploy config
│       ├── pyproject.toml
│       └── .env.example
│
├── database/                   # Database configuration
│   ├── supabase/
│   │   └── config.toml         # Supabase CLI config
│   └── migrations/             # SQL migrations
│       ├── 001_profiles.sql
│       ├── 002_conversations.sql
│       └── 003_messages.sql
│
├── packages/
│   └── shared/                 # Shared TypeScript types
│       └── src/types/
│           ├── preferences.ts  # User preference types
│           ├── api.ts          # API request/response types
│           └── database.ts     # Database schema types
│
├── turbo.json                  # Turborepo configuration
├── pnpm-workspace.yaml         # pnpm workspace config
├── package.json                # Root package.json
├── eslint.config.js            # ESLint configuration
├── .env                        # Environment variables (git-ignored)
├── .env.example                # Environment template
└── .gitignore
```

## Prerequisites

- **Node.js** >= 22.12.0
- **pnpm** >= 9.0.0
- **Python** >= 3.11
- **uv** (Python package manager) - Install with `curl -LsSf https://astral.sh/uv/install.sh | sh`

## Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd tbot
pnpm install
```

### 2. Set Up Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

```bash
# Supabase (get from your Supabase project dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Client-side Supabase vars (for Vite - must have VITE_ prefix)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Anthropic (for Claude LLM)
ANTHROPIC_API_KEY=sk-ant-...

# Google AI (optional, for Gemini)
GOOGLE_API_KEY=...

# LangGraph API URL
LANGGRAPH_API_URL=http://localhost:8000
VITE_LANGGRAPH_API_URL=http://localhost:8000
```

### 3. Set Up Python Environment

```bash
cd apps/ai
uv sync
```

### 4. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and keys to `.env`
3. Run the database migrations:

```bash
# Install Supabase CLI if not already installed
brew install supabase/tap/supabase

# Link to your project
cd database
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

4. Enable Google OAuth in Supabase Dashboard:
   - Go to Authentication > Providers > Google
   - Add your Google OAuth credentials

## Development

### Start the Web Frontend

```bash
pnpm dev:web
```

Opens at http://localhost:5173

### Start the AI Backend

```bash
cd apps/ai
uv run langgraph dev
```

Opens at http://localhost:8000

### Run Both (Recommended)

```bash
# Terminal 1
pnpm dev:web

# Terminal 2
cd apps/ai && uv run langgraph dev
```

### Other Commands

```bash
# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Type check
pnpm typecheck

# Format Python code
cd apps/ai && uv run ruff format .
```

## Database Schema

### profiles
Stores user profile and preferences.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key (matches auth.users.id) |
| display_name | text | User's display name |
| preferences | jsonb | User preferences from onboarding |
| created_at | timestamptz | Account creation time |
| updated_at | timestamptz | Last update time |

### conversations
Stores chat conversation sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Foreign key to profiles |
| title | text | Conversation title |
| created_at | timestamptz | Conversation start time |
| updated_at | timestamptz | Last message time |

### messages
Stores individual chat messages.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| conversation_id | uuid | Foreign key to conversations |
| role | text | 'user' or 'assistant' |
| content | text | Message content |
| metadata | jsonb | Activity data, etc. |
| created_at | timestamptz | Message timestamp |

## LangGraph Nodes

The AI backend uses a LangGraph state machine with these nodes:

| Node | Purpose |
|------|---------|
| `generate_response` | Main conversational response using Claude/Gemini |
| `detect_activity` | Detects when to suggest wellness activities |
| `breathing_exercise` | Generates guided breathing instructions |
| `meditation_guidance` | Provides meditation guidance |
| `journaling_prompt` | Creates reflective journaling prompts |

## Deployment

### Web Frontend

Deploy to any platform supporting Node.js:
- Vercel (recommended for TanStack Start)
- Netlify
- Railway

### AI Backend

Deploy using LangGraph Cloud:

```bash
cd apps/ai
langgraph deploy
```

Or self-host with Docker.

### Database

Supabase handles hosting. For production:
1. Enable Point-in-Time Recovery
2. Set up database backups
3. Configure connection pooling

## Security Notes

- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data
- Supabase anon key is safe for client-side use
- Service key should NEVER be exposed to the client
- All AI API keys should be server-side only

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `pnpm lint` and `pnpm typecheck`
4. Submit a pull request

## License

Private - All rights reserved
