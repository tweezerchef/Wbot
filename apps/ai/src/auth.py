"""
============================================================================
Authentication Module - Supabase Token Validation
============================================================================
This module handles authentication for the LangGraph API.

The self-hosted LangGraph server calls this module to validate incoming requests.
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

# Test user credentials for LangGraph Studio debugging
# Set these in .env to enable unauthenticated Studio access
TEST_USER = os.getenv("TEST_USER")
TEST_USER_PASSWORD = os.getenv("TEST_USER_PASSWORD")


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

    Falls back to test credentials (TEST_USER/TEST_USER_PASSWORD env vars)
    when no token is provided - useful for LangGraph Studio debugging.
    """
    # If no authorization header, try test credentials for Studio debugging
    if not authorization:
        if TEST_USER and TEST_USER_PASSWORD:
            return await _authenticate_test_user()

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

    return await _validate_token(token)


async def _authenticate_test_user() -> Auth.types.MinimalUserDict:
    """
    Authenticates using test credentials for LangGraph Studio debugging.

    Returns:
        User context dict with identity, email, display_name, preferences.

    Raises:
        Auth.exceptions.HTTPException: If test credentials are invalid.
    """
    supabase = await get_supabase_client()

    try:
        # Sign in with test credentials
        auth_response = await supabase.auth.sign_in_with_password(
            {
                "email": TEST_USER,
                "password": TEST_USER_PASSWORD,
            }
        )

        if not auth_response or not auth_response.user:
            raise Auth.exceptions.HTTPException(
                status_code=401,
                detail="Test user authentication failed: invalid credentials",
            )

        user = auth_response.user

        # Fetch user profile
        profile_response = await (
            supabase.table("profiles")
            .select("display_name, preferences")
            .eq("id", user.id)
            .single()
            .execute()
        )

        profile = profile_response.data if profile_response.data else {}

        print(f"[Auth] Authenticated test user: {TEST_USER}")

        return {
            "identity": user.id,
            "email": user.email,
            "display_name": profile.get("display_name"),
            "preferences": profile.get("preferences", {}),
        }

    except Auth.exceptions.HTTPException:
        raise
    except Exception as e:
        print(f"Test user authentication error: {e}")
        raise Auth.exceptions.HTTPException(
            status_code=401,
            detail="Test user authentication failed. Check TEST_USER and TEST_USER_PASSWORD.",
        ) from e


async def _validate_token(token: str) -> Auth.types.MinimalUserDict:
    """
    Validates a Supabase JWT token.

    Args:
        token: The JWT token to validate.

    Returns:
        User context dict with identity, email, display_name, preferences.

    Raises:
        Auth.exceptions.HTTPException: If token is invalid or expired.
    """
    supabase = await get_supabase_client()

    try:
        user_response = await supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise Auth.exceptions.HTTPException(
                status_code=401,
                detail="Token validation failed: no user returned",
            )

        user = user_response.user

        # Fetch user profile
        profile_response = await (
            supabase.table("profiles")
            .select("display_name, preferences")
            .eq("id", user.id)
            .single()
            .execute()
        )

        profile = profile_response.data if profile_response.data else {}

        return {
            "identity": user.id,
            "email": user.email,
            "display_name": profile.get("display_name"),
            "preferences": profile.get("preferences", {}),
        }

    except Auth.exceptions.HTTPException:
        raise

    except Exception as e:
        print(f"Token validation error: {e}")
        raise Auth.exceptions.HTTPException(
            status_code=401,
            detail="Authentication failed. Please sign in again.",
        ) from e
