"""
============================================================================
Evaluation Framework CLI
============================================================================
Command-line interface for running LLM model evaluations.

Usage:
    # List available models
    uv run python -m src.eval.cli list-models

    # Create/update datasets in LangSmith
    uv run python -m src.eval.cli create-datasets
    uv run python -m src.eval.cli create-datasets --force

    # Run activity detection evaluation
    uv run python -m src.eval.cli activity --models gemini-lite,glm-flash

    # Run conversation quality evaluation
    uv run python -m src.eval.cli conversation --models haiku,glm-4.7
    uv run python -m src.eval.cli conversation --models haiku --no-judge

    # Run all evaluations with a profile
    uv run python -m src.eval.cli all --profile full_comparison

    # Quick test (single model, small subset)
    uv run python -m src.eval.cli activity --models gemini-lite --quick
============================================================================
"""

# Load environment variables before any other imports
# This must run first so that API keys are available when modules initialize
from src.env import load_monorepo_dotenv

load_monorepo_dotenv()

import argparse  # noqa: E402
import logging  # noqa: E402
import sys  # noqa: E402
from typing import Any  # noqa: E402

from src.eval.config import (  # noqa: E402
    EVAL_MODELS,
    EVAL_PROFILES,
    get_models_for_profile,
    list_available_models,
)
from src.eval.datasets.seed import seed_all_datasets  # noqa: E402
from src.eval.runners.activity_eval import run_activity_evaluation  # noqa: E402
from src.eval.runners.conversation_eval import run_conversation_evaluation  # noqa: E402


def cmd_list_models(args: argparse.Namespace) -> None:
    """List all available models and their metadata."""
    print("\n=== Available Models ===\n")

    models = list_available_models()
    for model in models:
        print(f"  {model['id']:<15} {model['name']}")
        print(f"  {'':<15} Provider: {model['provider']}")
        print(f"  {'':<15} Cost: {model['cost_input']} input, {model['cost_output']} output")
        print(f"  {'':<15} {model['description']}")
        print()

    print("=== Available Profiles ===\n")
    for profile_name, model_ids in EVAL_PROFILES.items():
        print(f"  {profile_name}: {', '.join(model_ids)}")
    print()


def cmd_create_datasets(args: argparse.Namespace) -> None:
    """Create or update evaluation datasets in LangSmith."""
    print("\n=== Creating Evaluation Datasets ===\n")

    try:
        results = seed_all_datasets(force=args.force)
        print("\n=== Dataset IDs ===")
        for name, dataset_id in results.items():
            print(f"  {name}: {dataset_id}")
        print()
    except Exception as e:
        print(f"Error creating datasets: {e}")
        sys.exit(1)


def cmd_activity(args: argparse.Namespace) -> None:
    """Run activity detection evaluation."""
    model_ids = parse_models(args)

    print("\n=== Activity Detection Evaluation ===")
    print(f"Models: {', '.join(model_ids)}\n")

    results = run_activity_evaluation(
        model_ids=model_ids,
        experiment_prefix=args.prefix or "activity-detection",
        max_concurrency=args.concurrency,
    )

    print_results(results)


def cmd_conversation(args: argparse.Namespace) -> None:
    """Run conversation quality evaluation."""
    model_ids = parse_models(args)

    print("\n=== Conversation Quality Evaluation ===")
    print(f"Models: {', '.join(model_ids)}")
    print(f"LLM-as-judge: {not args.no_judge}\n")

    results = run_conversation_evaluation(
        model_ids=model_ids,
        experiment_prefix=args.prefix or "conversation-quality",
        max_concurrency=args.concurrency,
        include_llm_judge=not args.no_judge,
    )

    print_results(results)


def cmd_all(args: argparse.Namespace) -> None:
    """Run all evaluations (activity + conversation)."""
    model_ids = parse_models(args)

    print("\n=== Full Evaluation Suite ===")
    print(f"Models: {', '.join(model_ids)}\n")

    # Run activity detection
    print("--- Activity Detection ---")
    activity_results = run_activity_evaluation(
        model_ids=model_ids,
        experiment_prefix=args.prefix or "full-eval-activity",
        max_concurrency=args.concurrency,
    )
    print_results(activity_results)

    # Run conversation quality
    print("\n--- Conversation Quality ---")
    conversation_results = run_conversation_evaluation(
        model_ids=model_ids,
        experiment_prefix=args.prefix or "full-eval-conversation",
        max_concurrency=args.concurrency,
        include_llm_judge=not args.no_judge,
    )
    print_results(conversation_results)


def parse_models(args: argparse.Namespace) -> list[str]:
    """Parse model IDs from args (either --models or --profile)."""
    if args.profile:
        try:
            configs = get_models_for_profile(args.profile)
            return [model_id for model_id, config in EVAL_MODELS.items() if config in configs]
        except ValueError as e:
            print(f"Error: {e}")
            sys.exit(1)

    if args.models:
        model_ids = [m.strip() for m in args.models.split(",")]
        # Validate
        for model_id in model_ids:
            if model_id not in EVAL_MODELS:
                available = ", ".join(EVAL_MODELS.keys())
                print(f"Error: Unknown model '{model_id}'")
                print(f"Available: {available}")
                sys.exit(1)
        return model_ids

    # Default to budget profile
    print("No models specified, using 'budget' profile")
    return EVAL_PROFILES["budget"]


def print_results(results: dict[str, Any]) -> None:
    """Print evaluation results summary."""
    print("\n=== Results Summary ===")
    for model_id, result in results.items():
        status = result.get("status", "unknown")
        model_name = result.get("model_name", model_id)

        if status == "success":
            experiment = result.get("experiment_name", "")
            print(f"  ✓ {model_name}: {experiment}")
        else:
            error = result.get("error", "Unknown error")
            print(f"  ✗ {model_name}: {error}")
    print()


def configure_logging(verbose: bool = False) -> None:
    """
    Configure logging for the evaluation framework.

    Sets up console output with timestamps and appropriate log levels.
    Suppresses noisy third-party loggers.
    """
    # Set log level based on verbosity
    level = logging.DEBUG if verbose else logging.INFO

    # Configure root logger for eval output
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-5s | %(name)s | %(message)s",
        datefmt="%H:%M:%S",
        force=True,  # Override any existing configuration
    )

    # Suppress noisy third-party loggers
    for logger_name in [
        "httpx",
        "httpcore",
        "urllib3",
        "langsmith",
        "langchain",
        "openai",
        "google_genai",  # Suppress Google GenAI SDK logs (AFC, retries)
        "google_genai.models",
        "google_genai._api_client",
    ]:
        logging.getLogger(logger_name).setLevel(logging.WARNING)


def main() -> None:
    """Main CLI entry point."""
    # Configure logging for verbose eval output
    configure_logging()

    parser = argparse.ArgumentParser(
        description="LLM Model Evaluation Framework",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  uv run python -m src.eval.cli list-models
  uv run python -m src.eval.cli create-datasets
  uv run python -m src.eval.cli activity --models gemini-lite,glm-flash
  uv run python -m src.eval.cli conversation --models haiku --no-judge
  uv run python -m src.eval.cli all --profile full_comparison
        """,
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # list-models command
    list_parser = subparsers.add_parser("list-models", help="List available models")
    list_parser.set_defaults(func=cmd_list_models)

    # create-datasets command
    datasets_parser = subparsers.add_parser(
        "create-datasets", help="Create evaluation datasets in LangSmith"
    )
    datasets_parser.add_argument(
        "--force", action="store_true", help="Force recreate existing datasets"
    )
    datasets_parser.set_defaults(func=cmd_create_datasets)

    # activity command
    activity_parser = subparsers.add_parser("activity", help="Run activity detection evaluation")
    add_common_args(activity_parser)
    activity_parser.set_defaults(func=cmd_activity)

    # conversation command
    conversation_parser = subparsers.add_parser(
        "conversation", help="Run conversation quality evaluation"
    )
    add_common_args(conversation_parser)
    conversation_parser.add_argument(
        "--no-judge",
        action="store_true",
        help="Skip LLM-as-judge evaluators (faster but less comprehensive)",
    )
    conversation_parser.set_defaults(func=cmd_conversation)

    # all command
    all_parser = subparsers.add_parser("all", help="Run all evaluations")
    add_common_args(all_parser)
    all_parser.add_argument(
        "--no-judge",
        action="store_true",
        help="Skip LLM-as-judge evaluators",
    )
    all_parser.set_defaults(func=cmd_all)

    # Parse and execute
    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        sys.exit(1)

    args.func(args)


def add_common_args(parser: argparse.ArgumentParser) -> None:
    """Add common arguments to a subparser."""
    parser.add_argument(
        "--models",
        type=str,
        help="Comma-separated list of model IDs (e.g., 'haiku,gemini-lite')",
    )
    parser.add_argument(
        "--profile",
        type=str,
        help=f"Use a predefined model profile ({', '.join(EVAL_PROFILES.keys())})",
    )
    parser.add_argument(
        "--prefix",
        type=str,
        help="Custom experiment name prefix",
    )
    parser.add_argument(
        "--concurrency",
        type=int,
        default=4,
        help="Maximum concurrent evaluations (default: 4)",
    )


if __name__ == "__main__":
    main()
