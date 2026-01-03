"""
Wbot AI Backend

This package contains the LangGraph-based AI backend for the wellness chatbot.
"""

from src.env import load_monorepo_dotenv

# Load the monorepo root `.env` for local/dev execution.
# This does not override already-set environment variables.
load_monorepo_dotenv()

# Note: Logging is automatically configured when src.logging_config is imported
# by any module. No need to configure it here to avoid circular imports.
