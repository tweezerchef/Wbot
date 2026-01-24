"""
============================================================================
Activity Detection Evaluation Runner
============================================================================
Runs activity detection evaluations against the LangSmith dataset.

This runner:
1. Loads the activity detection dataset from LangSmith
2. For each model, runs predictions on all examples
3. Scores predictions with code-based evaluators
4. Reports results to LangSmith for comparison
============================================================================
"""

import time
from typing import Any

from langchain_core.messages import HumanMessage
from langsmith import Client, evaluate
from pydantic import BaseModel, Field

from src.eval.config import EVAL_MODELS, ModelConfig
from src.eval.datasets.seed import ACTIVITY_DETECTION_DATASET_NAME
from src.eval.evaluators.code_based import (
    create_activity_accuracy_evaluator,
    create_structured_validity_evaluator,
)
from src.eval.evaluators.metrics import create_cost_evaluator, create_latency_evaluator
from src.logging_config import NodeLogger

logger = NodeLogger("activity_eval")


# -----------------------------------------------------------------------------
# Activity Detection Schema (same as in detect_activity node)
# -----------------------------------------------------------------------------


class ActivityDetection(BaseModel):
    """Structured output for activity detection."""

    detected_activity: str | None = Field(
        default=None,
        description="The type of wellness activity detected: 'breathing', 'meditation', 'journaling', or null",
    )

    confidence: float = Field(
        ge=0.0,
        le=1.0,
        default=0.5,
        description="Confidence score from 0 to 1",
    )

    reasoning: str = Field(
        default="",
        description="Brief explanation of the detection result",
    )


# -----------------------------------------------------------------------------
# Detection Prompt (same as in detect_activity node)
# -----------------------------------------------------------------------------

DETECTION_PROMPT = """You are an activity detection system for a wellness chatbot.

Analyze the user's message to determine if a wellness activity would be helpful.

DETECTION RULES:
- BREATHING: Detect when user mentions stress, anxiety, panic, overwhelm, can't calm down,
  tense, nervous, racing heart, need to relax, breathing help, or similar distress signals.
  Also detect explicit requests for breathing exercises.

- MEDITATION: Detect when user mentions trouble focusing, scattered thoughts, wanting
  mindfulness, need to be present, seeking clarity, or explicit meditation requests.

- JOURNALING: Detect when user wants to write down feelings, process emotions, reflect
  on experiences, express themselves, or explicit journaling requests.

- null: Normal conversation, casual chat, questions, or when no activity seems appropriate.
  Be conservative - only suggest activities when clearly appropriate.

IMPORTANT:
- Be conservative with detection. Only suggest activities when there's clear indication.
- Confidence should be HIGH (0.8+) only for explicit requests or strong signals.
- Confidence should be MEDIUM (0.5-0.7) for implicit signals that suggest an activity.
- If unsure, return null with low confidence.

{context}

Current user message:
"{message}"

Analyze this and determine if a wellness activity would help."""


# -----------------------------------------------------------------------------
# Target Function
# -----------------------------------------------------------------------------


def run_activity_detection(
    inputs: dict[str, Any],
    model_config: ModelConfig,
) -> dict[str, Any]:
    """
    Run activity detection for a single input using the specified model.

    Args:
        inputs: Dict with 'input' (user message) and optional 'context'
        model_config: Which model to use

    Returns:
        Dict with detection results
    """
    start_time = time.time()

    user_message = inputs.get("input", "")
    context = inputs.get("context")

    # Log the input being processed
    message_preview = user_message[:80] + "..." if len(user_message) > 80 else user_message
    logger.info(f"[{model_config.name}] Processing", input=message_preview)

    # Build context section
    context_section = ""
    if context:
        context_section = f"Recent conversation:\n{context}\n"

    # Format prompt
    prompt = DETECTION_PROMPT.format(context=context_section, message=user_message)

    try:
        # Create model and get structured output
        llm = model_config.create(temperature=0.2, max_tokens=200)

        # Use method from model config (json_mode for GLM, default for others)
        if model_config.structured_output_method:
            structured_llm = llm.with_structured_output(
                ActivityDetection, method=model_config.structured_output_method
            )
        else:
            structured_llm = llm.with_structured_output(ActivityDetection)

        logger.debug(f"[{model_config.name}] Invoking structured output...")

        # Use synchronous invoke to avoid asyncio event loop issues
        result: ActivityDetection = structured_llm.invoke([HumanMessage(content=prompt)])

        latency_ms = (time.time() - start_time) * 1000

        # Log successful result
        logger.info(
            f"[{model_config.name}] Result",
            activity=result.detected_activity,
            confidence=f"{result.confidence:.2f}",
            latency_ms=f"{latency_ms:.0f}",
        )

        return {
            "detected_activity": result.detected_activity,
            "confidence": result.confidence,
            "reasoning": result.reasoning,
            "latency_ms": latency_ms,
            "model": model_config.model_id,
        }

    except Exception as e:
        latency_ms = (time.time() - start_time) * 1000
        # Log error with details
        logger.error(
            f"[{model_config.name}] Error",
            error=str(e)[:200],
            latency_ms=f"{latency_ms:.0f}",
        )
        return {
            "detected_activity": None,
            "confidence": 0.0,
            "reasoning": f"Error: {e!s}",
            "latency_ms": latency_ms,
            "model": model_config.model_id,
            "error": str(e),
        }


def create_target_function(model_config: ModelConfig):  # noqa: ANN201
    """Create a target function for LangSmith evaluation."""

    def target(inputs: dict[str, Any]) -> dict[str, Any]:
        return run_activity_detection(inputs, model_config)

    return target


# -----------------------------------------------------------------------------
# Main Evaluation Runner
# -----------------------------------------------------------------------------


def run_activity_evaluation(
    model_ids: list[str],
    experiment_prefix: str = "activity-detection",
    max_concurrency: int = 4,
) -> dict[str, Any]:
    """
    Run activity detection evaluation for specified models.

    Args:
        model_ids: List of model IDs to evaluate (e.g., ["gemini-lite", "glm-flash"])
        experiment_prefix: Prefix for experiment names in LangSmith
        max_concurrency: Max concurrent evaluations

    Returns:
        Dict with results for each model
    """
    logger.node_start()

    Client()
    results = {}

    # Create evaluators
    evaluators = [
        create_activity_accuracy_evaluator(),
        create_structured_validity_evaluator(["detected_activity", "confidence", "reasoning"]),
        create_latency_evaluator(),
    ]

    for model_id in model_ids:
        if model_id not in EVAL_MODELS:
            logger.warning(f"Unknown model: {model_id}, skipping")
            continue

        model_config = EVAL_MODELS[model_id]
        logger.info("Evaluating model", model=model_config.name)

        # Add cost evaluator for this specific model
        model_evaluators = [*evaluators, create_cost_evaluator(model_id)]

        # Create target function
        target = create_target_function(model_config)

        # Run evaluation
        experiment_name = f"{experiment_prefix}-{model_id}"

        # Use model's max_concurrency if lower than requested (respects rate limits)
        effective_concurrency = min(max_concurrency, model_config.max_concurrency)

        try:
            experiment_results = evaluate(
                target,
                data=ACTIVITY_DETECTION_DATASET_NAME,
                evaluators=model_evaluators,
                experiment_prefix=experiment_name,
                max_concurrency=effective_concurrency,
            )

            results[model_id] = {
                "status": "success",
                "experiment_name": experiment_name,
                "model_name": model_config.name,
                "results": experiment_results,
            }

            logger.info("Completed evaluation", model=model_config.name)

        except Exception as e:
            logger.error("Evaluation failed", model=model_config.name, error=str(e))
            results[model_id] = {
                "status": "error",
                "model_name": model_config.name,
                "error": str(e),
            }

    logger.node_end()
    return results


# -----------------------------------------------------------------------------
# Standalone execution
# -----------------------------------------------------------------------------

if __name__ == "__main__":
    import sys

    # Default models for quick testing
    default_models = ["gemini-lite", "glm-flash"]

    # Parse command line args
    models = sys.argv[1].split(",") if len(sys.argv) > 1 else default_models

    print(f"Running activity detection evaluation for: {models}")
    results = run_activity_evaluation(models)
    print(f"\nResults: {results}")
