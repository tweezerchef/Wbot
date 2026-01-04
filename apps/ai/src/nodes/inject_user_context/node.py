"""
============================================================================
Inject User Context Node
============================================================================
Injects authenticated user info from LangGraph auth into graph state.

This node MUST run first in the graph so all downstream nodes have access
to user_context with the authenticated user's information.

Flow:
1. LangGraph auth validates token and stores user info in config
2. This node reads from config["configurable"]["langgraph_auth_user"]
3. Maps auth keys to expected state keys (identity → user_id)
4. Returns user_context to be merged into state

Security:
- Auth info comes from validated Supabase JWT token
- User isolation is enforced by user_id in all memory operations
============================================================================
"""

from langchain_core.runnables import RunnableConfig

from src.graph.state import WellnessState
from src.logging_config import NodeLogger

# Set up logging for this node
logger = NodeLogger("inject_user_context")


async def inject_user_context(
    state: WellnessState, config: RunnableConfig
) -> dict[str, dict[str, object]]:
    """
    Populates user_context from LangGraph auth into graph state.

    Reads the authenticated user info from LangGraph's config and maps
    it to the user_context format expected by downstream nodes.

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
                "preferences": {...}
            }
        }

    Note:
        - If no auth user found, returns empty dict (unauthenticated request)
        - Maps 'identity' key from auth to 'user_id' key expected by nodes
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

    # Map auth keys to expected state keys
    # The auth module returns 'identity' but nodes expect 'user_id'
    user_context = {
        "user_id": auth_user.get("identity"),  # Map 'identity' → 'user_id'
        "email": auth_user.get("email"),
        "display_name": auth_user.get("display_name"),
        "preferences": auth_user.get("preferences", {}),
    }

    logger.info("User context injected", user_id=user_context.get("user_id"))
    logger.node_end()

    return {"user_context": user_context}
