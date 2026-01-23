"""
============================================================================
Conversation Quality Evaluation Runner
============================================================================
Runs conversation quality evaluations against the LangSmith dataset.

This runner:
1. Loads the conversation dataset from LangSmith
2. For each model, generates responses to all inputs
3. Scores responses with both code-based and LLM-as-judge evaluators
4. Reports results to LangSmith for comparison
============================================================================
"""

import time
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langsmith import Client, evaluate

from src.eval.config import EVAL_MODELS, ModelConfig
from src.eval.datasets.seed import CONVERSATION_DATASET_NAME
from src.eval.evaluators.code_based import create_safety_compliance_evaluator
from src.eval.evaluators.llm_judge import (
    create_empathy_evaluator,
    create_response_quality_evaluator,
)
from src.eval.evaluators.metrics import create_cost_evaluator, create_latency_evaluator
from src.logging_config import NodeLogger
from src.prompts.wellness_system import WELLNESS_SYSTEM_PROMPT
from src.utils.user_context import format_user_context

logger = NodeLogger("conversation_eval")


# -----------------------------------------------------------------------------
# Response Generation
# -----------------------------------------------------------------------------


def generate_response(
    inputs: dict[str, Any],
    model_config: ModelConfig,
) -> dict[str, Any]:
    """
    Generate a conversation response using the specified model.

    Args:
        inputs: Dict with 'input' (user message), optional 'context' and 'user_context'
        model_config: Which model to use

    Returns:
        Dict with response and metadata
    """
    start_time = time.time()

    user_message = inputs.get("input", "")
    context = inputs.get("context")
    user_context_data = inputs.get("user_context")

    # Log the input being processed
    message_preview = user_message[:80] + "..." if len(user_message) > 80 else user_message
    logger.info(f"[{model_config.name}] Input", message=message_preview)

    # Build conversation messages
    messages = []

    # Add system prompt
    context_str = ""
    if user_context_data:
        context_str = format_user_context(user_context_data)

    system_content = WELLNESS_SYSTEM_PROMPT.format(user_context=context_str)
    messages.append(SystemMessage(content=system_content))

    # Add conversation context if provided
    if context:
        # Parse context into messages (simple format: "User: ...\nAssistant: ...")
        for line in context.split("\n"):
            line = line.strip()
            if line.startswith("User:"):
                messages.append(HumanMessage(content=line[5:].strip()))
            elif line.startswith("Assistant:"):
                messages.append(AIMessage(content=line[10:].strip()))

    # Add current user message
    messages.append(HumanMessage(content=user_message))

    try:
        # Create model
        llm = model_config.create(temperature=0.7, max_tokens=500)

        # Generate response (synchronous to avoid asyncio event loop issues)
        response = llm.invoke(messages)
        response_content = response.content if hasattr(response, "content") else str(response)

        latency_ms = (time.time() - start_time) * 1000

        # Log successful response
        response_preview = (
            response_content[:100] + "..." if len(response_content) > 100 else response_content
        )
        logger.info(
            f"[{model_config.name}] Response",
            latency_ms=f"{latency_ms:.0f}",
            preview=response_preview,
        )

        return {
            "response": response_content,
            "content": response_content,  # Alias for evaluators
            "messages": [{"role": "assistant", "content": response_content}],
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
            "response": "",
            "content": "",
            "messages": [],
            "latency_ms": latency_ms,
            "model": model_config.model_id,
            "error": str(e),
        }


def create_target_function(model_config: ModelConfig):  # noqa: ANN201
    """Create a target function for LangSmith evaluation."""

    def target(inputs: dict[str, Any]) -> dict[str, Any]:
        return generate_response(inputs, model_config)

    return target


# -----------------------------------------------------------------------------
# Main Evaluation Runner
# -----------------------------------------------------------------------------


def run_conversation_evaluation(
    model_ids: list[str],
    experiment_prefix: str = "conversation-quality",
    max_concurrency: int = 2,  # Lower for LLM-as-judge to avoid rate limits
    include_llm_judge: bool = True,
) -> dict[str, Any]:
    """
    Run conversation quality evaluation for specified models.

    Args:
        model_ids: List of model IDs to evaluate (e.g., ["haiku", "glm-4.7"])
        experiment_prefix: Prefix for experiment names in LangSmith
        max_concurrency: Max concurrent evaluations
        include_llm_judge: Whether to include LLM-as-judge evaluators

    Returns:
        Dict with results for each model
    """
    logger.node_start()

    Client()
    results = {}

    # Base evaluators (code-based)
    base_evaluators = [
        create_safety_compliance_evaluator(),
        create_latency_evaluator(),
    ]

    # LLM-as-judge evaluators (async)
    llm_evaluators = []
    if include_llm_judge:
        llm_evaluators = [
            create_empathy_evaluator(),
            create_response_quality_evaluator(),
        ]

    for model_id in model_ids:
        if model_id not in EVAL_MODELS:
            logger.warning(f"Unknown model: {model_id}, skipping")
            continue

        model_config = EVAL_MODELS[model_id]
        logger.info("Evaluating model", model=model_config.name)

        # Combine evaluators with model-specific cost evaluator
        evaluators = base_evaluators + llm_evaluators + [create_cost_evaluator(model_id)]

        # Create target function
        target = create_target_function(model_config)

        # Run evaluation
        experiment_name = f"{experiment_prefix}-{model_id}"

        try:
            experiment_results = evaluate(
                target,
                data=CONVERSATION_DATASET_NAME,
                evaluators=evaluators,
                experiment_prefix=experiment_name,
                max_concurrency=max_concurrency,
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
    default_models = ["haiku", "glm-4.7"]

    # Parse command line args
    models = sys.argv[1].split(",") if len(sys.argv) > 1 else default_models

    include_judge = "--no-judge" not in sys.argv

    print(f"Running conversation evaluation for: {models}")
    print(f"LLM-as-judge: {include_judge}")
    results = run_conversation_evaluation(models, include_llm_judge=include_judge)
    print(f"\nResults: {results}")
