"""
============================================================================
Test Fixtures for Wbot AI Backend
============================================================================
Shared pytest fixtures for unit and integration tests.

Provides:
- Environment variable mocking
- Supabase client mocking
- LLM mocking
- Sample data fixtures
============================================================================
"""

from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

# -----------------------------------------------------------------------------
# Environment Fixtures
# -----------------------------------------------------------------------------


@pytest.fixture
def mock_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Set up mock environment variables for tests."""
    monkeypatch.setenv("SUPABASE_URL", "https://test-project.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "test-service-key")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-anthropic-key")


# -----------------------------------------------------------------------------
# Supabase Fixtures
# -----------------------------------------------------------------------------


@pytest.fixture
def mock_supabase_user() -> dict[str, Any]:
    """Sample Supabase user data."""
    return {
        "id": "user-123",
        "email": "test@example.com",
        "created_at": "2024-01-01T00:00:00Z",
    }


@pytest.fixture
def mock_supabase_profile() -> dict[str, Any]:
    """Sample user profile data."""
    return {
        "display_name": "Test User",
        "preferences": {
            "primary_goal": "stress_anxiety",
            "communication_style": "warm",
            "current_feeling": "stressed",
            "challenges": ["racing_thoughts", "work_stress"],
            "preferred_activities": ["breathing", "meditation"],
        },
    }


@pytest.fixture
def mock_supabase_client(
    mock_supabase_user: dict[str, Any],
    mock_supabase_profile: dict[str, Any],
) -> AsyncMock:
    """
    Creates a mock async Supabase client.

    Mocks:
    - supabase.auth.get_user(token) -> User response
    - supabase.table("profiles").select().eq().single().execute() -> Profile
    """
    mock_client = AsyncMock()

    # Mock auth.get_user response
    mock_user_response = MagicMock()
    mock_user_response.user = MagicMock()
    mock_user_response.user.id = mock_supabase_user["id"]
    mock_user_response.user.email = mock_supabase_user["email"]
    mock_client.auth.get_user = AsyncMock(return_value=mock_user_response)

    # Mock table query chain for profiles
    mock_query_response = MagicMock()
    mock_query_response.data = mock_supabase_profile

    mock_execute = AsyncMock(return_value=mock_query_response)
    mock_single = MagicMock(return_value=MagicMock(execute=mock_execute))
    mock_eq = MagicMock(return_value=MagicMock(single=mock_single))
    mock_select = MagicMock(return_value=MagicMock(eq=mock_eq))
    mock_table = MagicMock(return_value=MagicMock(select=mock_select))

    mock_client.table = mock_table

    return mock_client


# -----------------------------------------------------------------------------
# LLM Fixtures
# -----------------------------------------------------------------------------


@pytest.fixture
def mock_llm_response() -> MagicMock:
    """Creates a mock LLM response."""
    mock_response = MagicMock()
    mock_response.content = "box"  # Default technique selection
    return mock_response


@pytest.fixture
def mock_llm(mock_llm_response: MagicMock) -> MagicMock:
    """
    Creates a mock LLM that returns predefined responses.

    Usage in tests:
        mock_llm.ainvoke.return_value.content = "your_response"
    """
    mock = MagicMock()
    mock.ainvoke = AsyncMock(return_value=mock_llm_response)
    return mock


# -----------------------------------------------------------------------------
# State Fixtures
# -----------------------------------------------------------------------------


@pytest.fixture
def sample_user_context() -> dict[str, Any]:
    """Sample user context for graph state."""
    return {
        "display_name": "Alex",
        "email": "alex@example.com",
        "preferences": {
            "primary_goal": "stress_anxiety",
            "communication_style": "direct",
            "current_feeling": "anxious",
            "challenges": ["racing_thoughts", "sleep_issues"],
            "support_type": "guided",
            "preferred_activities": ["breathing", "meditation", "journaling"],
            "experience_level": "tried_apps",
            "session_length": "short",
        },
    }


@pytest.fixture
def sample_wellness_state(sample_user_context: dict[str, Any]) -> dict[str, Any]:
    """
    Sample WellnessState for testing graph nodes.

    Includes messages, user context, and optional fields.
    """
    from langchain_core.messages import AIMessage, HumanMessage

    return {
        "messages": [
            HumanMessage(content="Hi, I'm feeling really stressed today"),
            AIMessage(content="I hear you. Would you like to try a breathing exercise?"),
            HumanMessage(content="Yes, that sounds helpful"),
        ],
        "user_context": sample_user_context,
        "retrieved_memories": [],
        "suggested_activity": None,
        "exercise_completed": False,
        "exercise_technique": None,
    }


# -----------------------------------------------------------------------------
# Interrupt Fixtures (for HITL testing)
# -----------------------------------------------------------------------------


@pytest.fixture
def mock_interrupt_start() -> dict[str, str]:
    """Mock user response: start the exercise."""
    return {"decision": "start"}


@pytest.fixture
def mock_interrupt_change() -> dict[str, str]:
    """Mock user response: change technique."""
    return {"decision": "change_technique", "technique_id": "relaxing_478"}


@pytest.fixture
def mock_interrupt_decline() -> dict[str, str]:
    """Mock user response: decline the exercise."""
    return {"decision": "not_now"}
