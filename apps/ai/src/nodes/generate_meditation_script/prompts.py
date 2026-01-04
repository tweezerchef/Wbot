"""
============================================================================
Meditation Script Generation Prompts
============================================================================
Prompts for generating personalized meditation scripts.

Used with OpenAI Chat Completions (gpt-4o-mini-audio-preview) to generate
both the meditation text AND audio in a single API call.

These prompts incorporate:
- User context (name, preferences, goals)
- Relevant memories from past conversations
- Time of day for appropriate meditation style
- Current emotional state from conversation
============================================================================
"""

# Word counts for different durations (based on ~120 words per minute for meditation pace)
DURATION_WORD_COUNTS = {
    5: 500,  # 5 minutes
    7: 700,  # 7 minutes
    10: 1000,  # 10 minutes
    15: 1500,  # 15 minutes
}

# Meditation type descriptions for the LLM
MEDITATION_TYPE_DESCRIPTIONS = {
    "body_scan": (
        "A progressive relaxation that moves attention through different parts of the body, "
        "releasing tension and cultivating awareness of physical sensations."
    ),
    "breathing_focus": (
        "A mindfulness meditation using the breath as an anchor for attention. "
        "Gentle guidance to observe the natural rhythm of breathing."
    ),
    "loving_kindness": (
        "A compassion meditation that cultivates feelings of love and kindness, "
        "starting with self and expanding to others."
    ),
    "anxiety_relief": (
        "A grounding meditation for difficult emotions. Uses present-moment awareness "
        "and self-compassion to work through stress and anxiety."
    ),
    "sleep": (
        "A deeply relaxing meditation designed to prepare mind and body for restful sleep. "
        "Progressive relaxation with calming imagery."
    ),
    "daily_mindfulness": (
        "A general mindfulness practice for presence and clarity. "
        "Balances breath awareness with open awareness."
    ),
}

# Time of day guidance
TIME_OF_DAY_GUIDANCE = {
    "morning": (
        "This is a morning meditation. The tone should be gently awakening, "
        "helping the listener transition into an alert but calm state for the day ahead."
    ),
    "afternoon": (
        "This is an afternoon meditation. The tone should be refreshing, "
        "helping the listener reset and regain focus midway through their day."
    ),
    "evening": (
        "This is an evening meditation. The tone should be winding down, "
        "helping the listener transition from the active day to a more restful state."
    ),
    "night": (
        "This is a night/bedtime meditation. The tone should be deeply calming, "
        "preparing the listener for sleep with a progressively slower pace."
    ),
}


def build_script_generation_prompt(
    meditation_type: str,
    duration_minutes: int,
    user_name: str | None,
    primary_goal: str | None,
    time_of_day: str,
    user_request: str,
    memories: list[dict] | None,
    emotional_signals: list[str] | None,
) -> str:
    """
    Builds the prompt for Claude to generate a personalized meditation script.

    Args:
        meditation_type: Type of meditation (body_scan, breathing_focus, etc.)
        duration_minutes: Target duration in minutes
        user_name: User's display name (optional)
        primary_goal: User's wellness goal from preferences
        time_of_day: morning, afternoon, evening, or night
        user_request: The user's latest message/request
        memories: Relevant past conversation memories
        emotional_signals: Detected emotional indicators from conversation

    Returns:
        The complete prompt string for script generation
    """
    word_count = DURATION_WORD_COUNTS.get(duration_minutes, 700)
    type_description = MEDITATION_TYPE_DESCRIPTIONS.get(
        meditation_type, MEDITATION_TYPE_DESCRIPTIONS["breathing_focus"]
    )
    time_guidance = TIME_OF_DAY_GUIDANCE.get(time_of_day, "")

    # Format user context
    name_line = f"The listener's name is {user_name}." if user_name else ""
    goal_line = f"Their primary wellness goal is: {primary_goal}." if primary_goal else ""

    # Format memories
    memories_section = ""
    if memories:
        formatted_memories = []
        for i, m in enumerate(memories[:3], 1):
            formatted_memories.append(
                f'  {i}. User said: "{m.get("user_message", "")[:100]}..."\n'
                f"     Context: {m.get('ai_response', '')[:100]}..."
            )
        memories_section = (
            "## Relevant Context from Past Conversations\n"
            "Use these to personalize the meditation (reference naturally if appropriate):\n"
            + "\n".join(formatted_memories)
        )

    # Format emotional signals
    emotional_section = ""
    if emotional_signals:
        emotional_section = (
            f"## Detected Emotional State\n"
            f"The user seems to be experiencing: {', '.join(emotional_signals)}.\n"
            f"Address these feelings compassionately in the meditation."
        )

    return f"""Generate a personalized {duration_minutes}-minute {meditation_type.replace("_", " ")} meditation script.

## Meditation Type
{type_description}

## Time Context
{time_guidance}

## User Context
{name_line}
{goal_line}
Current request: "{user_request}"

{memories_section}

{emotional_section}

## Script Requirements

1. **Personalization**:
   - Address the user by name 2-3 times (naturally, not forced)
   - Reference their specific situation when relevant
   - Acknowledge what they're going through

2. **Structure**:
   - Opening (1-2 min): Settling in, grounding, initial breath awareness
   - Main Practice ({duration_minutes - 3} min): Core meditation technique
   - Closing (1-2 min): Integration, returning to awareness, gentle transition out

3. **Pacing**:
   - Include pause markers: [PAUSE 3s], [PAUSE 5s], [PAUSE 10s]
   - Use pauses generously - meditation should feel spacious
   - Aim for approximately {word_count} words for {duration_minutes} minutes

4. **Tone**:
   - Warm, gentle, unhurried
   - Second person ("you") throughout
   - Present tense for instructions
   - Avoid commands; use invitations ("you might notice...", "allow yourself to...")

5. **Format**:
   - Plain text, no markdown
   - Each paragraph is a natural speaking section
   - Line breaks between major transitions

Generate ONLY the meditation script. No titles, headers, or commentary.
Begin the script now:
"""


def build_title_generation_prompt(
    meditation_type: str,
    user_name: str | None,
    primary_intent: str,
    duration_minutes: int,
) -> str:
    """
    Builds a prompt to generate a title for the meditation.

    Args:
        meditation_type: Type of meditation
        user_name: User's name (optional)
        primary_intent: Main purpose/request
        duration_minutes: Duration in minutes

    Returns:
        Prompt for generating a short, descriptive title
    """
    return f"""Generate a short, calming title for this personalized meditation.

Type: {meditation_type.replace("_", " ")}
Duration: {duration_minutes} minutes
Purpose: {primary_intent}
{"Personalized for: " + user_name if user_name else ""}

Requirements:
- 3-6 words maximum
- Calming, inviting tone
- No quotes or punctuation
- Examples: "Evening Calm for Sarah", "Gentle Breathing Practice", "Finding Peace Within"

Respond with ONLY the title:
"""


# System prompt for OpenAI audio model - instructs how to speak
OPENAI_MEDITATION_SYSTEM_PROMPT = """You are a calm, soothing meditation guide creating a personalized guided meditation.

Voice and Delivery:
- Speak slowly and gently with natural pauses between sentences
- Use a warm, nurturing tone throughout
- Allow silence between sections for the listener to breathe
- Your pace should be relaxed and unhurried

Style:
- Use invitations rather than commands ("you might notice..." instead of "notice...")
- Speak in second person ("you")
- Be compassionate and non-judgmental
- Create a safe, peaceful atmosphere

Generate the complete meditation now, speaking it as you would guide someone in person."""


def build_spoken_meditation_prompt(
    meditation_type: str,
    duration_minutes: int,
    user_name: str | None,
    primary_goal: str | None,
    time_of_day: str,
    user_request: str,
    memories: list[dict] | None,
    emotional_signals: list[str] | None,
) -> str:
    """
    Builds the prompt for OpenAI to generate AND speak a personalized meditation.

    This prompt is optimized for the gpt-4o-mini-audio-preview model which
    will generate both text AND audio in a single call. The model will
    speak the meditation directly with natural pacing.

    Args:
        meditation_type: Type of meditation (body_scan, breathing_focus, etc.)
        duration_minutes: Target duration in minutes
        user_name: User's display name (optional)
        primary_goal: User's wellness goal from preferences
        time_of_day: morning, afternoon, evening, or night
        user_request: The user's latest message/request
        memories: Relevant past conversation memories
        emotional_signals: Detected emotional indicators from conversation

    Returns:
        The complete prompt string for meditation generation
    """
    word_count = DURATION_WORD_COUNTS.get(duration_minutes, 700)
    type_description = MEDITATION_TYPE_DESCRIPTIONS.get(
        meditation_type, MEDITATION_TYPE_DESCRIPTIONS["breathing_focus"]
    )
    time_guidance = TIME_OF_DAY_GUIDANCE.get(time_of_day, "")

    # Format user context
    name_context = f"Address the listener as {user_name}." if user_name else ""
    goal_context = f"Their wellness goal: {primary_goal}." if primary_goal else ""

    # Format memories for context
    memories_context = ""
    if memories:
        memory_lines = []
        for m in memories[:3]:
            user_msg = m.get("user_message", "")[:80]
            if user_msg:
                memory_lines.append(f'- They mentioned: "{user_msg}"')
        if memory_lines:
            memories_context = "Relevant context from past conversations:\n" + "\n".join(
                memory_lines
            )

    # Format emotional signals
    emotional_context = ""
    if emotional_signals:
        emotional_context = (
            f"The listener is experiencing: {', '.join(emotional_signals)}. "
            "Acknowledge this compassionately in the meditation."
        )

    return f"""Create and speak a personalized {duration_minutes}-minute {meditation_type.replace("_", " ")} meditation.

MEDITATION TYPE:
{type_description}

TIME OF DAY:
{time_guidance}

PERSONALIZATION:
{name_context}
{goal_context}
Their request: "{user_request}"

{memories_context}

{emotional_context}

STRUCTURE:
- Opening (1-2 min): Settling in, grounding, initial breath awareness
- Main Practice ({max(1, duration_minutes - 3)} min): Core meditation technique
- Closing (1-2 min): Integration, returning to awareness, gentle transition

REQUIREMENTS:
- Aim for approximately {word_count} words
- Use natural pauses between sections (no need for pause markers)
- Personalize with their name 2-3 times naturally
- Reference their specific situation when relevant

Speak the complete meditation now:"""
