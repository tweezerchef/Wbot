"""
============================================================================
Authentication Helpers
============================================================================
Handles different auth user types from LangGraph.

LangGraph passes different user objects depending on context:
- Dict: From custom auth handlers (production with JWT tokens)
- StudioUser: From LangGraph Studio (local debugging)

This module provides helpers to extract user info regardless of type.
============================================================================
"""

from typing import Any


def get_auth_user_field(
    auth_user: Any,  # noqa: ANN401
    field: str,
    default: Any = None,  # noqa: ANN401
) -> Any:  # noqa: ANN401
    """
    Extracts a field from an auth user object, handling both dict and object types.

    LangGraph Studio passes a StudioUser object with attributes,
    while custom auth handlers return a dict. This function handles both.

    Args:
        auth_user: The auth user (dict or object)
        field: The field name to extract (e.g., "identity", "email")
        default: Default value if field doesn't exist

    Returns:
        The field value, or default if not found

    Examples:
        # Works with dict (production)
        user_id = get_auth_user_field({"identity": "123"}, "identity")

        # Works with StudioUser object (LangGraph Studio)
        user_id = get_auth_user_field(studio_user, "identity")
    """
    if auth_user is None:
        return default

    # Try dict access first (production path)
    if isinstance(auth_user, dict):
        return auth_user.get(field, default)

    # Fall back to attribute access for objects (StudioUser, etc.)
    return getattr(auth_user, field, default)


def extract_user_context(auth_user: Any) -> dict[str, Any]:  # noqa: ANN401
    """
    Extracts standard user context fields from an auth user.

    Args:
        auth_user: The auth user (dict or StudioUser object)

    Returns:
        Dict with user_id, email, display_name, preferences
    """
    return {
        "user_id": get_auth_user_field(auth_user, "identity"),
        "email": get_auth_user_field(auth_user, "email"),
        "display_name": get_auth_user_field(auth_user, "display_name"),
        "preferences": get_auth_user_field(auth_user, "preferences", {}),
    }
