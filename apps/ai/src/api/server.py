"""
============================================================================
Custom HTTP Endpoints for LangGraph
============================================================================
FastAPI app that extends the LangGraph server with custom endpoints.

This app is mounted within the LangGraph server via the "http" config
in langgraph.json. All routes here are available alongside the standard
LangGraph API endpoints.

Endpoints:
- POST /api/meditation/generate - Generate personalized meditation via TTS
- POST /api/meditation/cache-check - Check if cached audio exists
- POST /api/meditation/stream - Stream audio as it's generated
- POST /api/meditation/generate-ai - Generate AI meditation with parallel streaming
- GET /api/meditation/voices - Get available voices for AI meditation
- POST /api/meditation/generated/{id}/complete - Mark AI meditation complete
- GET /health - Health check

Usage:
    # Runs automatically with LangGraph:
    pnpm dev:ai
    # or
    uv run langgraph dev

    # Endpoints available at:
    # http://localhost:2024/api/meditation/generate
    # http://localhost:2024/api/meditation/stream
    # http://localhost:2024/api/meditation/generate-ai
    # http://localhost:2024/api/meditation/voices
============================================================================
"""

from fastapi import FastAPI

from src.api.meditation import router as meditation_router

# Create FastAPI app
# Note: LangGraph handles CORS, so we don't need to add middleware here
app = FastAPI(
    title="Wbot Custom API",
    description="Custom endpoints for meditation TTS generation",
    version="1.0.0",
)

# Include meditation router
app.include_router(meditation_router)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy", "service": "meditation-api"}
