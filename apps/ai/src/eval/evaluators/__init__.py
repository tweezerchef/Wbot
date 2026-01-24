"""
============================================================================
Evaluation Functions
============================================================================
Evaluators for scoring LLM outputs in wellness chatbot tasks.

Types of evaluators:
- code_based: Deterministic, rule-based scoring
- llm_judge: LLM-as-judge for subjective qualities
- metrics: Latency and cost tracking
============================================================================
"""

from src.eval.evaluators.code_based import (
    activity_accuracy,
    safety_compliance,
    structured_validity,
)
from src.eval.evaluators.llm_judge import empathy_evaluator, response_quality_evaluator
from src.eval.evaluators.metrics import cost_evaluator, latency_evaluator

__all__ = [
    # Code-based evaluators
    "activity_accuracy",
    "cost_evaluator",
    # LLM-as-judge evaluators
    "empathy_evaluator",
    # Metrics evaluators
    "latency_evaluator",
    "response_quality_evaluator",
    "safety_compliance",
    "structured_validity",
]
