"""
Environment loading utilities.

This monorepo keeps a single `.env` at the repository root. LangGraph is also
configured (via langgraph.json) to load that file, but we additionally load it
here so any direct Python execution/imports behave consistently.
"""

from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv


def _find_monorepo_root(start: Path) -> Path:
    for p in (start, *start.parents):
        if (p / "pnpm-workspace.yaml").exists():
            return p
    # Fallback: if the marker isn't found, behave like "local to this file"
    return start.parent


def load_monorepo_dotenv(*, override: bool = False) -> Path | None:
    """
    Loads the monorepo root `.env` file into process environment, if present.

    Args:
        override: If True, values from `.env` override existing environment vars.

    Returns:
        The path to the loaded `.env`, or None if no `.env` was found.
    """
    root = _find_monorepo_root(Path(__file__).resolve())
    env_path = root / ".env"

    if not env_path.exists():
        return None

    load_dotenv(env_path, override=override)
    return env_path
