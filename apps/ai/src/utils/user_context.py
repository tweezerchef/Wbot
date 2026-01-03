"""
============================================================================
User Context Formatting
============================================================================
Transforms user profile data into natural language for the system prompt.

The onboarding questions store structured data like:
    {"primary_goal": "stress_anxiety", "communication_style": "direct"}

This module converts that into readable context:
    "Their main goal is managing stress and anxiety.
     They prefer direct, to-the-point communication."

This helps the AI understand the user without exposing raw data
in the conversation.
============================================================================
"""


def format_user_context(context: dict[str, object] | None) -> str:
    """
    Formats user context into a readable string for the system prompt.

    Takes the user profile data (from authentication) and converts
    preferences into natural language descriptions.

    Args:
        context: User context dict containing:
                 - user_id: UUID
                 - display_name: Optional display name
                 - email: User's email
                 - preferences: Dict of onboarding answers

    Returns:
        A formatted string describing the user's preferences and needs.
        If no context or preferences, returns a generic message.

    Example:
        >>> context = {
        ...     "display_name": "Alex",
        ...     "preferences": {
        ...         "primary_goal": "stress_anxiety",
        ...         "communication_style": "direct"
        ...     }
        ... }
        >>> print(format_user_context(context))
        The user's name is Alex.
        Their main goal is managing stress and anxiety.
        They prefer direct, to-the-point communication.
    """
    if not context:
        return "No user context available. Use a warm, general approach."

    preferences = context.get("preferences", {})
    if not preferences:
        return "User has not completed onboarding. Use a warm, general approach."

    lines = []

    # Add display name if available
    _add_display_name(lines, context)

    # Add preference-based context
    _add_current_feeling(lines, preferences)
    _add_primary_goal(lines, preferences)
    _add_challenges(lines, preferences)
    _add_communication_style(lines, preferences)
    _add_support_type(lines, preferences)
    _add_preferred_activities(lines, preferences)
    _add_experience_level(lines, preferences)
    _add_session_length(lines, preferences)

    return "\n".join(lines) if lines else "No specific preferences available."


# =============================================================================
# Helper Functions - Each handles one preference type
# =============================================================================


def _add_display_name(lines: list[str], context: dict[str, object]) -> None:
    """Adds the user's display name if available."""
    if name := context.get("display_name"):
        lines.append(f"The user's name is {name}.")


def _add_current_feeling(lines: list[str], preferences: dict[str, object]) -> None:
    """Adds context about how the user was feeling at signup."""
    feeling_map = {
        "great": "feeling great and exploring the app out of curiosity",
        "okay": "feeling okay but looking to feel better",
        "stressed": "feeling stressed or overwhelmed",
        "anxious": "feeling anxious or worried",
        "sad": "feeling sad or down",
        "numb": "feeling numb or disconnected from their emotions",
    }

    if feeling := preferences.get("current_feeling"):
        description = feeling_map.get(feeling, feeling)
        lines.append(f"When they signed up, they were {description}.")


def _add_primary_goal(lines: list[str], preferences: dict[str, object]) -> None:
    """Adds the user's main goal for using the app."""
    goal_map = {
        "stress_anxiety": "managing stress and anxiety",
        "mood": "improving their mood",
        "sleep": "sleeping better",
        "emotions": "processing difficult emotions",
        "habits": "building better habits",
        "growth": "personal growth and self-discovery",
        "talk": "having someone to talk to",
    }

    if goal := preferences.get("primary_goal"):
        description = goal_map.get(goal, goal)
        lines.append(f"Their main goal is {description}.")


def _add_challenges(lines: list[str], preferences: dict[str, object]) -> None:
    """Adds the challenges the user faces."""
    challenge_map = {
        "racing_thoughts": "racing thoughts",
        "sleep_issues": "trouble sleeping",
        "work_stress": "work or school stress",
        "relationships": "relationship difficulties",
        "low_motivation": "low motivation",
        "negative_self_talk": "negative self-talk",
        "isolation": "feeling isolated",
        "focus": "difficulty focusing",
    }

    if (
        (challenges := preferences.get("challenges"))
        and isinstance(challenges, list)
        and challenges
    ):
        challenge_names = [challenge_map.get(c, c) for c in challenges]
        lines.append(f"They struggle with: {', '.join(challenge_names)}.")


def _add_communication_style(lines: list[str], preferences: dict[str, object]) -> None:
    """Adds the user's preferred communication style."""
    style_map = {
        "direct": "direct, to-the-point communication",
        "warm": "warm, conversational communication",
        "reflective": "thoughtful, reflective communication with space to think",
        "structured": "structured communication with clear steps and frameworks",
    }

    if style := preferences.get("communication_style"):
        description = style_map.get(style, style)
        lines.append(f"They prefer {description}.")


def _add_support_type(lines: list[str], preferences: dict[str, object]) -> None:
    """Adds what type of support the user finds most helpful."""
    support_map = {
        "listening": "someone to listen without judgment",
        "advice": "practical advice and actionable strategies",
        "encouragement": "encouragement and validation of their feelings",
        "understanding": "help understanding and naming their feelings",
        "guided": "guidance through structured exercises and activities",
    }

    if support := preferences.get("support_type"):
        description = support_map.get(support, support)
        lines.append(f"They find it most helpful when they receive {description}.")


def _add_preferred_activities(lines: list[str], preferences: dict[str, object]) -> None:
    """Adds the activities the user is interested in."""
    activity_map = {
        "chat": "talking through their thoughts",
        "breathing": "breathing exercises",
        "meditation": "guided meditation",
        "journaling": "journaling and writing prompts",
        "grounding": "grounding techniques",
        "mood_tracking": "tracking their mood over time",
    }

    if (
        (activities := preferences.get("preferred_activities"))
        and isinstance(activities, list)
        and activities
    ):
        activity_names = [activity_map.get(a, a) for a in activities]
        lines.append(f"They're interested in: {', '.join(activity_names)}.")


def _add_experience_level(lines: list[str], preferences: dict[str, object]) -> None:
    """Adds the user's experience with wellness apps."""
    experience_map = {
        "first_time": "This is their first time using a wellness app or exploring these topics.",
        "tried_apps": "They've tried wellness apps before but didn't stick with them. Consider what might make this experience different.",
        "some_therapy": "They have some experience with wellness practices, so they may be familiar with wellness concepts.",
        "regular_practice": "They practice wellness regularly and may appreciate more advanced techniques.",
    }

    if (experience := preferences.get("experience_level")) and (
        description := experience_map.get(experience)
    ):
        lines.append(description)


def _add_session_length(lines: list[str], preferences: dict[str, object]) -> None:
    """Adds how much time the user has for sessions."""
    length_map = {
        "few_minutes": "They only have a few minutes per session, so keep interactions focused.",
        "short": "They prefer 5-10 minute sessions, balancing depth with brevity.",
        "medium": "They prefer 10-20 minute sessions, allowing for meaningful exploration.",
        "long": "They're willing to spend 20+ minutes per session for deeper work.",
        "flexible": "Their available time varies, so ask about their current availability when relevant.",
    }

    if (length := preferences.get("session_length")) and (description := length_map.get(length)):
        lines.append(description)
