"""
============================================================================
Checkpointer Module - PostgreSQL Persistence for LangGraph
============================================================================
Provides a PostgreSQL-backed checkpointer for persisting conversation state.

Uses the official langgraph-checkpoint-postgres package to store:
- Checkpoint data (conversation state snapshots)
- Checkpoint blobs (large channel values)
- Checkpoint writes (pending/intermediate writes)

Connects to Supabase PostgreSQL using the connection pooler.

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
from psycopg_pool import AsyncConnectionPool

from src.env import load_monorepo_dotenv
from src.logging_config import NodeLogger

# Load environment variables from monorepo root
load_monorepo_dotenv()

logger = NodeLogger("checkpointer")

# Module-level instances (singleton pattern)
_pool: AsyncConnectionPool | None = None
_checkpointer: AsyncPostgresSaver | None = None
_initialized: bool = False


def get_database_uri() -> str:
    """
    Gets the PostgreSQL connection URI for Supabase.

    Uses the DATABASE_URI environment variable directly, which should be
    the Supabase pooler connection string from:
    Supabase Dashboard > Settings > Database > Connection string > URI

    Format:
        postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

    Returns:
        PostgreSQL connection URI string.

    Raises:
        ValueError: If DATABASE_URI is not set.
    """
    database_uri = os.getenv("DATABASE_URI")

    if not database_uri:
        raise ValueError(
            "DATABASE_URI environment variable is required. "
            "Copy the 'Connection pooling' URI from Supabase Dashboard > "
            "Settings > Database > Connection string"
        )

    return database_uri


async def get_checkpointer() -> AsyncPostgresSaver:
    """
    Gets or creates the singleton AsyncPostgresSaver instance.

    The checkpointer uses a connection pool that's configured to work
    with Supabase's connection pooler (Supavisor).

    Returns:
        Configured AsyncPostgresSaver instance.

    Note:
        Call setup_checkpointer() once at application startup to initialize tables.
    """
    global _pool, _checkpointer

    if _checkpointer is None:
        database_uri = get_database_uri()
        logger.info("Creating PostgreSQL checkpointer")

        # Create a connection pool with settings optimized for Supabase pooler
        # - min_size=1: Keep at least one connection ready
        # - max_size=10: Limit concurrent connections
        # - open=False: Prevent deprecated auto-open in constructor
        # - kwargs: Pass connection options for SSL and keepalive
        _pool = AsyncConnectionPool(
            conninfo=database_uri,
            min_size=1,
            max_size=10,
            open=False,  # Avoid deprecation warning, open explicitly below
            kwargs={
                "autocommit": True,
                "prepare_threshold": 0,  # Disable prepared statements (required for pgbouncer/supavisor)
            },
        )
        await _pool.open()
        logger.info("Connection pool opened")

        # Create checkpointer with the pool
        _checkpointer = AsyncPostgresSaver(conn=_pool)

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
    global _pool, _checkpointer, _initialized

    if _pool is not None:
        logger.info("Closing checkpointer connection pool")
        await _pool.close()
        _pool = None
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
