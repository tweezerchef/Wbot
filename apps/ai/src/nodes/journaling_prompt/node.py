"""
============================================================================
Journaling Prompt Node
============================================================================
Guides users through reflective journaling with AI-generated prompts.

This node implements the human-in-the-loop pattern:
1. Analyzes conversation context to select appropriate prompt
2. Uses interrupt() to present prompt to user
3. User confirms, changes prompt, or declines
4. Returns structured activity data for frontend rendering

Prompt categories:
- Reflection: Daily awareness and pattern recognition
- Gratitude: Appreciation and positive perspective
- Processing: Emotional processing and situation analysis
- Growth: Personal development and aspirations
- Self-compassion: Self-kindness and inner critic work
============================================================================
"""

import json

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from langgraph.types import interrupt

from src.graph.state import WellnessState
from src.llm.providers import ModelTier, create_resilient_llm
from src.logging_config import NodeLogger

from .prompts import JOURNALING_PROMPTS
from .types import (
    JournalingActivityData,
    JournalingConfirmation,
    JournalingPrompt,
    UserResponse,
)

# Set up logging for this node
logger = NodeLogger("journaling_prompt")


# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------


def get_last_user_message(messages: list[BaseMessage]) -> str:
    """Extract the content of the last human message."""
    for message in reversed(messages):
        if isinstance(message, HumanMessage):
            return str(message.content)
    return ""


def get_recent_context(messages: list[BaseMessage], count: int = 5) -> str:
    """Get recent conversation for context."""
    recent = []
    for msg in messages[-count * 2 :]:
        role = "User" if isinstance(msg, HumanMessage) else "Assistant"
        content = str(msg.content)[:200]
        recent.append(f"{role}: {content}")
    return "\n".join(recent)


async def select_prompt_with_llm(state: WellnessState) -> JournalingPrompt:
    """
    Uses the LLM to analyze conversation context and select the most
    appropriate journaling prompt.

    The LLM considers:
    - User's recent messages and emotional state
    - User preferences from their profile
    - The benefits of each prompt category
    - Retrieved memories for personalization
    """
    messages = state.get("messages", [])
    user_context = state.get("user_context", {})
    memories = state.get("retrieved_memories", [])

    last_message = get_last_user_message(messages)
    context = get_recent_context(messages)

    # Build prompt info for LLM
    prompts_info = "\n".join(
        [
            f"- {p['id']}: [{p['category']}] {p['text'][:60]}... (Best for: {', '.join(p['best_for'])})"
            for p in JOURNALING_PROMPTS.values()
        ]
    )

    # Include relevant memories if available
    memories_context = ""
    if memories:
        memory_snippets = [str(m.get("combined_text", ""))[:100] for m in memories[:3]]
        memories_context = f"\nRelevant user history: {memory_snippets}"

    # Get list of valid IDs for validation
    valid_ids = set(JOURNALING_PROMPTS.keys())

    selection_prompt = f"""You are helping select a journaling prompt for a user seeking reflective writing.

Available prompts:
{prompts_info}

Recent conversation:
{context}
{memories_context}

User's recent message: "{last_message}"
User preferences: {user_context.get("preferences", {})}

Selection guidelines:
- For emotional distress/anxiety/overwhelm: prefer 'processing' category
- For self-criticism/doubt/shame: prefer 'self_compassion' category
- For positive mood/appreciation: prefer 'gratitude' category
- For seeking direction/motivation/goals: prefer 'growth' category
- For general check-in/mindfulness/awareness: prefer 'reflection' category

Consider the emotional tone of the conversation and what would be most helpful.

Respond with ONLY the prompt ID (one of: {", ".join(valid_ids)}).
"""

    try:
        llm = create_resilient_llm(tier=ModelTier.FAST, temperature=0.3, max_tokens=30)
        response = await llm.ainvoke([HumanMessage(content=selection_prompt)])
        prompt_id = str(response.content).strip().lower()

        if prompt_id in JOURNALING_PROMPTS:
            return JOURNALING_PROMPTS[prompt_id]
    except Exception as e:
        logger.warning("LLM prompt selection failed", error=str(e))

    # Default to reflection prompt
    return JOURNALING_PROMPTS["reflect_today"]


def format_journaling_message(
    prompt: JournalingPrompt,
    introduction: str,
    conversation_context: str,
) -> str:
    """
    Formats the journaling activity configuration as a message with activity markers.

    The frontend parses content between [ACTIVITY_START] and [ACTIVITY_END]
    markers to render the interactive journaling component.
    """
    activity_data: JournalingActivityData = {
        "type": "activity",
        "activity": "journaling",
        "status": "ready",
        "prompt": prompt,
        "introduction": introduction,
        "enable_sharing": True,
        "conversation_context": conversation_context,
    }

    return f"[ACTIVITY_START]{json.dumps(activity_data)}[ACTIVITY_END]"


def generate_introduction(prompt: JournalingPrompt, user_name: str) -> str:
    """Generate personalized introduction based on prompt category."""
    category_intros = {
        "reflection": f"Let's take a moment to reflect, {user_name}.",
        "gratitude": f"I'd love for you to explore some gratitude, {user_name}.",
        "processing": (
            f"It sounds like you have a lot on your mind, {user_name}. "
            "Let's work through it together."
        ),
        "growth": f"Let's explore your growth journey, {user_name}.",
        "self_compassion": (
            f"I think some self-compassion might be helpful right now, {user_name}."
        ),
    }

    base_intro = category_intros.get(
        prompt["category"], f"Here's a journaling prompt for you, {user_name}."
    )

    return (
        f"{base_intro} Take your time with this - there's no right or wrong way "
        "to respond. Write as much or as little as feels right."
    )


# -----------------------------------------------------------------------------
# Main Node Function
# -----------------------------------------------------------------------------


async def provide_journaling_prompt(
    state: WellnessState,
) -> dict[str, list[AIMessage]]:
    """
    Offers a journaling prompt based on conversation context.

    Flow:
    1. Analyze conversation context to select appropriate prompt
    2. Use interrupt() to present prompt and get user confirmation
    3. Handle user's decision (start, change prompt, or decline)
    4. Return activity configuration for frontend rendering

    Args:
        state: Current conversation state including messages and user context

    Returns:
        Dict with messages containing journaling activity configuration
    """
    logger.node_start()

    user_context = state.get("user_context", {})
    user_name = user_context.get("display_name", "there")

    # Step 1: Select the most appropriate prompt using LLM
    selected_prompt = await select_prompt_with_llm(state)
    logger.info(
        "Selected prompt",
        prompt=selected_prompt["id"],
        category=selected_prompt["category"],
    )

    # Step 2: Use HITL interrupt to get user confirmation
    available_prompts = list(JOURNALING_PROMPTS.values())

    confirmation_data: JournalingConfirmation = {
        "type": "journaling_confirmation",
        "proposed_prompt": selected_prompt,
        "message": ("I have a journaling prompt that might help with what you're experiencing."),
        "available_prompts": available_prompts,
        "options": ["start", "change_prompt", "not_now"],
    }
    user_response: UserResponse = interrupt(confirmation_data)

    # Step 3: Handle user's decision
    decision = user_response.get("decision", "start")

    if decision == "not_now":
        logger.info("User declined journaling")
        logger.node_end()
        return {
            "messages": [
                AIMessage(
                    content=(
                        f"No problem, {user_name}! Journaling is here whenever you're ready. "
                        "Sometimes just talking through things helps too - I'm here to listen."
                    )
                )
            ]
        }

    if decision == "change_prompt":
        new_prompt_id = user_response.get("prompt_id", "reflect_today")
        if new_prompt_id in JOURNALING_PROMPTS:
            selected_prompt = JOURNALING_PROMPTS[new_prompt_id]
            logger.info("User changed prompt", new=selected_prompt["id"])

    # Step 4: Generate personalized introduction
    introduction = generate_introduction(selected_prompt, user_name)

    # Get brief context for the activity data
    context_summary = get_recent_context(state.get("messages", []), count=2)

    # Step 5: Format and return activity message
    journaling_message = format_journaling_message(
        selected_prompt,
        introduction,
        context_summary[:200],  # Brief context for the frontend
    )

    logger.node_end()

    return {"messages": [AIMessage(content=journaling_message)]}
