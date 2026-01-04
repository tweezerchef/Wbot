"""
============================================================================
Checkpointer Module - PostgreSQL Persistence for LangGraph
============================================================================
Provides a PostgreSQL-backed checkpointer for persisting conversation state.

Uses the official langgraph-checkpoint-postgres package to store:
- Checkpoint data (conversation state snapshots)
- Checkpoint blobs (large channel values)
- Checkpoint writes (pending/intermediate writes)

Connects to Supabase PostgreSQL using the direct connection string
(not the pooler) since the checkpointer manages its own connection pool.

Usage:
    # At application startup
    await setup_checkpointer()

    # Get checkpointer for graph compilation
    checkpointer = await get_checkpointer()
    graph = build_graph().compile(checkpointer=checkpointer)

    # At application shutdown
    await cleanup_checkpointer()
============================================================================
"""

import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

from src.env import load_monorepo_dotenv
from src.logging_config import NodeLogger

# Load environment variables from monorepo root
load_monorepo_dotenv()

logger = NodeLogger("checkpointer")

# Module-level checkpointer instance (singleton pattern)
_checkpointer: AsyncPostgresSaver | None = None
_initialized: bool = False


def get_database_uri() -> str:
    """
    Constructs the PostgreSQL connection URI for Supabase.

    Uses direct connection (port 5432) rather than pooler (port 6543)
    because AsyncPostgresSaver manages its own connection pool internally.

    The connection format is:
        postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres

    Returns:
        PostgreSQL connection URI string.

    Raises:
        ValueError: If required environment variables are missing.
    """
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    db_password = os.getenv("SUPABASE_DB_PASSWORD")

    if not supabase_url:
        raise ValueError(
            "SUPABASE_URL environment variable is required. "
            "This should be your Supabase project URL (e.g., https://xxx.supabase.co)"
        )

    if not db_password:
        raise ValueError(
            "SUPABASE_DB_PASSWORD environment variable is required for checkpointing. "
            "Get this from: Supabase Dashboard > Settings > Database > Connection string"
        )

    # Extract project reference from URL
    # Format: https://[project-ref].supabase.co
    project_ref = supabase_url.replace("https://", "").replace(".supabase.co", "")

    # Construct direct connection URI (not pooler)
    # Direct connection is recommended for server-side apps with connection pooling
    # The checkpointer manages its own pool, so we use the direct host
    database_uri = (
        f"postgresql://postgres.{project_ref}:{db_password}"
        f"@db.{project_ref}.supabase.co:5432/postgres"
        f"?sslmode=require"
    )

    return database_uri


async def get_checkpointer() -> AsyncPostgresSaver:
    """
    Gets or creates the singleton AsyncPostgresSaver instance.

    The checkpointer is created once and reused across all graph executions.
    It manages its own connection pool internally.

    Returns:
        Configured AsyncPostgresSaver instance.

    Note:
        Call setup_checkpointer() once at application startup to initialize tables.
    """
    global _checkpointer

    if _checkpointer is None:
        database_uri = get_database_uri()
        logger.info("Creating PostgreSQL checkpointer")

        # Create checkpointer with connection string
        # AsyncPostgresSaver manages its own connection pool
        _checkpointer = await AsyncPostgresSaver.from_conn_string(database_uri).__aenter__()

    return _checkpointer


async def setup_checkpointer() -> None:
    """
    Initializes the checkpointer and creates required database tables.

    This MUST be called once at application startup. It:
    1. Creates checkpoint tables if they don't exist
    2. Runs any pending migrations

    Safe to call multiple times - migrations are idempotent.

    Tables created:
    - checkpoints: Main checkpoint data
    - checkpoint_blobs: Large channel values (stored separately)
    - checkpoint_writes: Pending/intermediate writes
    - checkpoint_migrations: Schema version tracking
    """
    global _initialized

    if _initialized:
        return

    logger.info("Setting up checkpoint tables")
    checkpointer = await get_checkpointer()
    await checkpointer.setup()
    _initialized = True
    logger.info("Checkpoint tables ready")


async def cleanup_checkpointer() -> None:
    """
    Closes the checkpointer connection pool.

    Call this during application shutdown for clean resource cleanup.
    """
    global _checkpointer, _initialized

    if _checkpointer is not None:
        logger.info("Closing checkpointer connection pool")
        await _checkpointer.__aexit__(None, None, None)
        _checkpointer = None
        _initialized = False


@asynccontextmanager
async def checkpointer_lifespan() -> AsyncGenerator[AsyncPostgresSaver, None]:
    """
    Async context manager for checkpointer lifecycle.

    Use this for proper setup and cleanup:

        async with checkpointer_lifespan() as checkpointer:
            graph = build_graph().compile(checkpointer=checkpointer)
            # ... run application ...

    Yields:
        Configured AsyncPostgresSaver instance.
    """
    try:
        await setup_checkpointer()
        yield await get_checkpointer()
    finally:
        await cleanup_checkpointer()
