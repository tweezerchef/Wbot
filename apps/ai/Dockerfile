# ============================================================================
# Wbot AI - Pure Open-Source LangGraph Deployment
# ============================================================================
# Custom Docker image without licensed LangGraph runtime.
# All components are MIT licensed.
#
# Build: docker build -t wbot-ai:latest .
# Run: docker run -p 8000:8000 --env-file ../../.env wbot-ai:latest
# ============================================================================

# Base image: Python 3.13 slim (matches project requirements)
FROM python:3.13-slim AS base

# Install system dependencies
# - ffmpeg: Required for meditation audio processing (pydub)
# - curl: Required for health check
# - build-essential, libpq-dev: Required for psycopg compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install uv for fast, reproducible dependency management
# Using the official image copy pattern (recommended by Astral)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# Copy only dependency files first (for better caching)
COPY pyproject.toml uv.lock ./

# Install dependencies (production only, no dev deps)
# --frozen ensures lockfile is respected exactly
RUN uv sync --frozen --no-dev

# Copy application source code
COPY src/ ./src/

# Environment configuration
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1

# Expose the API port
EXPOSE 8000

# Health check - calls our /health endpoint
# Start period of 30s gives time for checkpointer initialization
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run FastAPI with uvicorn
# --host 0.0.0.0 makes it accessible outside container
# --port 8000 matches EXPOSE
# Single worker is fine for LangGraph (graph execution is async)
CMD ["uv", "run", "uvicorn", "src.api.server:app", "--host", "0.0.0.0", "--port", "8000"]
