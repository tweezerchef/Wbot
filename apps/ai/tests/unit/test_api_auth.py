"""
============================================================================
Tests for src/api/auth.py - FastAPI Authentication Middleware
============================================================================
Tests cover:
- Header validation (missing, invalid format, empty token)
- Successful authentication with mocked Supabase
- Profile fetch handling (found, not found)
- Error handling
- Config builder for LangGraph
============================================================================
"""

from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

# -----------------------------------------------------------------------------
# Header Validation Tests
# -----------------------------------------------------------------------------


class TestGetCurrentUserHeaderValidation:
    """Tests for Authorization header validation."""

    @pytest.mark.asyncio
    async def test_missing_authorization_header(self) -> None:
        """Should raise 401 when Authorization header is missing."""
        from src.api.auth import get_current_user

        with pytest.raises(HTTPException) as exc:
            await get_current_user(authorization=None)

        assert exc.value.status_code == 401
        assert "Missing Authorization header" in exc.value.detail

    @pytest.mark.asyncio
    async def test_invalid_header_format_basic(self) -> None:
        """Should raise 401 when header uses Basic auth instead of Bearer."""
        from src.api.auth import get_current_user

        with pytest.raises(HTTPException) as exc:
            await get_current_user(authorization="Basic dXNlcjpwYXNz")

        assert exc.value.status_code == 401
        assert "Invalid Authorization header format" in exc.value.detail

    @pytest.mark.asyncio
    async def test_invalid_header_format_no_bearer(self) -> None:
        """Should raise 401 when header doesn't start with 'Bearer '."""
        from src.api.auth import get_current_user

        with pytest.raises(HTTPException) as exc:
            await get_current_user(authorization="token123")

        assert exc.value.status_code == 401
        assert "Invalid Authorization header format" in exc.value.detail

    @pytest.mark.asyncio
    async def test_empty_token_after_bearer(self) -> None:
        """Should raise 401 when token is empty after 'Bearer '."""
        from src.api.auth import get_current_user

        with pytest.raises(HTTPException) as exc:
            await get_current_user(authorization="Bearer ")

        assert exc.value.status_code == 401
        assert "Empty token" in exc.value.detail


# -----------------------------------------------------------------------------
# Successful Authentication Tests
# -----------------------------------------------------------------------------


class TestGetCurrentUserSuccess:
    """Tests for successful authentication scenarios."""

    @pytest.mark.asyncio
    async def test_successful_authentication_with_profile(
        self, mock_env: None, mock_supabase_client: AsyncMock
    ) -> None:
        """Should return AuthenticatedUser with profile data on valid token."""
        from src.api.auth import AuthenticatedUser, get_current_user

        with patch("src.api.auth.get_supabase_client", return_value=mock_supabase_client):
            user = await get_current_user(authorization="Bearer valid-token")

        assert isinstance(user, AuthenticatedUser)
        assert user.id == "user-123"
        assert user.email == "test@example.com"
        assert user.display_name == "Test User"
        # Check preferences contains expected keys (fixture has full preferences object)
        assert user.preferences["primary_goal"] == "stress_anxiety"
        assert "communication_style" in user.preferences

    @pytest.mark.asyncio
    async def test_successful_authentication_without_profile(
        self, mock_env: None, mock_supabase_user: dict[str, Any]
    ) -> None:
        """Should handle missing profile gracefully with default values."""
        from src.api.auth import AuthenticatedUser, get_current_user

        # Create mock with user but no profile data
        mock_client = AsyncMock()

        # Mock auth.get_user response
        mock_user_response = MagicMock()
        mock_user_response.user = MagicMock()
        mock_user_response.user.id = mock_supabase_user["id"]
        mock_user_response.user.email = mock_supabase_user["email"]
        mock_client.auth.get_user = AsyncMock(return_value=mock_user_response)

        # Mock profile query returning None
        mock_query_response = MagicMock()
        mock_query_response.data = None
        mock_execute = AsyncMock(return_value=mock_query_response)
        mock_single = MagicMock(return_value=MagicMock(execute=mock_execute))
        mock_eq = MagicMock(return_value=MagicMock(single=mock_single))
        mock_select = MagicMock(return_value=MagicMock(eq=mock_eq))
        mock_client.table = MagicMock(return_value=MagicMock(select=mock_select))

        with patch("src.api.auth.get_supabase_client", return_value=mock_client):
            user = await get_current_user(authorization="Bearer valid-token")

        assert isinstance(user, AuthenticatedUser)
        assert user.id == "user-123"
        assert user.email == "test@example.com"
        assert user.display_name is None  # No profile
        assert user.preferences == {}  # Default empty dict


# -----------------------------------------------------------------------------
# Error Handling Tests
# -----------------------------------------------------------------------------


class TestGetCurrentUserErrors:
    """Tests for authentication error scenarios."""

    @pytest.mark.asyncio
    async def test_invalid_token_no_user_returned(self, mock_env: None) -> None:
        """Should raise 401 when Supabase returns no user for token."""
        from src.api.auth import get_current_user

        mock_client = AsyncMock()
        mock_client.auth.get_user = AsyncMock(return_value=MagicMock(user=None))

        with (
            patch("src.api.auth.get_supabase_client", return_value=mock_client),
            pytest.raises(HTTPException) as exc,
        ):
            await get_current_user(authorization="Bearer invalid-token")

        assert exc.value.status_code == 401
        assert "Token validation failed" in exc.value.detail

    @pytest.mark.asyncio
    async def test_supabase_auth_exception(self, mock_env: None) -> None:
        """Should raise 401 with generic message on Supabase errors."""
        from src.api.auth import get_current_user

        mock_client = AsyncMock()
        mock_client.auth.get_user = AsyncMock(side_effect=Exception("Network error"))

        with (
            patch("src.api.auth.get_supabase_client", return_value=mock_client),
            pytest.raises(HTTPException) as exc,
        ):
            await get_current_user(authorization="Bearer some-token")

        assert exc.value.status_code == 401
        # Should NOT expose the actual error message
        assert "Authentication failed" in exc.value.detail
        assert "Network error" not in exc.value.detail


# -----------------------------------------------------------------------------
# Supabase Client Tests
# -----------------------------------------------------------------------------


class TestGetSupabaseClient:
    """Tests for Supabase client creation."""

    @pytest.mark.asyncio
    async def test_missing_supabase_url(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Should raise ValueError when SUPABASE_URL is missing."""
        from src.api.auth import get_supabase_client

        monkeypatch.delenv("SUPABASE_URL", raising=False)
        monkeypatch.setenv("SUPABASE_SERVICE_KEY", "test-key")

        with pytest.raises(ValueError) as exc:
            await get_supabase_client()

        assert "SUPABASE_URL" in str(exc.value)

    @pytest.mark.asyncio
    async def test_missing_service_key(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """Should raise ValueError when SUPABASE_SERVICE_KEY is missing."""
        from src.api.auth import get_supabase_client

        monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
        monkeypatch.delenv("SUPABASE_SERVICE_KEY", raising=False)

        with pytest.raises(ValueError) as exc:
            await get_supabase_client()

        assert "SUPABASE_SERVICE_KEY" in str(exc.value)


# -----------------------------------------------------------------------------
# Config Builder Tests
# -----------------------------------------------------------------------------


class TestBuildLanggraphConfig:
    """Tests for the build_langgraph_config helper."""

    def test_config_structure(self) -> None:
        """Should build correct config structure for LangGraph."""
        from src.api.auth import AuthenticatedUser, build_langgraph_config

        user = AuthenticatedUser(
            id="user-123",
            email="test@example.com",
            display_name="Test User",
            preferences={"primary_goal": "stress_anxiety", "experience_level": "beginner"},
        )

        config = build_langgraph_config(user, thread_id="thread-456")

        # Verify top-level structure
        assert "configurable" in config
        assert config["configurable"]["thread_id"] == "thread-456"

        # Verify langgraph_auth_user structure
        auth_user = config["configurable"]["langgraph_auth_user"]
        assert auth_user["identity"] == "user-123"
        assert auth_user["email"] == "test@example.com"
        assert auth_user["display_name"] == "Test User"
        assert auth_user["preferences"] == {
            "primary_goal": "stress_anxiety",
            "experience_level": "beginner",
        }

    def test_config_with_none_values(self) -> None:
        """Should handle None values in user data."""
        from src.api.auth import AuthenticatedUser, build_langgraph_config

        user = AuthenticatedUser(
            id="user-789",
            email=None,
            display_name=None,
            preferences={},
        )

        config = build_langgraph_config(user, thread_id="thread-abc")

        auth_user = config["configurable"]["langgraph_auth_user"]
        assert auth_user["identity"] == "user-789"
        assert auth_user["email"] is None
        assert auth_user["display_name"] is None
        assert auth_user["preferences"] == {}


# -----------------------------------------------------------------------------
# CurrentUser Type Alias Tests
# -----------------------------------------------------------------------------


class TestCurrentUserAlias:
    """Tests for the CurrentUser type alias."""

    def test_current_user_is_annotated_type(self) -> None:
        """CurrentUser should be an Annotated type with Depends."""
        from typing import get_args, get_origin

        from src.api.auth import CurrentUser

        # Check it's an Annotated type
        origin = get_origin(CurrentUser)
        assert origin is not None

        # Get the type arguments
        args = get_args(CurrentUser)
        assert len(args) >= 1

        # First arg should be AuthenticatedUser
        from src.api.auth import AuthenticatedUser

        assert args[0] is AuthenticatedUser
