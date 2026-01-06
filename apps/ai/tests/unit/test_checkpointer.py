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
    monkeypatch.setenv("SUPABASE_URL", "https://test-project.supabase.co")
    monkeypatch.setenv("SUPABASE_DB_PASSWORD", "test-db-password")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "test-service-key")


@pytest.fixture
def reset_checkpointer_state() -> None:
    """Reset the module-level checkpointer state before each test."""
    import src.checkpointer as cp

    cp._checkpointer = None
    cp._initialized = False
    yield
    # Cleanup after test
    cp._checkpointer = None
    cp._initialized = False


# =============================================================================
# get_database_uri() Tests
# =============================================================================


def test_get_database_uri_constructs_correct_format(mock_checkpointer_env: None) -> None:
    """get_database_uri() should construct a valid PostgreSQL connection URI."""
    from src.checkpointer import get_database_uri

    uri = get_database_uri()

    # Should contain the project reference extracted from SUPABASE_URL
    assert "postgres.test-project" in uri
    assert "test-db-password" in uri
    assert "db.test-project.supabase.co" in uri
    assert ":5432" in uri  # Direct connection port
    assert "sslmode=require" in uri


def test_get_database_uri_uses_direct_connection_port(mock_checkpointer_env: None) -> None:
    """get_database_uri() should use port 5432 (direct), not 6543 (pooler)."""
    from src.checkpointer import get_database_uri

    uri = get_database_uri()

    assert ":5432" in uri
    assert ":6543" not in uri  # Should NOT use pooler port


def test_get_database_uri_raises_without_supabase_url(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """get_database_uri() should raise ValueError if SUPABASE_URL is missing."""
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.setenv("SUPABASE_DB_PASSWORD", "test-password")

    from src.checkpointer import get_database_uri

    with pytest.raises(ValueError) as exc_info:
        get_database_uri()

    assert "SUPABASE_URL" in str(exc_info.value)


def test_get_database_uri_raises_without_db_password(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """get_database_uri() should raise ValueError if SUPABASE_DB_PASSWORD is missing."""
    monkeypatch.setenv("SUPABASE_URL", "https://test-project.supabase.co")
    monkeypatch.delenv("SUPABASE_DB_PASSWORD", raising=False)

    from src.checkpointer import get_database_uri

    with pytest.raises(ValueError) as exc_info:
        get_database_uri()

    assert "SUPABASE_DB_PASSWORD" in str(exc_info.value)


def test_get_database_uri_extracts_project_ref_correctly(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """get_database_uri() should correctly extract project ref from various URL formats."""
    monkeypatch.setenv("SUPABASE_URL", "https://my-complex-project-123.supabase.co")
    monkeypatch.setenv("SUPABASE_DB_PASSWORD", "password123")

    from src.checkpointer import get_database_uri

    uri = get_database_uri()

    assert "postgres.my-complex-project-123" in uri
    assert "db.my-complex-project-123.supabase.co" in uri


# =============================================================================
# get_checkpointer() Tests
# =============================================================================


@pytest.mark.asyncio
async def test_get_checkpointer_creates_singleton(
    mock_checkpointer_env: None,
    reset_checkpointer_state: None,
) -> None:
    """get_checkpointer() should return the same instance on multiple calls."""
    with patch("src.checkpointer.AsyncPostgresSaver.from_conn_string") as mock_from_conn:
        # Setup mock
        mock_saver = AsyncMock()
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_saver)
        mock_from_conn.return_value = mock_context

        from src.checkpointer import get_checkpointer

        # Get checkpointer twice
        first = await get_checkpointer()
        second = await get_checkpointer()

        # Should be the same instance
        assert first is second
        # Should only create once
        assert mock_from_conn.call_count == 1


@pytest.mark.asyncio
async def test_get_checkpointer_uses_correct_uri(
    mock_checkpointer_env: None,
    reset_checkpointer_state: None,
) -> None:
    """get_checkpointer() should use the URI from get_database_uri()."""
    with patch("src.checkpointer.AsyncPostgresSaver.from_conn_string") as mock_from_conn:
        # Setup mock
        mock_saver = AsyncMock()
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_saver)
        mock_from_conn.return_value = mock_context

        from src.checkpointer import get_checkpointer

        await get_checkpointer()

        # Verify from_conn_string was called with correct URI
        call_args = mock_from_conn.call_args[0][0]
        assert "postgres.test-project" in call_args
        assert "test-db-password" in call_args


# =============================================================================
# setup_checkpointer() Tests
# =============================================================================


@pytest.mark.asyncio
async def test_setup_checkpointer_calls_setup(
    mock_checkpointer_env: None,
    reset_checkpointer_state: None,
) -> None:
    """setup_checkpointer() should call checkpointer.setup()."""
    with patch("src.checkpointer.AsyncPostgresSaver.from_conn_string") as mock_from_conn:
        # Setup mock
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_saver)
        mock_from_conn.return_value = mock_context

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
    with patch("src.checkpointer.AsyncPostgresSaver.from_conn_string") as mock_from_conn:
        # Setup mock
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_saver)
        mock_from_conn.return_value = mock_context

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
    with patch("src.checkpointer.AsyncPostgresSaver.from_conn_string") as mock_from_conn:
        # Setup mock
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_saver.__aexit__ = AsyncMock()
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_saver)
        mock_from_conn.return_value = mock_context

        from src.checkpointer import cleanup_checkpointer, setup_checkpointer

        # Setup first
        await setup_checkpointer()

        # Then cleanup
        await cleanup_checkpointer()

        # Verify __aexit__ was called
        mock_saver.__aexit__.assert_called_once_with(None, None, None)


@pytest.mark.asyncio
async def test_cleanup_checkpointer_resets_state(
    mock_checkpointer_env: None,
    reset_checkpointer_state: None,
) -> None:
    """cleanup_checkpointer() should reset module state."""
    with patch("src.checkpointer.AsyncPostgresSaver.from_conn_string") as mock_from_conn:
        # Setup mock
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_saver.__aexit__ = AsyncMock()
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_saver)
        mock_from_conn.return_value = mock_context

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
    with patch("src.checkpointer.AsyncPostgresSaver.from_conn_string") as mock_from_conn:
        # Setup mock
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_saver.__aexit__ = AsyncMock()
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_saver)
        mock_from_conn.return_value = mock_context

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
    with patch("src.checkpointer.AsyncPostgresSaver.from_conn_string") as mock_from_conn:
        # Setup mock
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_saver.__aexit__ = AsyncMock()
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_saver)
        mock_from_conn.return_value = mock_context

        import src.checkpointer as cp
        from src.checkpointer import checkpointer_lifespan

        async with checkpointer_lifespan():
            # Inside context, should be initialized
            assert cp._initialized is True

        # After context, should be cleaned up
        assert cp._initialized is False
        mock_saver.__aexit__.assert_called_once()


@pytest.mark.asyncio
async def test_checkpointer_lifespan_cleans_up_on_exception(
    mock_checkpointer_env: None,
    reset_checkpointer_state: None,
) -> None:
    """checkpointer_lifespan() should cleanup even if exception is raised."""
    with patch("src.checkpointer.AsyncPostgresSaver.from_conn_string") as mock_from_conn:
        # Setup mock
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_saver.__aexit__ = AsyncMock()
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_saver)
        mock_from_conn.return_value = mock_context

        import src.checkpointer as cp
        from src.checkpointer import checkpointer_lifespan

        with pytest.raises(ValueError):
            async with checkpointer_lifespan():
                raise ValueError("Test exception")

        # Should still cleanup
        assert cp._initialized is False
        mock_saver.__aexit__.assert_called_once()
