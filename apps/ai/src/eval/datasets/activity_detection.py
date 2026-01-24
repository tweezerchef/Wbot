"""
============================================================================
Activity Detection Dataset
============================================================================
Test cases for evaluating activity detection/routing capabilities.

Each example includes:
- input: The user message to classify
- context: Optional recent conversation context
- expected_activity: The expected classification result
- difficulty: How challenging the case is (easy/medium/hard)
- category: Type of test case for analysis

Test case categories:
- explicit_request: User directly asks for an activity
- implicit_signal: User shows signs that suggest an activity
- no_activity: Normal conversation, should NOT trigger activity
- edge_case: Ambiguous or tricky scenarios
============================================================================
"""

from dataclasses import dataclass
from typing import Literal


@dataclass
class ActivityDetectionExample:
    """A single test case for activity detection evaluation."""

    # The user's message to classify
    input: str

    # Expected activity classification (None means no activity should be detected)
    expected_activity: Literal["breathing", "meditation", "journaling"] | None

    # Test case metadata
    difficulty: Literal["easy", "medium", "hard"]
    category: Literal["explicit_request", "implicit_signal", "no_activity", "edge_case"]

    # Optional conversation context (prior messages)
    context: str | None = None

    # Description of what this test case is checking
    description: str = ""


# -----------------------------------------------------------------------------
# Explicit Activity Requests (should detect with high confidence)
# -----------------------------------------------------------------------------
EXPLICIT_REQUESTS = [
    # Breathing - Direct requests
    ActivityDetectionExample(
        input="Can we do a breathing exercise?",
        expected_activity="breathing",
        difficulty="easy",
        category="explicit_request",
        description="Direct breathing exercise request",
    ),
    ActivityDetectionExample(
        input="I'd like to try some breathing techniques",
        expected_activity="breathing",
        difficulty="easy",
        category="explicit_request",
        description="Request for breathing techniques",
    ),
    ActivityDetectionExample(
        input="Let's do the 4-7-8 breathing",
        expected_activity="breathing",
        difficulty="easy",
        category="explicit_request",
        description="Specific breathing technique request",
    ),
    ActivityDetectionExample(
        input="Can you guide me through box breathing?",
        expected_activity="breathing",
        difficulty="easy",
        category="explicit_request",
        description="Named breathing exercise request",
    ),
    # Meditation - Direct requests
    ActivityDetectionExample(
        input="I want to meditate",
        expected_activity="meditation",
        difficulty="easy",
        category="explicit_request",
        description="Direct meditation request",
    ),
    ActivityDetectionExample(
        input="Can we do a guided meditation?",
        expected_activity="meditation",
        difficulty="easy",
        category="explicit_request",
        description="Guided meditation request",
    ),
    ActivityDetectionExample(
        input="I'd like to practice mindfulness",
        expected_activity="meditation",
        difficulty="easy",
        category="explicit_request",
        description="Mindfulness practice request",
    ),
    ActivityDetectionExample(
        input="Let's do a body scan meditation",
        expected_activity="meditation",
        difficulty="easy",
        category="explicit_request",
        description="Specific meditation type request",
    ),
    # Journaling - Direct requests
    ActivityDetectionExample(
        input="Can we do a journaling exercise?",
        expected_activity="journaling",
        difficulty="easy",
        category="explicit_request",
        description="Direct journaling request",
    ),
    ActivityDetectionExample(
        input="I want to write about my feelings",
        expected_activity="journaling",
        difficulty="easy",
        category="explicit_request",
        description="Writing about feelings request",
    ),
    ActivityDetectionExample(
        input="Give me a journaling prompt",
        expected_activity="journaling",
        difficulty="easy",
        category="explicit_request",
        description="Journaling prompt request",
    ),
    ActivityDetectionExample(
        input="I'd like to do some reflective writing",
        expected_activity="journaling",
        difficulty="easy",
        category="explicit_request",
        description="Reflective writing request",
    ),
]

# -----------------------------------------------------------------------------
# Implicit Signals (should detect based on emotional/situational cues)
# -----------------------------------------------------------------------------
IMPLICIT_SIGNALS = [
    # Breathing - Stress/anxiety signals
    ActivityDetectionExample(
        input="I'm feeling so anxious right now, my heart is racing",
        expected_activity="breathing",
        difficulty="medium",
        category="implicit_signal",
        description="Physical anxiety symptoms",
    ),
    ActivityDetectionExample(
        input="I'm having a panic attack",
        expected_activity="breathing",
        difficulty="medium",
        category="implicit_signal",
        description="Panic attack - urgent breathing need",
    ),
    ActivityDetectionExample(
        input="I can't calm down, everything feels overwhelming",
        expected_activity="breathing",
        difficulty="medium",
        category="implicit_signal",
        description="Overwhelm and inability to calm",
    ),
    ActivityDetectionExample(
        input="My chest feels tight and I'm so stressed",
        expected_activity="breathing",
        difficulty="medium",
        category="implicit_signal",
        description="Physical stress manifestation",
    ),
    ActivityDetectionExample(
        input="I'm about to go into a really stressful meeting and I'm freaking out",
        expected_activity="breathing",
        difficulty="medium",
        category="implicit_signal",
        description="Anticipatory anxiety",
    ),
    ActivityDetectionExample(
        input="I haven't been able to relax all day, I'm so tense",
        expected_activity="breathing",
        difficulty="medium",
        category="implicit_signal",
        description="Persistent tension",
    ),
    # Meditation - Focus/clarity signals
    ActivityDetectionExample(
        input="My mind is racing and I can't focus on anything",
        expected_activity="meditation",
        difficulty="medium",
        category="implicit_signal",
        description="Racing thoughts needing calm",
    ),
    ActivityDetectionExample(
        input="I feel so scattered, like I'm in a hundred places at once",
        expected_activity="meditation",
        difficulty="medium",
        category="implicit_signal",
        description="Scattered/unfocused feeling",
    ),
    ActivityDetectionExample(
        input="I need to center myself before this important decision",
        expected_activity="meditation",
        difficulty="medium",
        category="implicit_signal",
        description="Need for centering/grounding",
    ),
    ActivityDetectionExample(
        input="I want to be more present but I keep getting distracted by worries",
        expected_activity="meditation",
        difficulty="medium",
        category="implicit_signal",
        description="Desire for presence",
    ),
    ActivityDetectionExample(
        input="I can't stop overthinking everything",
        expected_activity="meditation",
        difficulty="hard",
        category="implicit_signal",
        description="Overthinking - could be meditation or breathing",
    ),
    # Journaling - Emotional processing signals
    ActivityDetectionExample(
        input="I have so many emotions swirling around and I need to sort them out",
        expected_activity="journaling",
        difficulty="medium",
        category="implicit_signal",
        description="Need to process emotions",
    ),
    ActivityDetectionExample(
        input="Something happened today and I need to make sense of it",
        expected_activity="journaling",
        difficulty="medium",
        category="implicit_signal",
        description="Need to process an event",
    ),
    ActivityDetectionExample(
        input="I've been holding onto these feelings and need to get them out somehow",
        expected_activity="journaling",
        difficulty="medium",
        category="implicit_signal",
        description="Emotional release need",
    ),
    ActivityDetectionExample(
        input="I want to reflect on my goals and where I'm heading",
        expected_activity="journaling",
        difficulty="medium",
        category="implicit_signal",
        description="Goal reflection need",
    ),
]

# -----------------------------------------------------------------------------
# No Activity Needed (should NOT trigger any activity)
# -----------------------------------------------------------------------------
NO_ACTIVITY = [
    # General conversation
    ActivityDetectionExample(
        input="Hi, how are you?",
        expected_activity=None,
        difficulty="easy",
        category="no_activity",
        description="Simple greeting",
    ),
    ActivityDetectionExample(
        input="What can you help me with?",
        expected_activity=None,
        difficulty="easy",
        category="no_activity",
        description="Capability question",
    ),
    ActivityDetectionExample(
        input="Tell me about yourself",
        expected_activity=None,
        difficulty="easy",
        category="no_activity",
        description="Bot introduction request",
    ),
    ActivityDetectionExample(
        input="What's the weather like?",
        expected_activity=None,
        difficulty="easy",
        category="no_activity",
        description="Off-topic question",
    ),
    # Sharing without needing activity
    ActivityDetectionExample(
        input="I had a pretty good day today, work went well",
        expected_activity=None,
        difficulty="medium",
        category="no_activity",
        description="Positive sharing - no intervention needed",
    ),
    ActivityDetectionExample(
        input="I'm feeling okay, just checking in",
        expected_activity=None,
        difficulty="medium",
        category="no_activity",
        description="Neutral check-in",
    ),
    ActivityDetectionExample(
        input="I finished my workout earlier and feel great",
        expected_activity=None,
        difficulty="medium",
        category="no_activity",
        description="Positive wellness update",
    ),
    ActivityDetectionExample(
        input="Thanks for the chat yesterday, it really helped",
        expected_activity=None,
        difficulty="medium",
        category="no_activity",
        description="Gratitude expression",
    ),
    # Questions about activities (not requests TO do them)
    ActivityDetectionExample(
        input="What types of breathing exercises do you know?",
        expected_activity=None,
        difficulty="hard",
        category="no_activity",
        description="Question about activities, not request",
    ),
    ActivityDetectionExample(
        input="How does meditation help with stress?",
        expected_activity=None,
        difficulty="hard",
        category="no_activity",
        description="Educational question about meditation",
    ),
    ActivityDetectionExample(
        input="What are the benefits of journaling?",
        expected_activity=None,
        difficulty="hard",
        category="no_activity",
        description="Educational question about journaling",
    ),
    # Mild emotional states (not severe enough for activity)
    ActivityDetectionExample(
        input="I'm a little tired today",
        expected_activity=None,
        difficulty="medium",
        category="no_activity",
        description="Mild fatigue - conversation appropriate",
    ),
    ActivityDetectionExample(
        input="Work was a bit annoying but nothing major",
        expected_activity=None,
        difficulty="medium",
        category="no_activity",
        description="Minor frustration - conversation appropriate",
    ),
    ActivityDetectionExample(
        input="I'm just bored and looking for something to do",
        expected_activity=None,
        difficulty="medium",
        category="no_activity",
        description="Boredom - not activity appropriate",
    ),
]

# -----------------------------------------------------------------------------
# Edge Cases (ambiguous or tricky scenarios)
# -----------------------------------------------------------------------------
EDGE_CASES = [
    # Ambiguous between activities
    ActivityDetectionExample(
        input="I need to clear my head",
        expected_activity="meditation",  # Could be breathing too
        difficulty="hard",
        category="edge_case",
        description="Ambiguous - meditation slightly better fit",
    ),
    ActivityDetectionExample(
        input="I want to deal with my stress somehow",
        expected_activity="breathing",  # Most immediate for stress
        difficulty="hard",
        category="edge_case",
        description="General stress - breathing is most immediate",
    ),
    ActivityDetectionExample(
        input="Help me relax",
        expected_activity="breathing",
        difficulty="hard",
        category="edge_case",
        description="Generic relaxation request",
    ),
    # Past tense (not current need)
    ActivityDetectionExample(
        input="Yesterday I was really anxious but I'm fine now",
        expected_activity=None,
        difficulty="hard",
        category="edge_case",
        description="Past anxiety - current state is fine",
    ),
    ActivityDetectionExample(
        input="I used to do breathing exercises a lot",
        expected_activity=None,
        difficulty="hard",
        category="edge_case",
        description="Past experience, not current request",
    ),
    # Hypothetical/future
    ActivityDetectionExample(
        input="If I ever feel anxious, what should I do?",
        expected_activity=None,
        difficulty="hard",
        category="edge_case",
        description="Hypothetical question",
    ),
    ActivityDetectionExample(
        input="I might want to try meditation sometime",
        expected_activity=None,
        difficulty="hard",
        category="edge_case",
        description="Vague future interest, not current request",
    ),
    # Negative/declining
    ActivityDetectionExample(
        input="I don't want to do any breathing exercises right now",
        expected_activity=None,
        difficulty="hard",
        category="edge_case",
        description="Explicit decline of activity",
    ),
    ActivityDetectionExample(
        input="Meditation doesn't really work for me",
        expected_activity=None,
        difficulty="hard",
        category="edge_case",
        description="Expressing meditation skepticism",
    ),
    # Mixed signals
    ActivityDetectionExample(
        input="I'm stressed but I don't have time for anything right now",
        expected_activity=None,
        difficulty="hard",
        category="edge_case",
        description="Need identified but explicitly no time",
    ),
    ActivityDetectionExample(
        input="I know breathing helps but can we just talk?",
        expected_activity=None,
        difficulty="hard",
        category="edge_case",
        description="Acknowledges activity but prefers conversation",
    ),
    # Context-dependent
    ActivityDetectionExample(
        input="That breathing exercise was great, can we try something else?",
        expected_activity=None,  # They just did breathing, want to try different (conversation)
        difficulty="hard",
        category="edge_case",
        context="User: Can we do a breathing exercise?\nAssistant: [Guided breathing]\nUser: That was helpful.",
        description="After activity - 'something else' means conversation",
    ),
]

# -----------------------------------------------------------------------------
# Combined Dataset
# -----------------------------------------------------------------------------
ACTIVITY_DETECTION_DATASET: list[ActivityDetectionExample] = (
    EXPLICIT_REQUESTS + IMPLICIT_SIGNALS + NO_ACTIVITY + EDGE_CASES
)


def get_dataset_stats() -> dict:
    """Get statistics about the activity detection dataset."""
    total = len(ACTIVITY_DETECTION_DATASET)

    by_category = {}
    by_difficulty = {}
    by_activity = {}

    for example in ACTIVITY_DETECTION_DATASET:
        # Count by category
        by_category[example.category] = by_category.get(example.category, 0) + 1

        # Count by difficulty
        by_difficulty[example.difficulty] = by_difficulty.get(example.difficulty, 0) + 1

        # Count by expected activity
        activity = example.expected_activity or "none"
        by_activity[activity] = by_activity.get(activity, 0) + 1

    return {
        "total": total,
        "by_category": by_category,
        "by_difficulty": by_difficulty,
        "by_expected_activity": by_activity,
    }
