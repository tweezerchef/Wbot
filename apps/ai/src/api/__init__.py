"""
============================================================================
API Module
============================================================================
HTTP API endpoints for non-conversational operations like TTS generation.

These endpoints are designed to be mounted on a FastAPI or similar server.
============================================================================
"""

from src.api.meditation import router as meditation_router

__all__ = ["meditation_router"]
