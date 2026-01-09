"""
============================================================================
Tests for Checkpointer Module
============================================================================
Tests PostgreSQL checkpointer initialization, configuration, and lifecycle.

Tests:
- get_database_uri(): Connection URI construction from environment variables
- get_checkpointer(): Singleton checkpointer instance creation
- setup_checkpointer(): Idempotent table initialization
- cleanup_checkpointer(): Resource cleanup
- checkpointer_lifespan(): Context manager lifecycle
============================================================================
"""

from unittest.mock import AsyncMock, patch

import pytest

# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture
def mock_checkpointer_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Set up mock environment variables for checkpointer tests."""
    # The new implementation uses DATABASE_URI directly
    monkeypatch.setenv(
        "DATABASE_URI",
        "postgresql://postgres.test-project:test-db-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
    )
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "test-service-key")


@pytest.fixture
def reset_checkpointer_state() -> None:
    """Reset the module-level checkpointer state before each test."""
    import src.checkpointer as cp

    cp._pool = None
    cp._checkpointer = None
    cp._initialized = False
    yield
    # Cleanup after test
    cp._pool = None
    cp._checkpointer = None
    cp._initialized = False


# =============================================================================
# get_database_uri() Tests
# =============================================================================


def test_get_database_uri_returns_env_var(mock_checkpointer_env: None) -> None:
    """get_database_uri() should return the DATABASE_URI environment variable as-is."""
    from src.checkpointer import get_database_uri

    uri = get_database_uri()

    # Should return the exact DATABASE_URI value from the fixture
    expected = "postgresql://postgres.test-project:test-db-password@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
    assert uri == expected


def test_get_database_uri_raises_without_database_uri(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """get_database_uri() should raise ValueError if DATABASE_URI is missing."""
    monkeypatch.delenv("DATABASE_URI", raising=False)

    from src.checkpointer import get_database_uri

    with pytest.raises(ValueError) as exc_info:
        get_database_uri()

    assert "DATABASE_URI" in str(exc_info.value)


# =============================================================================
# get_checkpointer() Tests
# =============================================================================


@pytest.mark.asyncio
async def test_get_checkpointer_creates_singleton(
    mock_checkpointer_env: None,
    reset_checkpointer_state: None,
) -> None:
    """get_checkpointer() should return the same instance on multiple calls."""
    with (
        patch("src.checkpointer.AsyncConnectionPool") as mock_pool_class,
        patch("src.checkpointer.AsyncPostgresSaver") as mock_saver_class,
    ):
        # Setup mock pool
        mock_pool = AsyncMock()
        mock_pool.open = AsyncMock()
        mock_pool_class.return_value = mock_pool

        # Setup mock saver
        mock_saver = AsyncMock()
        mock_saver_class.return_value = mock_saver

        from src.checkpointer import get_checkpointer

        # Get checkpointer twice
        first = await get_checkpointer()
        second = await get_checkpointer()

        # Should be the same instance
        assert first is second
        # Should only create pool once
        assert mock_pool_class.call_count == 1


@pytest.mark.asyncio
async def test_get_checkpointer_uses_correct_uri(
    mock_checkpointer_env: None,
    reset_checkpointer_state: None,
) -> None:
    """get_checkpointer() should use the URI from get_database_uri()."""
    with (
        patch("src.checkpointer.AsyncConnectionPool") as mock_pool_class,
        patch("src.checkpointer.AsyncPostgresSaver") as mock_saver_class,
    ):
        # Setup mock pool
        mock_pool = AsyncMock()
        mock_pool.open = AsyncMock()
        mock_pool_class.return_value = mock_pool

        # Setup mock saver
        mock_saver = AsyncMock()
        mock_saver_class.return_value = mock_saver

        from src.checkpointer import get_checkpointer

        await get_checkpointer()

        # Verify AsyncConnectionPool was called with correct URI
        call_kwargs = mock_pool_class.call_args
        conninfo = call_kwargs.kwargs.get("conninfo")
        assert "postgres.test-project" in conninfo
        assert "test-db-password" in conninfo


# =============================================================================
# setup_checkpointer() Tests
# =============================================================================


@pytest.mark.asyncio
async def test_setup_checkpointer_calls_setup(
    mock_checkpointer_env: None,
    reset_checkpointer_state: None,
) -> None:
    """setup_checkpointer() should call checkpointer.setup()."""
    with (
        patch("src.checkpointer.AsyncConnectionPool") as mock_pool_class,
        patch("src.checkpointer.AsyncPostgresSaver") as mock_saver_class,
    ):
        # Setup mock pool
        mock_pool = AsyncMock()
        mock_pool.open = AsyncMock()
        mock_pool_class.return_value = mock_pool

        # Setup mock saver
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_saver_class.return_value = mock_saver

        from src.checkpointer import setup_checkpointer

        await setup_checkpointer()

        # Verify setup was called
        mock_saver.setup.assert_called_once()


@pytest.mark.asyncio
async def test_setup_checkpointer_is_idempotent(
    mock_checkpointer_env: None,
    reset_checkpointer_state: None,
) -> None:
    """setup_checkpointer() should only run setup once (idempotent)."""
    with (
        patch("src.checkpointer.AsyncConnectionPool") as mock_pool_class,
        patch("src.checkpointer.AsyncPostgresSaver") as mock_saver_class,
    ):
        # Setup mock pool
        mock_pool = AsyncMock()
        mock_pool.open = AsyncMock()
        mock_pool_class.return_value = mock_pool

        # Setup mock saver
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_saver_class.return_value = mock_saver

        from src.checkpointer import setup_checkpointer

        # Call setup multiple times
        await setup_checkpointer()
        await setup_checkpointer()
        await setup_checkpointer()

        # Should only call setup once
        assert mock_saver.setup.call_count == 1


# =============================================================================
# cleanup_checkpointer() Tests
# =============================================================================


@pytest.mark.asyncio
async def test_cleanup_checkpointer_closes_connection(
    mock_checkpointer_env: None,
    reset_checkpointer_state: None,
) -> None:
    """cleanup_checkpointer() should close the connection pool."""
    with (
        patch("src.checkpointer.AsyncConnectionPool") as mock_pool_class,
        patch("src.checkpointer.AsyncPostgresSaver") as mock_saver_class,
    ):
        # Setup mock pool
        mock_pool = AsyncMock()
        mock_pool.open = AsyncMock()
        mock_pool.close = AsyncMock()
        mock_pool_class.return_value = mock_pool

        # Setup mock saver
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_saver_class.return_value = mock_saver

        from src.checkpointer import cleanup_checkpointer, setup_checkpointer

        # Setup first
        await setup_checkpointer()

        # Then cleanup
        await cleanup_checkpointer()

        # Verify pool.close() was called
        mock_pool.close.assert_called_once()


@pytest.mark.asyncio
async def test_cleanup_checkpointer_resets_state(
    mock_checkpointer_env: None,
    reset_checkpointer_state: None,
) -> None:
    """cleanup_checkpointer() should reset module state."""
    with (
        patch("src.checkpointer.AsyncConnectionPool") as mock_pool_class,
        patch("src.checkpointer.AsyncPostgresSaver") as mock_saver_class,
    ):
        # Setup mock pool
        mock_pool = AsyncMock()
        mock_pool.open = AsyncMock()
        mock_pool.close = AsyncMock()
        mock_pool_class.return_value = mock_pool

        # Setup mock saver
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_saver_class.return_value = mock_saver

        import src.checkpointer as cp
        from src.checkpointer import cleanup_checkpointer, setup_checkpointer

        # Setup first
        await setup_checkpointer()
        assert cp._initialized is True
        assert cp._checkpointer is not None

        # Cleanup
        await cleanup_checkpointer()

        # State should be reset
        assert cp._initialized is False
        assert cp._checkpointer is None


@pytest.mark.asyncio
async def test_cleanup_checkpointer_handles_not_initialized(
    reset_checkpointer_state: None,
) -> None:
    """cleanup_checkpointer() should handle being called when not initialized."""
    from src.checkpointer import cleanup_checkpointer

    # Should not raise
    await cleanup_checkpointer()


# =============================================================================
# checkpointer_lifespan() Tests
# =============================================================================


@pytest.mark.asyncio
async def test_checkpointer_lifespan_yields_checkpointer(
    mock_checkpointer_env: None,
    reset_checkpointer_state: None,
) -> None:
    """checkpointer_lifespan() should yield a working checkpointer."""
    with (
        patch("src.checkpointer.AsyncConnectionPool") as mock_pool_class,
        patch("src.checkpointer.AsyncPostgresSaver") as mock_saver_class,
    ):
        # Setup mock pool
        mock_pool = AsyncMock()
        mock_pool.open = AsyncMock()
        mock_pool.close = AsyncMock()
        mock_pool_class.return_value = mock_pool

        # Setup mock saver
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_saver_class.return_value = mock_saver

        from src.checkpointer import checkpointer_lifespan

        async with checkpointer_lifespan() as checkpointer:
            # Should yield the mock saver
            assert checkpointer is mock_saver


@pytest.mark.asyncio
async def test_checkpointer_lifespan_cleans_up_on_exit(
    mock_checkpointer_env: None,
    reset_checkpointer_state: None,
) -> None:
    """checkpointer_lifespan() should cleanup on context exit."""
    with (
        patch("src.checkpointer.AsyncConnectionPool") as mock_pool_class,
        patch("src.checkpointer.AsyncPostgresSaver") as mock_saver_class,
    ):
        # Setup mock pool
        mock_pool = AsyncMock()
        mock_pool.open = AsyncMock()
        mock_pool.close = AsyncMock()
        mock_pool_class.return_value = mock_pool

        # Setup mock saver
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_saver_class.return_value = mock_saver

        import src.checkpointer as cp
        from src.checkpointer import checkpointer_lifespan

        async with checkpointer_lifespan():
            # Inside context, should be initialized
            assert cp._initialized is True

        # After context, should be cleaned up
        assert cp._initialized is False
        mock_pool.close.assert_called_once()


@pytest.mark.asyncio
async def test_checkpointer_lifespan_cleans_up_on_exception(
    mock_checkpointer_env: None,
    reset_checkpointer_state: None,
) -> None:
    """checkpointer_lifespan() should cleanup even if exception is raised."""
    with (
        patch("src.checkpointer.AsyncConnectionPool") as mock_pool_class,
        patch("src.checkpointer.AsyncPostgresSaver") as mock_saver_class,
    ):
        # Setup mock pool
        mock_pool = AsyncMock()
        mock_pool.open = AsyncMock()
        mock_pool.close = AsyncMock()
        mock_pool_class.return_value = mock_pool

        # Setup mock saver
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_saver_class.return_value = mock_saver

        import src.checkpointer as cp
        from src.checkpointer import checkpointer_lifespan

        with pytest.raises(ValueError):
            async with checkpointer_lifespan():
                raise ValueError("Test exception")

        # Should still cleanup
        assert cp._initialized is False
        mock_pool.close.assert_called_once()
