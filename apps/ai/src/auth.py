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
2. LangGraph calls verify_token() with the request
3. We validate the token against Supabase
4. If valid, we return the user ID for request context
5. If invalid, we raise an exception to reject the request

Security considerations:
- Tokens are short-lived and automatically refreshed by Supabase
- We validate against Supabase's auth service (not just decode locally)
- Failed validation immediately rejects the request
============================================================================
"""

import os
from typing import Any

from supabase import Client, create_client

from src.env import load_monorepo_dotenv

# Load environment variables from monorepo root `.env` (if present)
load_monorepo_dotenv()


def get_supabase_client() -> Client:
    """
    Creates a Supabase client for auth validation.

    Returns:
        Supabase client instance configured with project URL and service key.

    Raises:
        ValueError: If required environment variables are missing.

    Note:
        We use the SERVICE_KEY (not anon key) because we need to validate
        tokens on behalf of any user, not just the current session.
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

    return create_client(url, key)


async def verify_token(request: dict[str, Any]) -> dict[str, Any]:
    """
    Validates a Supabase JWT token from the request.

    This function is called by LangGraph Deploy for every incoming request.
    It's configured in langgraph.json under the "auth" section.

    Args:
        request: The incoming request object from LangGraph.
                 Contains headers, body, and other request metadata.
                 The Authorization header should be: "Bearer <supabase_token>"

    Returns:
        A dict containing authenticated user info:
        {
            "user_id": "uuid-of-the-user",
            "email": "user@example.com",  # if available
            "preferences": {...}  # user preferences from profile
        }

    Raises:
        Exception: If token is missing, invalid, or expired.
                   LangGraph will return a 401 Unauthorized response.

    Example:
        # Client sends request with header:
        # Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

        # This function validates and returns:
        # {"user_id": "123e4567-e89b-12d3-a456-426614174000", ...}
    """
    # Extract the Authorization header
    headers = request.get("headers", {})
    auth_header = headers.get("authorization", headers.get("Authorization", ""))

    # Validate header format: "Bearer <token>"
    if not auth_header.startswith("Bearer "):
        raise ValueError(
            "Missing or invalid Authorization header. "
            "Expected format: 'Bearer <supabase_access_token>'"
        )

    # Extract the token (remove "Bearer " prefix)
    token = auth_header[7:]

    if not token:
        raise ValueError("Empty token provided in Authorization header")

    # Create Supabase client for validation
    supabase = get_supabase_client()

    try:
        # Validate the token and get the user
        # This calls Supabase's auth API to verify the JWT
        user_response = supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise ValueError("Token validation failed: no user returned")

        user = user_response.user

        # Fetch user's profile and preferences from our profiles table
        # This gives the AI context about the user's goals and preferences
        profile_response = (
            supabase.table("profiles")
            .select("display_name, preferences")
            .eq("id", user.id)
            .single()
            .execute()
        )

        profile = profile_response.data if profile_response.data else {}

        # Return authenticated user context
        # This data is available to the graph for personalization
        return {
            "user_id": user.id,
            "email": user.email,
            "display_name": profile.get("display_name"),
            "preferences": profile.get("preferences", {}),
        }

    except Exception as e:
        # Log the error for debugging (don't expose details to client)
        print(f"Token validation error: {e}")

        # Raise a generic error to avoid leaking information
        raise ValueError("Authentication failed. Please sign in again.") from e
