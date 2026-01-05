# Pure Open-Source LangGraph Deployment Plan

> **Goal:** Deploy Wbot AI backend without any LangChain licensing requirements using only MIT-licensed components.

## Executive Summary

The current deployment uses `langgraph build` which creates Docker images with LangChain's **licensed runtime**. This plan migrates to a pure open-source stack by:

1. Replacing the licensed LangGraph server with a custom FastAPI application
2. Keeping all MIT-licensed LangGraph components (graph, checkpointer, nodes)
3. Implementing our own auth middleware and streaming endpoints

**Result:** $0 licensing costs, full control, lowest latency.

---

## What Changes vs What Stays

### Stays the Same (MIT Licensed - No Changes)

| Component               | File                    | License |
| ----------------------- | ----------------------- | ------- |
| Graph definition        | `src/graph/wellness.py` | MIT     |
| All nodes               | `src/nodes/*`           | MIT     |
| PostgreSQL checkpointer | `src/checkpointer.py`   | MIT     |
| Memory system           | `src/memory/*`          | MIT     |
| Meditation endpoints    | `src/api/meditation.py` | MIT     |
| State definition        | `src/graph/state.py`    | MIT     |

### Changes Required

| Current                    | New                    | Reason                                        |
| -------------------------- | ---------------------- | --------------------------------------------- |
| `langgraph build`          | Custom `Dockerfile`    | Avoid licensed runtime                        |
| `langgraph_sdk.Auth`       | FastAPI `Depends()`    | LangGraph Auth is part of licensed SDK        |
| LangGraph server endpoints | Custom FastAPI routes  | We need our own `/runs`, `/threads` endpoints |
| `langgraph.json`           | `Dockerfile` + FastAPI | No longer using LangGraph CLI                 |

---

## New Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Docker Container                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    FastAPI Application                     │  │
│  │                                                            │  │
│  │  ┌─────────────────┐    ┌─────────────────────────────┐   │  │
│  │  │  Auth Middleware │    │     Graph Endpoints         │   │  │
│  │  │  (Supabase JWT)  │    │  POST /api/chat            │   │  │
│  │  │                  │    │  POST /api/chat/stream     │   │  │
│  │  └────────┬─────────┘    │  GET  /api/threads/{id}    │   │  │
│  │           │              │  DELETE /api/threads/{id}  │   │  │
│  │           │              └─────────────┬───────────────┘   │  │
│  │           │                            │                   │  │
│  │           └────────────────────────────┘                   │  │
│  │                            │                               │  │
│  │                            ▼                               │  │
│  │           ┌────────────────────────────────┐               │  │
│  │           │   LangGraph (MIT Licensed)     │               │  │
│  │           │   ┌──────────────────────┐     │               │  │
│  │           │   │  wellness.py graph   │     │               │  │
│  │           │   │  (StateGraph)        │     │               │  │
│  │           │   └──────────┬───────────┘     │               │  │
│  │           │              │                 │               │  │
│  │           │   ┌──────────▼───────────┐     │               │  │
│  │           │   │ AsyncPostgresSaver   │     │               │  │
│  │           │   │ (checkpointing)      │     │               │  │
│  │           │   └──────────────────────┘     │               │  │
│  │           └────────────────────────────────┘               │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────────┐   │  │
│  │  │              Existing Endpoints                      │   │  │
│  │  │  POST /api/meditation/generate                      │   │  │
│  │  │  POST /api/meditation/stream                        │   │  │
│  │  │  GET  /api/meditation/voices                        │   │  │
│  │  │  GET  /health                                       │   │  │
│  │  └─────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                    │                        │
                    ▼                        ▼
         ┌──────────────────┐    ┌──────────────────┐
         │    PostgreSQL    │    │      Redis       │
         │   (Supabase)     │    │   (Upstash)      │
         │                  │    │                  │
         │ • Checkpoints    │    │ • Embedding cache│
         │ • Messages       │    │ • Pub/sub        │
         │ • Memories       │    │                  │
         └──────────────────┘    └──────────────────┘
```

---

## Implementation Plan

### Phase 1: Create FastAPI Auth Middleware (Day 1)

Replace `langgraph_sdk.Auth` with standard FastAPI dependency injection.

**Create:** `src/api/auth.py`

```python
"""
FastAPI authentication middleware using Supabase JWT validation.
Replaces langgraph_sdk.Auth (which requires licensed runtime).
"""
import os
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, HTTPException, Header
from supabase import acreate_client


@dataclass
class AuthenticatedUser:
    """Authenticated user context available in all endpoints."""
    id: str
    email: str | None
    display_name: str | None
    preferences: dict


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None
) -> AuthenticatedUser:
    """
    FastAPI dependency that validates Supabase JWT tokens.

    Usage:
        @app.post("/api/chat")
        async def chat(user: AuthenticatedUser = Depends(get_current_user)):
            ...
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header"
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header format"
        )

    token = authorization[7:]

    # Validate against Supabase
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    supabase = await acreate_client(url, key)

    try:
        user_response = await supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = user_response.user

        # Fetch profile
        profile_response = await (
            supabase.table("profiles")
            .select("display_name, preferences")
            .eq("id", user.id)
            .single()
            .execute()
        )
        profile = profile_response.data or {}

        return AuthenticatedUser(
            id=user.id,
            email=user.email,
            display_name=profile.get("display_name"),
            preferences=profile.get("preferences", {})
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed") from e
```

---

### Phase 2: Create Graph API Endpoints (Day 1-2)

**Create:** `src/api/graph.py`

```python
"""
FastAPI endpoints for LangGraph conversation.
Replaces the licensed LangGraph server endpoints.
"""
import uuid
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, AIMessage
from pydantic import BaseModel

from src.api.auth import AuthenticatedUser, get_current_user
from src.graph.wellness import get_compiled_graph
from src.checkpointer import setup_checkpointer

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    """Request body for chat endpoint."""
    message: str
    thread_id: str | None = None


class ChatResponse(BaseModel):
    """Response from chat endpoint."""
    thread_id: str
    message: str
    activity: str | None = None


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user: AuthenticatedUser = Depends(get_current_user)
) -> ChatResponse:
    """
    Send a message and get a response (non-streaming).
    """
    thread_id = request.thread_id or str(uuid.uuid4())

    graph = await get_compiled_graph()

    config = {
        "configurable": {
            "thread_id": thread_id,
            "langgraph_auth_user": {
                "identity": user.id,
                "email": user.email,
                "display_name": user.display_name,
                "preferences": user.preferences,
            }
        }
    }

    result = await graph.ainvoke(
        {"messages": [HumanMessage(content=request.message)]},
        config=config
    )

    # Extract the last AI message
    messages = result.get("messages", [])
    ai_messages = [m for m in messages if isinstance(m, AIMessage)]
    response_text = ai_messages[-1].content if ai_messages else ""

    return ChatResponse(
        thread_id=thread_id,
        message=response_text,
        activity=result.get("suggested_activity")
    )


@router.post("/chat/stream")
async def chat_stream(
    request: ChatRequest,
    user: AuthenticatedUser = Depends(get_current_user)
) -> StreamingResponse:
    """
    Send a message and stream the response.
    Uses Server-Sent Events (SSE) format.
    """
    thread_id = request.thread_id or str(uuid.uuid4())

    async def generate() -> AsyncGenerator[str, None]:
        graph = await get_compiled_graph()

        config = {
            "configurable": {
                "thread_id": thread_id,
                "langgraph_auth_user": {
                    "identity": user.id,
                    "email": user.email,
                    "display_name": user.display_name,
                    "preferences": user.preferences,
                }
            }
        }

        # Stream tokens as they're generated
        async for event in graph.astream_events(
            {"messages": [HumanMessage(content=request.message)]},
            config=config,
            version="v2"
        ):
            if event["event"] == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if hasattr(chunk, "content") and chunk.content:
                    # SSE format
                    yield f"data: {chunk.content}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.get("/threads/{thread_id}/history")
async def get_thread_history(
    thread_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
) -> dict:
    """
    Get conversation history for a thread.
    """
    graph = await get_compiled_graph()

    config = {"configurable": {"thread_id": thread_id}}

    try:
        state = await graph.aget_state(config)
        messages = state.values.get("messages", [])

        return {
            "thread_id": thread_id,
            "messages": [
                {
                    "role": "user" if isinstance(m, HumanMessage) else "assistant",
                    "content": m.content
                }
                for m in messages
            ]
        }
    except Exception:
        raise HTTPException(status_code=404, detail="Thread not found")


@router.delete("/threads/{thread_id}")
async def delete_thread(
    thread_id: str,
    user: AuthenticatedUser = Depends(get_current_user)
) -> dict:
    """
    Delete a conversation thread.
    """
    # TODO: Implement deletion via checkpointer
    # For now, return success (checkpoints will expire or can be manually cleaned)
    return {"status": "deleted", "thread_id": thread_id}
```

---

### Phase 3: Update Main Application (Day 2)

**Update:** `src/api/server.py`

```python
"""
Main FastAPI application - Pure open-source LangGraph deployment.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.graph import router as graph_router
from src.api.meditation import router as meditation_router
from src.checkpointer import setup_checkpointer, cleanup_checkpointer


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    # Startup: Initialize checkpointer
    await setup_checkpointer()
    yield
    # Shutdown: Cleanup connections
    await cleanup_checkpointer()


app = FastAPI(
    title="Wbot AI API",
    description="Pure open-source LangGraph wellness chatbot",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(graph_router)
app.include_router(meditation_router)


@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "healthy", "service": "wbot-ai"}


@app.get("/")
async def root() -> dict:
    """Root endpoint."""
    return {
        "service": "wbot-ai",
        "version": "1.0.0",
        "docs": "/docs"
    }
```

---

### Phase 4: Create Custom Dockerfile (Day 2)

**Create:** `apps/ai/Dockerfile`

```dockerfile
# ============================================================================
# Wbot AI - Pure Open-Source LangGraph Deployment
# ============================================================================
# This Dockerfile creates a production image without any LangChain licensing.
# All components are MIT licensed.
# ============================================================================

FROM python:3.13-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install uv for fast dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-dev

# Copy application code
COPY src/ ./src/

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uv", "run", "uvicorn", "src.api.server:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### Phase 5: Update Docker Compose (Day 2)

**Update:** `apps/ai/docker-compose.self-hosted.yml`

```yaml
# ============================================================================
# Pure Open-Source LangGraph Deployment
# ============================================================================
# No LangChain licensing required. All MIT licensed components.
# ============================================================================

volumes:
  redis-data:
    driver: local

services:
  # Redis for pub/sub and caching
  langgraph-redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis-data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 5

  # Wbot AI API Server
  wbot-ai:
    build:
      context: .
      dockerfile: Dockerfile
    restart: unless-stopped
    ports:
      - '8123:8000'
    depends_on:
      langgraph-redis:
        condition: service_healthy
    env_file:
      - ../../.env
    environment:
      # Database (Supabase PostgreSQL)
      DATABASE_URI: ${DATABASE_URI}

      # Redis (local service)
      REDIS_URI: redis://langgraph-redis:6379

      # LLM API Keys
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      GOOGLE_API_KEY: ${GOOGLE_API_KEY}

      # Supabase (for auth validation)
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_SERVICE_KEY: ${SUPABASE_SERVICE_KEY}
      SUPABASE_DB_PASSWORD: ${SUPABASE_DB_PASSWORD}

      # Optional: LangSmith tracing (works without license)
      LANGSMITH_TRACING: ${LANGSMITH_TRACING:-false}
      LANGSMITH_API_KEY: ${LANGSMITH_API_KEY:-}
      LANGSMITH_PROJECT: ${LANGSMITH_PROJECT:-wbot-wellness}
```

---

### Phase 6: Update Package Scripts (Day 2)

**Update:** `package.json` scripts

```json
{
  "scripts": {
    "ai:build": "cd apps/ai && docker build -t wbot-ai:latest .",
    "ai:build:fresh": "cd apps/ai && docker build --no-cache -t wbot-ai:latest .",
    "ai:up": "cd apps/ai && docker-compose -f docker-compose.self-hosted.yml up -d",
    "ai:down": "cd apps/ai && docker-compose -f docker-compose.self-hosted.yml down",
    "ai:logs": "cd apps/ai && docker-compose -f docker-compose.self-hosted.yml logs -f wbot-ai",
    "ai:restart": "cd apps/ai && docker-compose -f docker-compose.self-hosted.yml restart wbot-ai"
  }
}
```

---

### Phase 7: Update Frontend Client (Day 3)

The frontend currently uses `@langchain/langgraph-sdk`. We need to update it to use standard fetch/axios calls.

**Update:** `apps/web/src/lib/ai-client.ts`

```typescript
/**
 * AI Client - Direct API calls to self-hosted LangGraph
 * Replaces @langchain/langgraph-sdk for pure open-source deployment.
 */

const API_URL = import.meta.env.VITE_LANGGRAPH_API_URL;

interface ChatRequest {
  message: string;
  thread_id?: string;
}

interface ChatResponse {
  thread_id: string;
  message: string;
  activity?: string;
}

export async function sendMessage(request: ChatRequest, token: string): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Chat failed: ${response.statusText}`);
  }

  return response.json();
}

export async function* streamMessage(request: ChatRequest, token: string): AsyncGenerator<string> {
  const response = await fetch(`${API_URL}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Stream failed: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error('No response body');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        yield data;
      }
    }
  }
}

export async function getThreadHistory(
  threadId: string,
  token: string
): Promise<{ messages: Array<{ role: string; content: string }> }> {
  const response = await fetch(`${API_URL}/api/threads/${threadId}/history`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get history: ${response.statusText}`);
  }

  return response.json();
}
```

---

### Phase 8: Remove Licensed Dependencies (Day 3)

**Update:** `apps/ai/pyproject.toml`

Remove or comment out:

```toml
# REMOVE these (licensed runtime dependencies):
# "langgraph-cli[inmem]>=0.4.11",

# KEEP these (MIT licensed):
"langgraph>=1.0.5",
"langgraph-checkpoint-postgres>=3.0.2",
```

**Delete:** `apps/ai/langgraph.json` (no longer needed)

---

## File Changes Summary

| Action     | File                             | Notes                   |
| ---------- | -------------------------------- | ----------------------- |
| **Create** | `src/api/auth.py`                | FastAPI auth middleware |
| **Create** | `src/api/graph.py`               | Chat endpoints          |
| **Create** | `Dockerfile`                     | Custom Docker build     |
| **Update** | `src/api/server.py`              | Main FastAPI app        |
| **Update** | `docker-compose.self-hosted.yml` | Remove licensed image   |
| **Update** | `pyproject.toml`                 | Remove langgraph-cli    |
| **Update** | `package.json`                   | New build scripts       |
| **Update** | `apps/web/src/lib/ai-client.ts`  | Direct API calls        |
| **Delete** | `langgraph.json`                 | No longer needed        |

---

## Testing Plan

### Unit Tests

1. Test auth middleware with valid/invalid tokens
2. Test chat endpoint with mocked graph
3. Test streaming endpoint format

### Integration Tests

1. Full chat flow with real graph
2. Thread persistence across requests
3. Memory retrieval in conversations

### E2E Tests

1. Frontend → Backend chat flow
2. Streaming responses render correctly
3. Thread history loads properly

---

## Migration Checklist

- [ ] Create `src/api/auth.py` with FastAPI auth
- [ ] Create `src/api/graph.py` with chat endpoints
- [ ] Update `src/api/server.py` with new routers
- [ ] Create `Dockerfile` for custom build
- [ ] Update `docker-compose.self-hosted.yml`
- [ ] Update `package.json` scripts
- [ ] Remove `langgraph-cli` from `pyproject.toml`
- [ ] Delete `langgraph.json`
- [ ] Update frontend `ai-client.ts`
- [ ] Test locally with `docker-compose up`
- [ ] Verify auth works with Supabase tokens
- [ ] Verify streaming works in frontend
- [ ] Deploy to production

---

## Cost Comparison

| Item                     | Licensed Approach        | Pure OSS         |
| ------------------------ | ------------------------ | ---------------- |
| LangGraph License        | $39+/month or Enterprise | **$0**           |
| Supabase (existing)      | ~$25/month               | ~$25/month       |
| Upstash Redis (existing) | ~$0-10/month             | ~$0-10/month     |
| Hosting (Railway/Fly)    | ~$5-20/month             | ~$5-20/month     |
| **Total**                | **$69-100+/month**       | **$30-55/month** |

---

## Risks and Mitigations

| Risk                              | Mitigation                                         |
| --------------------------------- | -------------------------------------------------- |
| No LangGraph Studio for debugging | Use LangSmith tracing (free tier) or local logging |
| No built-in background task queue | Implement with Redis + asyncio if needed           |
| More code to maintain             | Well-documented, modular design                    |
| Missing future LangGraph features | Can add individually as MIT components             |

---

## Timeline

| Phase              | Duration  | Dependencies |
| ------------------ | --------- | ------------ |
| 1. Auth Middleware | 2-3 hours | None         |
| 2. Graph Endpoints | 3-4 hours | Phase 1      |
| 3. Update Server   | 1 hour    | Phase 2      |
| 4. Dockerfile      | 1-2 hours | Phase 3      |
| 5. Docker Compose  | 30 min    | Phase 4      |
| 6. Package Scripts | 15 min    | Phase 5      |
| 7. Frontend Client | 2-3 hours | Phase 5      |
| 8. Cleanup & Test  | 2-3 hours | All          |

**Total: ~2-3 days of focused work**

---

## Next Steps

1. Review this plan and confirm approach
2. Start with Phase 1 (auth middleware)
3. Test each phase before moving to next
4. Deploy to staging before production

---

_Created: January 5, 2026_
_Status: Ready for implementation_
