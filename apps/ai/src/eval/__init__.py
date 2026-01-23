"""
============================================================================
LLM Model Evaluation Framework
============================================================================
Framework for comparing LLM model performance across wellness chatbot tasks
using LangSmith for tracking and analysis.

Key Components:
- config: Model configurations and evaluation profiles
- datasets: Test case definitions for activity detection and conversation
- evaluators: Code-based and LLM-as-judge evaluators
- runners: Evaluation execution logic
- cli: Command-line interface for running evaluations

Usage:
    # Run activity detection evaluation
    uv run python -m src.eval.cli activity --models gemini-lite,glm-flash

    # Run conversation quality evaluation
    uv run python -m src.eval.cli conversation --models haiku,glm-4.7

    # Run all evaluations with a profile
    uv run python -m src.eval.cli all --profile full_comparison
============================================================================
"""

from src.eval.config import EVAL_MODELS, EVAL_PROFILES, ModelConfig

__all__ = ["EVAL_MODELS", "EVAL_PROFILES", "ModelConfig"]
