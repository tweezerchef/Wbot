"""
============================================================================
Journaling Prompt Library
============================================================================
Curated prompts for reflective journaling across 5 categories:
- Reflection: Daily awareness and pattern recognition
- Gratitude: Appreciation and positive perspective
- Processing: Emotional processing and situation analysis
- Growth: Personal development and aspirations
- Self-compassion: Self-kindness and inner critic work
============================================================================
"""

from .types import JournalingPrompt

JOURNALING_PROMPTS: dict[str, JournalingPrompt] = {
    # -------------------------------------------------------------------------
    # Reflection Prompts
    # -------------------------------------------------------------------------
    "reflect_today": {
        "id": "reflect_today",
        "category": "reflection",
        "text": "What moment from today stands out to you, and what made it significant?",
        "follow_up_questions": [
            "How did this moment make you feel?",
            "What would you like to remember about it?",
        ],
        "estimated_time_minutes": 5,
        "best_for": ["daily reflection", "mindfulness", "presence"],
    },
    "reflect_patterns": {
        "id": "reflect_patterns",
        "category": "reflection",
        "text": "What patterns have you noticed in your thoughts or behaviors lately?",
        "follow_up_questions": [
            "Are these patterns serving you well?",
            "What might be driving these patterns?",
        ],
        "estimated_time_minutes": 10,
        "best_for": ["self-awareness", "understanding", "insight"],
    },
    # -------------------------------------------------------------------------
    # Gratitude Prompts
    # -------------------------------------------------------------------------
    "gratitude_simple": {
        "id": "gratitude_simple",
        "category": "gratitude",
        "text": "What are three things you're grateful for right now, and why?",
        "follow_up_questions": [
            "How do these things contribute to your wellbeing?",
        ],
        "estimated_time_minutes": 5,
        "best_for": ["positivity", "perspective", "appreciation"],
    },
    "gratitude_challenge": {
        "id": "gratitude_challenge",
        "category": "gratitude",
        "text": "Think of a recent challenge. What unexpected gift or lesson came from it?",
        "follow_up_questions": [
            "How has this challenge helped you grow?",
            "What strength did you discover in yourself?",
        ],
        "estimated_time_minutes": 8,
        "best_for": ["resilience", "reframing", "growth mindset"],
    },
    # -------------------------------------------------------------------------
    # Processing Prompts
    # -------------------------------------------------------------------------
    "process_emotions": {
        "id": "process_emotions",
        "category": "processing",
        "text": "What emotion has been most present for you lately? Describe it without judgment.",
        "follow_up_questions": [
            "Where do you feel this emotion in your body?",
            "What might this emotion be trying to tell you?",
        ],
        "estimated_time_minutes": 10,
        "best_for": ["emotional processing", "anxiety", "overwhelm"],
    },
    "process_situation": {
        "id": "process_situation",
        "category": "processing",
        "text": "Describe a situation that's been on your mind. Write it as if telling a caring friend.",
        "follow_up_questions": [
            "What do you need most right now regarding this situation?",
            "What would you tell a friend in the same situation?",
        ],
        "estimated_time_minutes": 12,
        "best_for": ["venting", "clarity", "problem-solving"],
    },
    # -------------------------------------------------------------------------
    # Growth Prompts
    # -------------------------------------------------------------------------
    "growth_aspirations": {
        "id": "growth_aspirations",
        "category": "growth",
        "text": "Describe the person you're becoming. What qualities are you developing?",
        "follow_up_questions": [
            "What small step could you take today toward this vision?",
            "What would your future self thank you for?",
        ],
        "estimated_time_minutes": 8,
        "best_for": ["motivation", "vision", "goal-setting"],
    },
    "growth_learning": {
        "id": "growth_learning",
        "category": "growth",
        "text": "What has life been teaching you recently? How are you applying these lessons?",
        "follow_up_questions": [
            "What wisdom would you share with your past self?",
            "How might this lesson shape your future decisions?",
        ],
        "estimated_time_minutes": 10,
        "best_for": ["wisdom", "integration", "progress"],
    },
    # -------------------------------------------------------------------------
    # Self-Compassion Prompts
    # -------------------------------------------------------------------------
    "compassion_letter": {
        "id": "compassion_letter",
        "category": "self_compassion",
        "text": "Write a letter to yourself from the perspective of a loving, wise friend.",
        "follow_up_questions": [
            "What would this friend want you to know?",
            "What encouragement would they offer?",
        ],
        "estimated_time_minutes": 10,
        "best_for": ["self-criticism", "self-doubt", "healing"],
    },
    "compassion_struggle": {
        "id": "compassion_struggle",
        "category": "self_compassion",
        "text": "What are you being hard on yourself about? What would you say to someone else in the same situation?",
        "follow_up_questions": [
            "What do you need to hear right now?",
            "How can you show yourself the same kindness you'd show a friend?",
        ],
        "estimated_time_minutes": 8,
        "best_for": ["perfectionism", "guilt", "shame"],
    },
}


def get_prompts_by_category(
    category: str,
) -> list[JournalingPrompt]:
    """Get all prompts for a specific category."""
    return [p for p in JOURNALING_PROMPTS.values() if p["category"] == category]


def get_all_categories() -> list[str]:
    """Get list of all available categories."""
    return ["reflection", "gratitude", "processing", "growth", "self_compassion"]
