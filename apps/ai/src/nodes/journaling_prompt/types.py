"""
============================================================================
Journaling Prompt Types
============================================================================
Type definitions for the journaling prompt node.
============================================================================
"""

from typing import Literal, TypedDict


class JournalingPrompt(TypedDict):
    """Configuration for a journaling prompt."""

    id: str
    category: Literal["reflection", "gratitude", "processing", "growth", "self_compassion"]
    text: str
    follow_up_questions: list[str]
    estimated_time_minutes: int
    best_for: list[str]


class JournalingActivityData(TypedDict):
    """Activity data structure for frontend parsing."""

    type: Literal["activity"]
    activity: Literal["journaling"]
    status: Literal["ready"]
    prompt: JournalingPrompt
    introduction: str
    enable_sharing: bool
    conversation_context: str


class JournalingConfirmation(TypedDict):
    """HITL interrupt data for journaling confirmation."""

    type: Literal["journaling_confirmation"]
    proposed_prompt: JournalingPrompt
    message: str
    available_prompts: list[JournalingPrompt]
    options: list[Literal["start", "change_prompt", "not_now"]]


class UserResponse(TypedDict, total=False):
    """User's response to journaling confirmation."""

    decision: Literal["start", "change_prompt", "not_now"]
    prompt_id: str


# Category type for type safety
JournalingCategory = Literal["reflection", "gratitude", "processing", "growth", "self_compassion"]
