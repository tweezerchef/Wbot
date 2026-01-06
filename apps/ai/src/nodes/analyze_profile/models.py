"""
============================================================================
Analyze Profile Models
============================================================================
Pydantic models for structured LLM output during conversation analysis.

These models ensure reliable, type-safe extraction of insights from
conversations using the FAST tier LLM with structured output.
============================================================================
"""

from pydantic import BaseModel, Field


class ConversationAnalysis(BaseModel):
    """
    Structured output for conversation analysis.

    This model captures emotional state, topics, concerns, and actionable
    insights from a wellness conversation.
    """

    # Emotional state
    primary_emotion: str = Field(
        description="Main emotion detected: anxiety, stress, sadness, calm, joy, neutral, etc."
    )
    emotion_intensity: float = Field(
        ge=0,
        le=1,
        description="Intensity of the emotion from 0 (barely noticeable) to 1 (overwhelming)",
    )
    emotional_valence: float = Field(
        ge=-1,
        le=1,
        description="Emotional valence from -1 (very negative) to 1 (very positive)",
    )
    emotional_trajectory: str = Field(
        description="How emotion changed during conversation: improving, stable, declining, or fluctuating"
    )

    # Content analysis
    topics_discussed: list[str] = Field(
        default_factory=list,
        description="Main topics covered in the conversation",
    )
    concerns_raised: list[str] = Field(
        default_factory=list,
        description="Specific worries, issues, or problems mentioned",
    )
    positive_aspects: list[str] = Field(
        default_factory=list,
        description="Positive things mentioned (achievements, good experiences, gratitude)",
    )
    detected_triggers: list[str] = Field(
        default_factory=list,
        description="Stress triggers identified (work, relationships, health, etc.)",
    )

    # Session characterization
    conversation_type: str = Field(
        description="Type of conversation: venting, seeking_advice, checking_in, doing_activity, general_chat"
    )
    engagement_level: str = Field(description="User engagement level: high, medium, or low")

    # Actionable insights
    follow_up_topics: list[str] = Field(
        default_factory=list,
        description="Topics to revisit or check in about in future conversations",
    )
    suggested_activities: list[str] = Field(
        default_factory=list,
        description="Activities that might help this user: breathing, meditation, journaling, grounding",
    )


class ProfileUpdate(BaseModel):
    """
    Updates to apply to the user's wellness profile.

    These are aggregated insights that evolve over time.
    """

    # Current state
    emotional_baseline: str | None = Field(
        default=None,
        description="Overall emotional baseline: very_positive, positive, neutral, stressed, anxious, struggling",
    )

    # Recurring patterns
    recurring_topics: list[str] = Field(
        default_factory=list,
        description="Topics that come up repeatedly",
    )
    recurring_triggers: list[str] = Field(
        default_factory=list,
        description="Stress triggers that recur",
    )

    # Progress notes
    improvements_noted: list[str] = Field(
        default_factory=list,
        description="Areas where user has shown improvement",
    )
    challenges_persisting: list[str] = Field(
        default_factory=list,
        description="Ongoing challenges the user faces",
    )
