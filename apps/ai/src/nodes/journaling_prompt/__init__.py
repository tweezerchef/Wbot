"""
Journaling Prompt Node

Provides reflective journaling prompts based on:
- Current conversation context
- User's emotional state and goals
- Therapeutic best practices

Uses HITL pattern for user confirmation before starting the activity.
"""

from src.nodes.journaling_prompt.node import provide_journaling_prompt
from src.nodes.journaling_prompt.prompts import JOURNALING_PROMPTS, get_prompts_by_category
from src.nodes.journaling_prompt.types import (
    JournalingActivityData,
    JournalingConfirmation,
    JournalingPrompt,
    UserResponse,
)

__all__ = [
    "JOURNALING_PROMPTS",
    "JournalingActivityData",
    "JournalingConfirmation",
    "JournalingPrompt",
    "UserResponse",
    "get_prompts_by_category",
    "provide_journaling_prompt",
]
