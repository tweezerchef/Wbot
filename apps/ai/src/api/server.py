"""
============================================================================
Wbot AI API Server - Pure Open-Source LangGraph Deployment
============================================================================
Main FastAPI application for the Wbot AI backend.
This replaces the licensed LangGraph server with a pure OSS deployment.

Endpoints:
- POST /api/chat - Non-streaming chat
- POST /api/chat/stream - SSE streaming chat with HITL support
- POST /api/chat/resume - Resume interrupted graph (HITL)
- GET /api/threads/{thread_id}/history - Get conversation history
- DELETE /api/threads/{thread_id} - Delete thread
- POST /api/meditation/generate - Generate personalized meditation via TTS
- POST /api/meditation/stream - Stream audio as it's generated
- POST /api/meditation/generate-ai - Generate AI meditation with streaming
- GET /api/meditation/voices - Get available voices
- POST /api/meditation/generated/{id}/complete - Mark meditation complete
- GET /health - Health check

Usage:
    # Development (with hot-reload):
    uv run uvicorn src.api.server:app --reload --port 2024

    # Production (via Docker):
    uv run uvicorn src.api.server:app --host 0.0.0.0 --port 8000

    # Endpoints available at:
    # http://localhost:2024/api/chat
    # http://localhost:2024/api/chat/stream
    # http://localhost:2024/api/meditation/*
    # http://localhost:2024/docs (OpenAPI documentation)
============================================================================
"""

import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.graph import router as graph_router
from src.api.meditation import router as meditation_router
from src.checkpointer import cleanup_checkpointer, setup_checkpointer
from src.logging_config import NodeLogger

logger = NodeLogger("server")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifecycle management.

    Startup:
    - Initialize PostgreSQL checkpointer
    - Create checkpoint tables if needed (idempotent)

    Shutdown:
    - Close checkpointer connection pool
    """
    logger.info("Starting Wbot AI API server")

    # Initialize checkpointer (creates tables if needed)
    await setup_checkpointer()
    logger.info("Checkpointer initialized")

    yield

    # Cleanup on shutdown
    await cleanup_checkpointer()
    logger.info("Server shutdown complete")


app = FastAPI(
    title="Wbot AI API",
    description="Pure open-source LangGraph wellness chatbot API",
    version="1.0.0",
    lifespan=lifespan,
)


# CORS middleware configuration
# In production, restrict to your frontend domain
allowed_origins = os.getenv("CORS_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Include routers
app.include_router(graph_router)
app.include_router(meditation_router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """
    Health check endpoint.

    Returns service status for container orchestration
    and load balancer health checks.
    """
    return {"status": "healthy", "service": "wbot-ai"}


@app.get("/")
async def root() -> dict[str, str]:
    """
    Root endpoint with API information.

    Provides service info and link to OpenAPI docs.
    """
    return {
        "service": "wbot-ai",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }
