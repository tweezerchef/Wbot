"""
============================================================================
FastAPI Authentication Middleware - Supabase JWT Validation
============================================================================
Shared authentication module for all FastAPI endpoints.
Replaces langgraph_sdk.Auth for pure open-source deployment.

This module provides:
1. AuthenticatedUser dataclass with full user context
2. get_current_user dependency for FastAPI routes
3. CurrentUser type alias for cleaner dependency injection
4. build_langgraph_config helper for graph invocation

Flow:
1. Client includes Supabase access token in Authorization header
2. FastAPI calls get_current_user dependency
3. We validate the token against Supabase
4. If valid, we return AuthenticatedUser with profile data
5. If invalid, we raise HTTPException(401)

Usage:
    from src.api.auth import CurrentUser, build_langgraph_config

    @router.post("/chat")
    async def chat(user: CurrentUser):
        config = build_langgraph_config(user, thread_id)
        result = await graph.ainvoke(input, config=config)
============================================================================
"""

import os
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Header, HTTPException
from supabase import acreate_client
from supabase._async.client import AsyncClient

from src.env import load_monorepo_dotenv
from src.logging_config import NodeLogger

# Load environment variables from monorepo root
load_monorepo_dotenv()

logger = NodeLogger("auth")


@dataclass
class AuthenticatedUser:
    """
    Authenticated user context available in all endpoints.

    Matches the structure expected by inject_user_context node:
    - id maps to identity (for langgraph_auth_user config)
    - All fields available for personalization

    Attributes:
        id: User's unique identifier (Supabase auth.users.id)
        email: User's email address
        display_name: User's display name from profiles table
        preferences: User preferences dict from profiles table
    """

    id: str
    email: str | None
    display_name: str | None
    preferences: dict


async def get_supabase_client() -> AsyncClient:
    """
    Creates an async Supabase client for auth validation.

    Uses SERVICE_KEY to validate tokens on behalf of any user.
    The service key allows us to call auth.get_user() for any token.

    Returns:
        Configured AsyncClient instance.

    Raises:
        ValueError: If required environment variables are missing.
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")

    if not url:
        raise ValueError(
            "SUPABASE_URL environment variable is required. "
            "Set it to your Supabase project URL (e.g., https://xyz.supabase.co)"
        )

    if not key:
        raise ValueError(
            "SUPABASE_SERVICE_KEY environment variable is required. "
            "Get it from Supabase Dashboard > Settings > API > service_role key"
        )

    return await acreate_client(url, key)


async def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> AuthenticatedUser:
    """
    FastAPI dependency that validates Supabase JWT tokens.

    Validates the Bearer token and fetches user profile from Supabase.
    Returns AuthenticatedUser with full context for personalization.

    Args:
        authorization: The Authorization header value (e.g., "Bearer <token>").
                      Automatically extracted by FastAPI from request headers.

    Returns:
        AuthenticatedUser with id, email, display_name, and preferences.

    Raises:
        HTTPException(401): If token is missing, invalid, or expired.

    Example:
        @router.post("/chat")
        async def chat(user: CurrentUser):
            # user.id, user.email, user.preferences available
            ...
    """
    # Validate header presence
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header. Expected: 'Bearer <supabase_access_token>'",
        )

    # Validate header format
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header format. Expected: 'Bearer <token>'",
        )

    # Extract token (remove "Bearer " prefix)
    token = authorization[7:]

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Empty token provided in Authorization header",
        )

    try:
        supabase = await get_supabase_client()

        # Validate token with Supabase auth service
        user_response = await supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=401,
                detail="Token validation failed: no user returned",
            )

        user = user_response.user

        # Fetch user profile and preferences
        # This gives the AI context about the user's goals and preferences
        profile_response = await (
            supabase.table("profiles")
            .select("display_name, preferences")
            .eq("id", user.id)
            .single()
            .execute()
        )

        profile = profile_response.data if profile_response.data else {}

        logger.info("User authenticated", user_id=user.id)

        return AuthenticatedUser(
            id=user.id,
            email=user.email,
            display_name=profile.get("display_name"),
            preferences=profile.get("preferences", {}),
        )

    except HTTPException:
        # Re-raise our own exceptions as-is
        raise

    except Exception as e:
        # Log the error for debugging (don't expose details to client)
        logger.error("Authentication failed", error=str(e))

        # Raise a generic error to avoid leaking information
        raise HTTPException(
            status_code=401,
            detail="Authentication failed. Please sign in again.",
        ) from e


# Type alias for cleaner dependency injection
# Usage: async def endpoint(user: CurrentUser): ...
CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]


def build_langgraph_config(user: AuthenticatedUser, thread_id: str) -> dict:
    """
    Builds the LangGraph config with auth user context.

    Creates the config structure expected by inject_user_context node:
    config["configurable"]["langgraph_auth_user"]

    The inject_user_context node reads:
    - identity -> user_id
    - email, display_name, preferences -> user context

    Args:
        user: Authenticated user from get_current_user dependency.
        thread_id: Conversation thread ID for checkpointing.

    Returns:
        Config dict ready for graph.ainvoke() or graph.astream_events().

    Example:
        config = build_langgraph_config(user, thread_id)
        result = await graph.ainvoke(input, config=config)
    """
    return {
        "configurable": {
            "thread_id": thread_id,
            "langgraph_auth_user": {
                "identity": user.id,  # inject_user_context maps this to user_id
                "email": user.email,
                "display_name": user.display_name,
                "preferences": user.preferences,
            },
        }
    }
