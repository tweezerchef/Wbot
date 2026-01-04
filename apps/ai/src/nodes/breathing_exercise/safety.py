"""
============================================================================
Breathing Exercise Safety Checks
============================================================================
Validates user safety for advanced breathing techniques like Wim Hof Method.

Safety considerations:
- Experience level (minimum 3 completed sessions for Wim Hof)
- Health conditions (heart, blood pressure, pregnancy, epilepsy)
- Recent discomfort mentions (dizziness, lightheadedness)
============================================================================
"""

from typing import TypedDict

from src.graph.state import WellnessState
from src.logging_config import NodeLogger

logger = NodeLogger("breathing_safety")


# -----------------------------------------------------------------------------
# Type Definitions
# -----------------------------------------------------------------------------


class SafetyCheckResult(TypedDict):
    """Result of Wim Hof safety validation."""

    safe: bool
    reason: str | None
    fallback_technique_id: str | None
    message: str


# -----------------------------------------------------------------------------
# Safety Validation Functions
# -----------------------------------------------------------------------------


async def check_wim_hof_safety(state: WellnessState) -> SafetyCheckResult:
    """
    Validate whether user can safely practice Wim Hof Method.

    The Wim Hof Method involves rapid hyperventilation followed by breath
    retention, which can be unsafe for certain conditions and inexperienced users.

    Args:
        state: Current conversation state with user context and messages

    Returns:
        SafetyCheckResult with safety status, reason, and fallback recommendation
    """
    from .node import get_last_user_message

    user_context = state.get("user_context", {})
    messages = state.get("messages", [])
    last_message = get_last_user_message(messages)

    # Check 1: Health conditions
    health_conditions = user_context.get("health_conditions", [])
    unsafe_conditions = [
        "heart_condition",
        "high_blood_pressure",
        "pregnant",
        "epilepsy",
        "seizure_disorder",
    ]

    if any(cond in health_conditions for cond in unsafe_conditions):
        logger.info(
            "Blocked Wim Hof",
            reason="health_condition",
            conditions=health_conditions,
        )
        return {
            "safe": False,
            "reason": "health_condition",
            "fallback_technique_id": "coherent",
            "message": (
                "Wim Hof involves intense breathing that may not suit your health profile. "
                "Let's try Coherent Breathing instead - it's gentler but still very effective."
            ),
        }

    # Check 2: Experience level (require minimum 3 sessions)
    breathing_sessions = await get_user_breathing_session_count(user_context.get("id"))

    if breathing_sessions < 3:
        logger.info(
            "Blocked Wim Hof",
            reason="inexperienced",
            sessions=breathing_sessions,
        )
        return {
            "safe": False,
            "reason": "inexperienced",
            "fallback_technique_id": "box",
            "message": (
                "Wim Hof is quite advanced. I'd recommend starting with Box Breathing "
                "to build a foundation first. After a few sessions, we can try Wim Hof!"
            ),
        }

    # Check 3: Recent discomfort mentions
    discomfort_keywords = ["dizzy", "lightheaded", "uncomfortable", "nauseous"]
    if any(keyword in last_message.lower() for keyword in discomfort_keywords):
        logger.info(
            "Blocked Wim Hof",
            reason="recent_discomfort",
            message_excerpt=last_message[:100],
        )
        return {
            "safe": False,
            "reason": "recent_discomfort",
            "fallback_technique_id": "deep_calm",
            "message": (
                "Since you mentioned feeling dizzy, let's stick with a gentler technique today."
            ),
        }

    # All checks passed
    logger.info("Wim Hof safety check passed", sessions=breathing_sessions)
    return {
        "safe": True,
        "reason": None,
        "fallback_technique_id": None,
        "message": "",
    }


async def get_user_breathing_session_count(user_id: str | None) -> int:
    """
    Get count of completed breathing sessions for user.

    Args:
        user_id: User's unique identifier

    Returns:
        Number of completed breathing sessions (0 if user_id is None or query fails)
    """
    if not user_id:
        return 0

    try:
        # Import here to avoid circular dependency
        from src.auth import get_supabase_client

        supabase = await get_supabase_client()

        # Query breathing_sessions table (created in migration 005)
        result = (
            supabase.table("breathing_sessions")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .eq("completed", True)
            .execute()
        )

        return result.count or 0

    except Exception as e:
        logger.warning(f"Failed to get breathing session count: {e}")
        # Fail closed - if we can't verify experience, assume beginner
        return 0


async def get_user_wim_hof_session_count(user_id: str | None) -> int:
    """
    Get count of completed Wim Hof sessions specifically.

    Used to determine if this is the user's first Wim Hof session
    (for displaying tutorial).

    Args:
        user_id: User's unique identifier

    Returns:
        Number of completed Wim Hof sessions (0 if user_id is None or query fails)
    """
    if not user_id:
        return 0

    try:
        from src.auth import get_supabase_client

        supabase = await get_supabase_client()

        result = (
            supabase.table("breathing_sessions")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .eq("technique_id", "wim_hof")
            .eq("completed", True)
            .execute()
        )

        return result.count or 0

    except Exception as e:
        logger.warning(f"Failed to get Wim Hof session count: {e}")
        return 0
