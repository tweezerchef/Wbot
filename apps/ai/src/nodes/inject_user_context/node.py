"""
============================================================================
Inject User Context Node
============================================================================
Injects authenticated user info from LangGraph auth into graph state,
along with the user's wellness profile for personalization.

This node MUST run first in the graph so all downstream nodes have access
to user_context with the authenticated user's information.

Flow:
1. LangGraph auth validates token and stores user info in config
2. This node reads from config["configurable"]["langgraph_auth_user"]
3. Maps auth keys to expected state keys (identity → user_id)
4. Fetches user's wellness profile from database for personalization
5. Returns user_context with profile to be merged into state

Security:
- Auth info comes from validated Supabase JWT token
- User isolation is enforced by user_id in all memory operations
============================================================================
"""

import os
from typing import Any

from langchain_core.runnables import RunnableConfig
from supabase import AsyncClient, acreate_client

from src.graph.state import WellnessState
from src.logging_config import NodeLogger

# Set up logging for this node
logger = NodeLogger("inject_user_context")

# Singleton async Supabase client
_supabase_client: AsyncClient | None = None


async def _get_supabase_client() -> AsyncClient:
    """Gets or creates the async Supabase client."""
    global _supabase_client

    if _supabase_client is None:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_KEY")

        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")

        _supabase_client = await acreate_client(url, key)

    return _supabase_client


async def _fetch_wellness_profile(user_id: str) -> dict[str, Any] | None:
    """
    Fetches the user's wellness profile using the database function.

    Uses get_user_wellness_context() which returns profile data optimized
    for LLM context injection.

    Args:
        user_id: User's UUID

    Returns:
        Wellness profile dict or None on error
    """
    try:
        client = await _get_supabase_client()

        # Call the database function that returns wellness context
        result = await client.rpc("get_user_wellness_context", {"p_user_id": user_id}).execute()

        if result.data:
            return result.data
        return None

    except Exception as e:
        # Log but don't fail - profile is optional enhancement
        logger.warning("Failed to fetch wellness profile", error=str(e))
        return None


async def inject_user_context(
    state: WellnessState, config: RunnableConfig
) -> dict[str, dict[str, object]]:
    """
    Populates user_context from LangGraph auth into graph state.

    Reads the authenticated user info from LangGraph's config, maps
    it to the user_context format, and fetches the user's wellness
    profile for personalized responses.

    Args:
        state: Current graph state (messages, etc.)
        config: LangGraph config containing langgraph_auth_user

    Returns:
        Dict with user_context to merge into state:
        {
            "user_context": {
                "user_id": "uuid",
                "email": "user@example.com",
                "display_name": "User Name",
                "preferences": {...},
                "wellness_profile": {
                    "emotional_baseline": "neutral",
                    "total_conversations": 42,
                    "recurring_topics": [...],
                    "preferred_activities": [...],
                    ...
                }
            }
        }

    Note:
        - If no auth user found, returns empty dict (unauthenticated request)
        - Maps 'identity' key from auth to 'user_id' key expected by nodes
        - Wellness profile is optional - missing profile won't block execution
    """
    logger.node_start()

    # Get auth info from LangGraph's config
    # This is populated by the @auth.authenticate handler in auth.py
    configurable = config.get("configurable", {})
    auth_user = configurable.get("langgraph_auth_user", {})

    if not auth_user:
        # No auth user - likely unauthenticated request or test environment
        logger.warning("No auth user found in config - user_context will be empty")
        logger.node_end()
        return {}

    user_id = auth_user.get("identity")

    # Map auth keys to expected state keys
    # The auth module returns 'identity' but nodes expect 'user_id'
    user_context: dict[str, Any] = {
        "user_id": user_id,  # Map 'identity' → 'user_id'
        "email": auth_user.get("email"),
        "display_name": auth_user.get("display_name"),
        "preferences": auth_user.get("preferences", {}),
    }

    # Fetch wellness profile for personalization
    if user_id:
        wellness_profile = await _fetch_wellness_profile(user_id)
        if wellness_profile:
            user_context["wellness_profile"] = wellness_profile
            logger.info(
                "User context with profile",
                user_id=user_id,
                has_profile=True,
                baseline=wellness_profile.get("emotional_baseline", "unknown"),
            )
        else:
            logger.info("User context injected", user_id=user_id, has_profile=False)
    else:
        logger.info("User context injected", user_id=user_id, has_profile=False)

    logger.node_end()

    return {"user_context": user_context}
