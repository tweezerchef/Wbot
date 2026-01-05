"""
============================================================================
Analyze Profile Node
============================================================================
Analyzes conversations at the end of the graph and updates user profiles.

This node runs AFTER store_memory (and therefore after the response is
already streamed to the user), so it has ZERO latency impact on user
experience.

Key behaviors:
1. Uses FAST tier LLM (Gemini Flash) for cost-effective analysis (~100ms)
2. Extracts structured insights using Pydantic models
3. Stores analysis in database for long-term tracking
4. Updates user wellness profile with aggregated insights
5. Never fails the graph - errors are logged but don't affect user

Position in graph: store_memory -> analyze_profile -> END
============================================================================
"""

from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.runnables import RunnableConfig

from src.graph.state import WellnessState
from src.llm.providers import ModelTier, create_llm
from src.logging_config import NodeLogger

from .models import ConversationAnalysis
from .storage import (
    store_conversation_analysis,
    store_emotional_snapshot,
    update_activity_effectiveness,
    update_wellness_profile,
)

logger = NodeLogger("analyze_profile")


async def analyze_profile(state: WellnessState, config: RunnableConfig) -> dict[str, object]:
    """
    Analyzes the conversation and updates the user's wellness profile.

    This node:
    1. Extracts the conversation context
    2. Runs LLM analysis to extract structured insights
    3. Stores the analysis in the database
    4. Updates the user's wellness profile with trends
    5. Records emotional snapshots for time-series tracking
    6. Updates activity effectiveness if an activity was completed

    Args:
        state: Current graph state after response generation
        config: LangGraph config containing user info

    Returns:
        Empty dict (side-effect only node)

    Note:
        - Runs after response is streamed (zero latency impact)
        - Errors are logged but never fail the graph
        - Skips analysis for very short conversations (< 2 messages)
    """
    logger.node_start()

    try:
        # Extract user context
        user_context = state.get("user_context", {})
        user_id = user_context.get("user_id")

        if not user_id:
            logger.info("Skipping analysis", reason="no_user_id")
            logger.node_end()
            return {}

        # Get conversation context
        configurable = config.get("configurable", {})
        conversation_id = configurable.get("thread_id")
        messages = state.get("messages", [])

        # Skip analysis for very short conversations
        if len(messages) < 2:
            logger.info("Skipping analysis", reason="too_few_messages")
            logger.node_end()
            return {}

        # Count user messages (need at least 1)
        user_messages = [m for m in messages if isinstance(m, HumanMessage)]
        if not user_messages:
            logger.info("Skipping analysis", reason="no_user_messages")
            logger.node_end()
            return {}

        # Build analysis prompt
        analysis_prompt = _build_analysis_prompt(messages)

        # Use FAST tier for cost-effective analysis (~100ms)
        llm = create_llm(tier=ModelTier.FAST, temperature=0.1)
        structured_llm = llm.with_structured_output(ConversationAnalysis)

        # Run analysis
        analysis: ConversationAnalysis = await structured_llm.ainvoke(analysis_prompt)

        logger.info(
            "Analysis complete",
            emotion=analysis.primary_emotion,
            intensity=f"{analysis.emotion_intensity:.1f}",
            type=analysis.conversation_type,
        )

        # Generate summary for semantic search (used in Phase 4)
        analysis_summary = _generate_analysis_summary(analysis)

        # Store the analysis (awaited for reliability)
        await store_conversation_analysis(
            user_id=user_id,
            conversation_id=conversation_id,
            analysis=analysis,
            analysis_summary=analysis_summary,
        )

        # Record emotional snapshot for time-series tracking
        await store_emotional_snapshot(
            user_id=user_id,
            analysis=analysis,
            conversation_id=conversation_id,
            source="conversation",
        )

        # Update wellness profile with aggregated insights
        await update_wellness_profile(user_id=user_id, analysis=analysis)

        # If an activity was completed, update effectiveness metrics
        if state.get("exercise_completed"):
            activity_type = state.get("suggested_activity")
            technique = state.get("exercise_technique")

            if activity_type:
                # For now, we don't have mood_before/after from state
                # This will be enhanced when BreathingExercise passes mood data
                await update_activity_effectiveness(
                    user_id=user_id,
                    activity_type=activity_type,
                    technique=technique,
                    mood_before=None,
                    mood_after=None,
                    completed=True,
                )

        logger.info("Profile analysis complete")

    except Exception as e:
        # Log error but don't fail - user already has their response
        logger.error("Analysis failed", error=str(e))

    logger.node_end()
    return {}


def _build_analysis_prompt(messages: list[BaseMessage]) -> str:
    """
    Builds the analysis prompt from conversation messages.

    Formats the last 10 messages (to keep context manageable) and
    constructs a prompt for structured analysis extraction.

    Args:
        messages: List of conversation messages

    Returns:
        Formatted prompt string for the LLM
    """
    # Take last 10 messages for context (truncate long conversations)
    recent = messages[-10:] if len(messages) > 10 else messages

    # Format messages (truncate individual messages to 500 chars)
    formatted_messages = []
    for msg in recent:
        role = "User" if isinstance(msg, HumanMessage) else "Assistant"
        content = str(msg.content)[:500]
        if len(str(msg.content)) > 500:
            content += "..."
        formatted_messages.append(f"{role}: {content}")

    conversation_text = "\n".join(formatted_messages)

    return f"""Analyze this wellness conversation and extract structured insights.
Focus on the user's emotional state, concerns, and what might help them.

## Conversation
{conversation_text}

## Instructions
Analyze the conversation above and extract:

1. **Emotional State**: Identify the primary emotion, its intensity (0-1), and valence (-1 to 1).
   Consider: anxiety, stress, sadness, calm, joy, neutral, frustration, hope, etc.

2. **Trajectory**: How did the user's emotional state change during the conversation?
   Options: improving, stable, declining, fluctuating

3. **Topics & Concerns**: What were the main topics discussed? What specific concerns did the user raise?

4. **Positive Aspects**: Note any positive things mentioned (achievements, gratitude, progress).

5. **Triggers**: Identify any stress triggers mentioned (work, relationships, health, finances, etc.).

6. **Conversation Type**: Categorize the conversation:
   - venting: User expressing feelings without seeking solutions
   - seeking_advice: User wants guidance or suggestions
   - checking_in: Brief status update or casual chat
   - doing_activity: User participated in an activity (breathing, meditation)
   - general_chat: Light conversation without specific wellness focus

7. **Engagement Level**: Rate user engagement as high, medium, or low.

8. **Follow-ups**: What topics should be revisited in future conversations?

9. **Activities**: What activities might help this user? (breathing, meditation, journaling, grounding)

Be specific and actionable in your analysis. Base your assessment on concrete evidence from the conversation."""


def _generate_analysis_summary(analysis: ConversationAnalysis) -> str:
    """
    Generates a text summary of the analysis for semantic search.

    This summary will be embedded for similarity search across
    past conversation analyses (Phase 4).

    Args:
        analysis: The structured analysis

    Returns:
        A concise text summary suitable for embedding
    """
    parts = []

    # Emotional state
    parts.append(f"Primary emotion: {analysis.primary_emotion}")
    if analysis.emotional_trajectory != "stable":
        parts.append(f"Mood {analysis.emotional_trajectory}")

    # Topics
    if analysis.topics_discussed:
        parts.append(f"Topics: {', '.join(analysis.topics_discussed[:3])}")

    # Concerns
    if analysis.concerns_raised:
        parts.append(f"Concerns: {', '.join(analysis.concerns_raised[:3])}")

    # Triggers
    if analysis.detected_triggers:
        parts.append(f"Triggers: {', '.join(analysis.detected_triggers[:3])}")

    # Positive aspects
    if analysis.positive_aspects:
        parts.append(f"Positives: {', '.join(analysis.positive_aspects[:2])}")

    # Conversation type
    parts.append(f"Type: {analysis.conversation_type}")

    return ". ".join(parts)
