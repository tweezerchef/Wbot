"""
============================================================================
Evaluation Datasets
============================================================================
Test case definitions for evaluating LLM model performance.

Datasets:
- activity_detection: Test cases for activity routing classification
- conversation: Test cases for conversation response quality
============================================================================
"""

from src.eval.datasets.activity_detection import (
    ACTIVITY_DETECTION_DATASET,
    ActivityDetectionExample,
)
from src.eval.datasets.conversation import (
    CONVERSATION_DATASET,
    ConversationExample,
)

__all__ = [
    "ACTIVITY_DETECTION_DATASET",
    "CONVERSATION_DATASET",
    "ActivityDetectionExample",
    "ConversationExample",
]
