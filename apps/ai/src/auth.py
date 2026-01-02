"""
============================================================================
Authentication Module - Supabase Token Validation
============================================================================
This module handles authentication for the LangGraph API.

LangGraph Deploy calls this module to validate incoming requests.
We verify Supabase JWT tokens to ensure only authenticated users
can access the AI.

Flow:
1. Client includes Supabase access token in Authorization header
2. LangGraph calls the @auth.authenticate handler with request headers
3. We validate the token against Supabase
4. If valid, we return user info (identity is required)
5. If invalid, we raise an HTTPException to reject the request

Security considerations:
- Tokens are short-lived and automatically refreshed by Supabase
- We validate against Supabase's auth service (not just decode locally)
- Failed validation immediately rejects the request
============================================================================
"""

import os

from langgraph_sdk import Auth
from supabase import acreate_client
from supabase._async.client import AsyncClient

from src.env import load_monorepo_dotenv

# Load environment variables from monorepo root `.env` (if present)
load_monorepo_dotenv()

# Create the Auth instance that LangGraph will use
# This is exported and referenced in langgraph.json
auth = Auth()


async def get_supabase_client() -> AsyncClient:
    """
    Creates an async Supabase client for auth validation.

    Returns:
        Async Supabase client instance configured with project URL and service key.

    Raises:
        ValueError: If required environment variables are missing.

    Note:
        We use the SERVICE_KEY (not anon key) because we need to validate
        tokens on behalf of any user, not just the current session.
        We use the async client to avoid blocking the event loop in ASGI.
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")

    if not url:
        raise ValueError(
            "SUPABASE_URL environment variable is required. "
            "Set it to your Supabase project URL "
            "(e.g., https://xyz.supabase.co)"
        )

    if not key:
        raise ValueError(
            "SUPABASE_SERVICE_KEY environment variable is required. "
            "Get it from your Supabase project settings > API > "
            "service_role key"
        )

    return await acreate_client(url, key)


@auth.authenticate
async def verify_token(authorization: str | None) -> Auth.types.MinimalUserDict:
    """
    Validates a Supabase JWT token from the Authorization header.

    This function is decorated with @auth.authenticate, making it the
    authentication handler for all LangGraph API requests.

    Args:
        authorization: The Authorization header value (e.g., "Bearer <token>").
                       LangGraph extracts this from request headers automatically.

    Returns:
        A MinimalUserDict containing authenticated user info.
        The "identity" field is required by LangGraph.
        Additional fields are available in the graph via langgraph_auth_user.

    Raises:
        Auth.exceptions.HTTPException: If token is missing, invalid, or expired.
                                       LangGraph returns a 401 Unauthorized response.

    Example:
        # Client sends request with header:
        # Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

        # This function validates and returns:
        # {"identity": "123e4567-e89b-12d3-a456-426614174000", ...}
    """
    # Validate header is present
    if not authorization:
        raise Auth.exceptions.HTTPException(
            status_code=401,
            detail="Missing Authorization header. Expected: 'Bearer <supabase_access_token>'",
        )

    # Validate header format: "Bearer <token>"
    if not authorization.startswith("Bearer "):
        raise Auth.exceptions.HTTPException(
            status_code=401,
            detail="Invalid Authorization header format. Expected: 'Bearer <token>'",
        )

    # Extract the token (remove "Bearer " prefix)
    token = authorization[7:]

    if not token:
        raise Auth.exceptions.HTTPException(
            status_code=401,
            detail="Empty token provided in Authorization header",
        )

    # Create async Supabase client for validation
    # Using async client to avoid blocking the event loop in ASGI
    supabase = await get_supabase_client()

    try:
        # Validate the token and get the user
        # This calls Supabase's auth API to verify the JWT
        user_response = await supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise Auth.exceptions.HTTPException(
                status_code=401,
                detail="Token validation failed: no user returned",
            )

        user = user_response.user

        # Fetch user's profile and preferences from our profiles table
        # This gives the AI context about the user's goals and preferences
        profile_response = await (
            supabase.table("profiles")
            .select("display_name, preferences")
            .eq("id", user.id)
            .single()
            .execute()
        )

        profile = profile_response.data if profile_response.data else {}

        # Return authenticated user context
        # "identity" is required by LangGraph Auth
        # Additional fields are available in the graph via langgraph_auth_user
        return {
            "identity": user.id,  # Required field for LangGraph Auth
            "email": user.email,
            "display_name": profile.get("display_name"),
            "preferences": profile.get("preferences", {}),
        }

    except Auth.exceptions.HTTPException:
        # Re-raise our own exceptions as-is
        raise

    except Exception as e:
        # Log the error for debugging (don't expose details to client)
        print(f"Token validation error: {e}")

        # Raise a generic error to avoid leaking information
        raise Auth.exceptions.HTTPException(
            status_code=401,
            detail="Authentication failed. Please sign in again.",
        ) from e
