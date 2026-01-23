"""
============================================================================
Metrics Evaluators
============================================================================
Evaluators for tracking operational metrics like latency and cost.

These evaluators help compare models on practical considerations
beyond just quality - speed and cost matter for production use.
============================================================================
"""

from typing import Any

from src.eval.config import EVAL_MODELS, ModelConfig


def latency_evaluator(
    latency_ms: float,
    thresholds: dict[str, float] | None = None,
) -> dict[str, Any]:
    """
    Evaluate response latency.

    Scoring based on configurable thresholds:
    - excellent: < 500ms
    - good: < 1000ms
    - acceptable: < 2000ms
    - slow: < 5000ms
    - poor: >= 5000ms

    Args:
        latency_ms: Response time in milliseconds
        thresholds: Optional custom thresholds

    Returns:
        Dict with score (0-1), rating, and latency value
    """
    if thresholds is None:
        thresholds = {
            "excellent": 500,
            "good": 1000,
            "acceptable": 2000,
            "slow": 5000,
        }

    # Determine rating and score
    if latency_ms < thresholds["excellent"]:
        rating = "excellent"
        score = 1.0
    elif latency_ms < thresholds["good"]:
        rating = "good"
        score = 0.8
    elif latency_ms < thresholds["acceptable"]:
        rating = "acceptable"
        score = 0.6
    elif latency_ms < thresholds["slow"]:
        rating = "slow"
        score = 0.4
    else:
        rating = "poor"
        score = 0.2

    return {
        "score": score,
        "rating": rating,
        "latency_ms": latency_ms,
        "thresholds": thresholds,
    }


def cost_evaluator(
    input_tokens: int,
    output_tokens: int,
    model_id: str,
) -> dict[str, Any]:
    """
    Evaluate estimated cost for a model call.

    Uses cost data from model config. Lower cost = higher score.

    Args:
        input_tokens: Number of input tokens used
        output_tokens: Number of output tokens generated
        model_id: Short model identifier (e.g., "haiku", "gemini-lite")

    Returns:
        Dict with score (0-1), estimated cost, and breakdown
    """
    # Get model config
    if model_id not in EVAL_MODELS:
        return {
            "score": 0.5,  # Unknown, neutral score
            "error": f"Unknown model: {model_id}",
        }

    config: ModelConfig = EVAL_MODELS[model_id]

    # Calculate cost
    input_cost = (input_tokens / 1000) * config.cost_per_1k_input
    output_cost = (output_tokens / 1000) * config.cost_per_1k_output
    total_cost = input_cost + output_cost

    # Score based on cost (lower is better)
    # Free tier gets perfect score
    if total_cost == 0:
        score = 1.0
    elif total_cost < 0.0001:  # < $0.0001
        score = 0.95
    elif total_cost < 0.0005:  # < $0.0005
        score = 0.8
    elif total_cost < 0.001:  # < $0.001
        score = 0.6
    elif total_cost < 0.005:  # < $0.005
        score = 0.4
    else:
        score = 0.2

    return {
        "score": score,
        "total_cost_usd": total_cost,
        "input_cost_usd": input_cost,
        "output_cost_usd": output_cost,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "model": config.name,
        "cost_per_1k_input": config.cost_per_1k_input,
        "cost_per_1k_output": config.cost_per_1k_output,
    }


def combined_efficiency_score(
    latency_ms: float,
    input_tokens: int,
    output_tokens: int,
    model_id: str,
    latency_weight: float = 0.5,
    cost_weight: float = 0.5,
) -> dict[str, Any]:
    """
    Combined efficiency score balancing latency and cost.

    Args:
        latency_ms: Response time in milliseconds
        input_tokens: Number of input tokens
        output_tokens: Number of output tokens
        model_id: Short model identifier
        latency_weight: Weight for latency score (0-1)
        cost_weight: Weight for cost score (0-1)

    Returns:
        Dict with combined score and component scores
    """
    latency_result = latency_evaluator(latency_ms)
    cost_result = cost_evaluator(input_tokens, output_tokens, model_id)

    # Normalize weights
    total_weight = latency_weight + cost_weight
    latency_weight = latency_weight / total_weight
    cost_weight = cost_weight / total_weight

    combined_score = latency_result["score"] * latency_weight + cost_result["score"] * cost_weight

    return {
        "score": combined_score,
        "latency_score": latency_result["score"],
        "cost_score": cost_result["score"],
        "latency_ms": latency_ms,
        "total_cost_usd": cost_result.get("total_cost_usd", 0),
        "latency_weight": latency_weight,
        "cost_weight": cost_weight,
    }


# -----------------------------------------------------------------------------
# LangSmith Evaluator Wrappers
# -----------------------------------------------------------------------------


def create_latency_evaluator():  # noqa: ANN201
    """Create a LangSmith-compatible latency evaluator."""

    def evaluate(run, example):  # noqa: ANN001, ANN202
        # LangSmith runs have start/end times
        if run.end_time and run.start_time:
            latency_ms = (run.end_time - run.start_time).total_seconds() * 1000
        else:
            latency_ms = 0

        result = latency_evaluator(latency_ms)
        return {
            "key": "latency",
            "score": result["score"],
            "comment": f"{result['rating']} ({latency_ms:.0f}ms)",
        }

    return evaluate


def create_cost_evaluator(model_id: str):  # noqa: ANN201
    """Create a LangSmith-compatible cost evaluator for a specific model."""

    def evaluate(run, example):  # noqa: ANN001, ANN202
        # Try to get token counts from run metadata
        # These are populated by LangChain when using the proper callbacks
        input_tokens = 0
        output_tokens = 0

        if hasattr(run, "extra") and run.extra:
            input_tokens = run.extra.get("input_tokens", 0)
            output_tokens = run.extra.get("output_tokens", 0)

        # Estimate if not available (rough approximation)
        if input_tokens == 0:
            # LangSmith Example has .inputs attribute, not .get()
            example_inputs = example.inputs if hasattr(example, "inputs") else {}
            input_text = str(example_inputs)
            input_tokens = len(input_text) // 4  # Rough estimate

        if output_tokens == 0:
            output_text = str(run.outputs) if run.outputs else ""
            output_tokens = len(output_text) // 4  # Rough estimate

        result = cost_evaluator(input_tokens, output_tokens, model_id)
        cost = result.get("total_cost_usd", 0)
        return {
            "key": "cost",
            "score": result["score"],
            "comment": f"${cost:.6f} ({input_tokens}+{output_tokens} tokens)",
        }

    return evaluate
