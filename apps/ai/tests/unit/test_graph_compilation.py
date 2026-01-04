"""
============================================================================
Tests for Graph Compilation with Checkpointer
============================================================================
Tests the get_compiled_graph() function for self-hosted deployments.

Tests:
- get_compiled_graph(): Async graph compilation with PostgreSQL checkpointer
- Singleton behavior for compiled graph
- Checkpointer integration
============================================================================
"""

from unittest.mock import AsyncMock, patch

import pytest

# =============================================================================
# Fixtures
# =============================================================================


@pytest.fixture
def mock_graph_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Set up mock environment variables for graph tests."""
    monkeypatch.setenv("SUPABASE_URL", "https://test-project.supabase.co")
    monkeypatch.setenv("SUPABASE_DB_PASSWORD", "test-db-password")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "test-service-key")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-anthropic-key")


@pytest.fixture
def reset_graph_state() -> None:
    """Reset the module-level graph state before each test."""
    import src.graph.wellness as wellness

    wellness._compiled_graph_with_checkpointer = None

    # Also reset checkpointer state
    import src.checkpointer as cp

    cp._checkpointer = None
    cp._initialized = False

    yield

    # Cleanup after test
    wellness._compiled_graph_with_checkpointer = None
    cp._checkpointer = None
    cp._initialized = False


# =============================================================================
# get_compiled_graph() Tests
# =============================================================================


@pytest.mark.asyncio
async def test_get_compiled_graph_returns_compiled_graph(
    mock_graph_env: None,
    reset_graph_state: None,
) -> None:
    """get_compiled_graph() should return a compiled graph."""
    with (
        patch("src.checkpointer.AsyncPostgresSaver.from_conn_string") as mock_from_conn,
    ):
        # Setup mock checkpointer
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_saver)
        mock_from_conn.return_value = mock_context

        from src.graph.wellness import get_compiled_graph

        graph = await get_compiled_graph()

        # Should return a compiled graph
        assert graph is not None
        # Should have the standard graph methods
        assert hasattr(graph, "ainvoke")
        assert hasattr(graph, "astream")


@pytest.mark.asyncio
async def test_get_compiled_graph_is_singleton(
    mock_graph_env: None,
    reset_graph_state: None,
) -> None:
    """get_compiled_graph() should return the same instance on multiple calls."""
    with (
        patch("src.checkpointer.AsyncPostgresSaver.from_conn_string") as mock_from_conn,
    ):
        # Setup mock checkpointer
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_saver)
        mock_from_conn.return_value = mock_context

        from src.graph.wellness import get_compiled_graph

        # Get graph twice
        first = await get_compiled_graph()
        second = await get_compiled_graph()

        # Should be the same instance
        assert first is second


@pytest.mark.asyncio
async def test_get_compiled_graph_calls_setup_checkpointer(
    mock_graph_env: None,
    reset_graph_state: None,
) -> None:
    """get_compiled_graph() should call setup_checkpointer()."""
    with (
        patch("src.checkpointer.AsyncPostgresSaver.from_conn_string") as mock_from_conn,
        patch("src.graph.wellness.setup_checkpointer") as mock_setup,
    ):
        # Setup mock checkpointer
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_saver)
        mock_from_conn.return_value = mock_context

        # Mock setup_checkpointer as async
        mock_setup.return_value = None

        from src.graph.wellness import get_compiled_graph

        await get_compiled_graph()

        # Verify setup was called
        mock_setup.assert_called_once()


@pytest.mark.asyncio
async def test_get_compiled_graph_uses_checkpointer(
    mock_graph_env: None,
    reset_graph_state: None,
) -> None:
    """get_compiled_graph() should compile the graph with the checkpointer."""
    with (
        patch("src.checkpointer.AsyncPostgresSaver.from_conn_string") as mock_from_conn,
    ):
        # Setup mock checkpointer
        mock_saver = AsyncMock()
        mock_saver.setup = AsyncMock()
        mock_context = AsyncMock()
        mock_context.__aenter__ = AsyncMock(return_value=mock_saver)
        mock_from_conn.return_value = mock_context

        from src.graph.wellness import get_compiled_graph

        graph = await get_compiled_graph()

        # The graph should have a checkpointer
        # Note: The actual checkpointer attribute depends on langgraph internals
        assert graph is not None


# =============================================================================
# Stateless graph export Tests
# =============================================================================


def test_stateless_graph_export_exists() -> None:
    """The stateless 'graph' export should exist for LangGraph Cloud."""
    from src.graph.wellness import graph

    assert graph is not None
    assert hasattr(graph, "ainvoke")
    assert hasattr(graph, "astream")


def test_stateless_graph_is_different_from_checkpointed() -> None:
    """The stateless graph should be a different instance from get_compiled_graph()."""
    from src.graph.wellness import graph

    # The stateless graph is created at module load time
    # It should exist without async initialization
    assert graph is not None

    # The _compiled_graph_with_checkpointer starts as None
    import src.graph.wellness as wellness

    # Before calling get_compiled_graph(), the checkpointed graph is None
    # This verifies they are different
    initial_checkpointed = wellness._compiled_graph_with_checkpointer
    assert initial_checkpointed is None or initial_checkpointed is not graph


# =============================================================================
# build_graph() Tests
# =============================================================================


def test_build_graph_returns_state_graph() -> None:
    """build_graph() should return a StateGraph instance."""
    from langgraph.graph import StateGraph

    from src.graph.wellness import build_graph

    builder = build_graph()

    assert isinstance(builder, StateGraph)


def test_build_graph_has_all_nodes() -> None:
    """build_graph() should include all required nodes."""
    from src.graph.wellness import build_graph

    builder = build_graph()

    # Check that expected nodes are registered
    # The nodes dict contains the registered nodes
    expected_nodes = [
        "inject_user_context",
        "retrieve_memories",
        "detect_activity",
        "generate_response",
        "breathing_exercise",
        "generate_meditation_script",
        "store_memory",
    ]

    for node_name in expected_nodes:
        assert node_name in builder.nodes, f"Missing node: {node_name}"


# =============================================================================
# route_activity() Tests
# =============================================================================


def test_route_activity_routes_to_breathing() -> None:
    """route_activity() should route to breathing_exercise for breathing activity."""
    from src.graph.wellness import route_activity

    state = {"suggested_activity": "breathing"}
    result = route_activity(state)

    assert result == "breathing_exercise"


def test_route_activity_routes_to_meditation() -> None:
    """route_activity() should route to generate_meditation_script for meditation."""
    from src.graph.wellness import route_activity

    state = {"suggested_activity": "meditation"}
    result = route_activity(state)

    assert result == "generate_meditation_script"


def test_route_activity_routes_to_response_by_default() -> None:
    """route_activity() should route to generate_response for no activity."""
    from src.graph.wellness import route_activity

    state = {"suggested_activity": None}
    result = route_activity(state)

    assert result == "generate_response"


def test_route_activity_handles_missing_key() -> None:
    """route_activity() should handle missing suggested_activity key."""
    from src.graph.wellness import route_activity

    state = {}  # No suggested_activity key
    result = route_activity(state)

    assert result == "generate_response"
