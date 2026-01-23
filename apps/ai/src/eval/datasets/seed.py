"""
============================================================================
Dataset Seeding for LangSmith
============================================================================
Uploads evaluation datasets to LangSmith for tracking and comparison.

LangSmith datasets allow:
- Consistent evaluation across model changes
- Side-by-side comparison of experiments
- Version tracking of test cases
- Collaborative review of results

Usage:
    # Upload all datasets
    uv run python -m src.eval.datasets.seed

    # Or via CLI
    uv run python -m src.eval.cli create-datasets
============================================================================
"""

import os

from langsmith import Client

from src.eval.datasets.activity_detection import (
    ACTIVITY_DETECTION_DATASET,
)
from src.eval.datasets.activity_detection import (
    get_dataset_stats as get_activity_stats,
)
from src.eval.datasets.conversation import (
    CONVERSATION_DATASET,
)
from src.eval.datasets.conversation import (
    get_dataset_stats as get_conversation_stats,
)

# Dataset names in LangSmith
ACTIVITY_DETECTION_DATASET_NAME = "wbot-activity-detection"
CONVERSATION_DATASET_NAME = "wbot-conversation-quality"


def get_langsmith_client() -> Client:
    """
    Create a LangSmith client.

    Requires LANGSMITH_API_KEY environment variable.
    """
    api_key = os.getenv("LANGSMITH_API_KEY")
    if not api_key:
        raise ValueError(
            "LANGSMITH_API_KEY environment variable is required. "
            "Get your API key from https://smith.langchain.com/"
        )
    return Client()


def seed_activity_detection_dataset(client: Client, force: bool = False) -> str:
    """
    Create or update the activity detection dataset in LangSmith.

    Args:
        client: LangSmith client
        force: If True, delete existing dataset and recreate

    Returns:
        Dataset ID
    """
    dataset_name = ACTIVITY_DETECTION_DATASET_NAME

    # Check if dataset exists
    try:
        existing = client.read_dataset(dataset_name=dataset_name)
        if not force:
            print(f"Dataset '{dataset_name}' already exists (id: {existing.id})")
            print("Use --force to recreate it")
            return str(existing.id)
        else:
            print(f"Deleting existing dataset '{dataset_name}'...")
            client.delete_dataset(dataset_id=existing.id)
    except Exception:
        pass  # Dataset doesn't exist, create it

    # Create new dataset
    print(f"Creating dataset '{dataset_name}'...")
    dataset = client.create_dataset(
        dataset_name=dataset_name,
        description="Activity detection test cases for wellness chatbot routing",
    )

    # Add examples
    print(f"Adding {len(ACTIVITY_DETECTION_DATASET)} examples...")
    for example in ACTIVITY_DETECTION_DATASET:
        client.create_example(
            dataset_id=dataset.id,
            inputs={
                "input": example.input,
                "context": example.context,
            },
            outputs={
                "expected_activity": example.expected_activity,
            },
            metadata={
                "difficulty": example.difficulty,
                "category": example.category,
                "description": example.description,
            },
        )

    stats = get_activity_stats()
    print(f"Dataset created with {stats['total']} examples")
    print(f"  By category: {stats['by_category']}")
    print(f"  By difficulty: {stats['by_difficulty']}")
    print(f"  By activity: {stats['by_expected_activity']}")

    return str(dataset.id)


def seed_conversation_dataset(client: Client, force: bool = False) -> str:
    """
    Create or update the conversation quality dataset in LangSmith.

    Args:
        client: LangSmith client
        force: If True, delete existing dataset and recreate

    Returns:
        Dataset ID
    """
    dataset_name = CONVERSATION_DATASET_NAME

    # Check if dataset exists
    try:
        existing = client.read_dataset(dataset_name=dataset_name)
        if not force:
            print(f"Dataset '{dataset_name}' already exists (id: {existing.id})")
            print("Use --force to recreate it")
            return str(existing.id)
        else:
            print(f"Deleting existing dataset '{dataset_name}'...")
            client.delete_dataset(dataset_id=existing.id)
    except Exception:
        pass  # Dataset doesn't exist, create it

    # Create new dataset
    print(f"Creating dataset '{dataset_name}'...")
    dataset = client.create_dataset(
        dataset_name=dataset_name,
        description="Conversation quality test cases for wellness chatbot responses",
    )

    # Add examples
    print(f"Adding {len(CONVERSATION_DATASET)} examples...")
    for example in CONVERSATION_DATASET:
        client.create_example(
            dataset_id=dataset.id,
            inputs={
                "input": example.input,
                "context": example.context,
                "user_context": example.user_context,
            },
            outputs={
                "expected_traits": example.expected_traits,
                "safety_requirements": example.safety_requirements,
            },
            metadata={
                "scenario": example.scenario,
                "description": example.description,
            },
        )

    stats = get_conversation_stats()
    print(f"Dataset created with {stats['total']} examples")
    print(f"  By scenario: {stats['by_scenario']}")

    return str(dataset.id)


def seed_all_datasets(force: bool = False) -> dict[str, str]:
    """
    Seed all evaluation datasets to LangSmith.

    Args:
        force: If True, delete existing datasets and recreate

    Returns:
        Dict mapping dataset names to IDs
    """
    client = get_langsmith_client()

    results = {}

    print("\n=== Seeding Activity Detection Dataset ===")
    results["activity_detection"] = seed_activity_detection_dataset(client, force)

    print("\n=== Seeding Conversation Quality Dataset ===")
    results["conversation"] = seed_conversation_dataset(client, force)

    print("\n=== All datasets seeded ===")
    return results


if __name__ == "__main__":
    import sys

    force = "--force" in sys.argv
    seed_all_datasets(force=force)
