"""
============================================================================
Evaluation Configuration
============================================================================
Model configurations and evaluation profiles for comparing LLM performance.

This module defines:
- ModelConfig: Dataclass for model metadata (name, provider, cost, etc.)
- EVAL_MODELS: Registry of all models available for evaluation
- EVAL_PROFILES: Pre-defined model combinations for different eval types
============================================================================
"""

from collections.abc import Callable
from dataclasses import dataclass, field
from enum import Enum

from langchain_core.language_models.chat_models import BaseChatModel

from src.llm.providers import (
    MODEL_CEREBRAS_GLM,
    MODEL_GEMINI_FLASH,
    MODEL_GEMINI_LITE,
    MODEL_GLM_4_7,
    MODEL_GLM_FLASH,
    MODEL_GLM_FLASHX,
    MODEL_HAIKU,
    _create_anthropic_model,
    _create_cerebras_model,
    _create_glm_model,
    _create_google_lite_model,
    _create_google_model,
)


class ModelProvider(Enum):
    """LLM provider identifiers."""

    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    ZAI = "zai"
    CEREBRAS = "cerebras"


@dataclass
class ModelConfig:
    """
    Configuration for a model to be evaluated.

    Attributes:
        name: Human-readable name for display in reports
        model_id: The actual model identifier string
        provider: Which LLM provider (for API key selection)
        cost_per_1k_input: Estimated cost per 1000 input tokens (USD)
        cost_per_1k_output: Estimated cost per 1000 output tokens (USD)
        description: Brief description of model capabilities
        factory: Function to create a LangChain model instance
        structured_output_method: Method for with_structured_output().
                                  Use "json_mode" for GLM models via OpenAI-compatible API.
                                  Default None uses the model's default (json_schema).
    """

    name: str
    model_id: str
    provider: ModelProvider
    cost_per_1k_input: float
    cost_per_1k_output: float
    description: str
    factory: Callable[[float, int], BaseChatModel]
    structured_output_method: str | None = field(default=None)
    max_concurrency: int = field(default=4)  # Max concurrent API calls for evaluation

    def create(self, temperature: float = 0.2, max_tokens: int = 1024) -> BaseChatModel:
        """Create a LangChain model instance with the given parameters."""
        return self.factory(temperature, max_tokens)


# -----------------------------------------------------------------------------
# Model Registry
# -----------------------------------------------------------------------------
# All models available for evaluation, keyed by short identifier.
# These identifiers are used in CLI commands and profile definitions.

EVAL_MODELS: dict[str, ModelConfig] = {
    # Anthropic Models
    "haiku": ModelConfig(
        name="Claude Haiku 4.5",
        model_id=MODEL_HAIKU,
        provider=ModelProvider.ANTHROPIC,
        cost_per_1k_input=0.00080,  # $0.80 per million
        cost_per_1k_output=0.00400,  # $4.00 per million
        description="Fast, intelligent model for complex responses and conversation",
        factory=_create_anthropic_model,
    ),
    # Google Models
    "gemini-flash": ModelConfig(
        name="Gemini 3 Flash Preview",
        model_id=MODEL_GEMINI_FLASH,
        provider=ModelProvider.GOOGLE,
        cost_per_1k_input=0.00010,  # Estimated - very low
        cost_per_1k_output=0.00040,  # Estimated
        description="Fast preview model for routing and classification",
        factory=_create_google_model,
    ),
    "gemini-lite": ModelConfig(
        name="Gemini 2.5 Flash-Lite",
        model_id=MODEL_GEMINI_LITE,
        provider=ModelProvider.GOOGLE,
        cost_per_1k_input=0.00005,  # Estimated - very low
        cost_per_1k_output=0.00020,  # Estimated
        description="Extremely fast, cost-effective for simple tasks",
        factory=_create_google_lite_model,
    ),
    # Z.AI GLM Models
    # Note: GLM models use method="json_mode" for structured output because the
    # OpenAI-compatible API doesn't fully support json_schema structured output.
    # See: https://docs.z.ai/guides/capabilities/struct-output
    "glm-4.7": ModelConfig(
        name="GLM-4.7",
        model_id=MODEL_GLM_4_7,
        provider=ModelProvider.ZAI,
        cost_per_1k_input=0.00050,  # Estimated
        cost_per_1k_output=0.00200,  # Estimated
        description="Flagship model with enhanced coding and multi-step reasoning",
        factory=lambda t, m: _create_glm_model(MODEL_GLM_4_7, t, m),
        structured_output_method="json_mode",
        max_concurrency=1,  # GLM has strict rate limits
    ),
    "glm-flash": ModelConfig(
        name="GLM-4.7-Flash",
        model_id=MODEL_GLM_FLASH,
        provider=ModelProvider.ZAI,
        cost_per_1k_input=0.00000,  # Free tier
        cost_per_1k_output=0.00000,  # Free tier
        description="Lightweight, free variant with good speed/quality balance",
        factory=lambda t, m: _create_glm_model(MODEL_GLM_FLASH, t, m),
        structured_output_method="json_mode",
        max_concurrency=1,  # GLM has strict rate limits
    ),
    "glm-flashx": ModelConfig(
        name="GLM-4.7-FlashX",
        model_id=MODEL_GLM_FLASHX,
        provider=ModelProvider.ZAI,
        cost_per_1k_input=0.00001,  # Very low
        cost_per_1k_output=0.00004,  # Very low
        description="High-speed, affordable option",
        factory=lambda t, m: _create_glm_model(MODEL_GLM_FLASHX, t, m),
        structured_output_method="json_mode",
        max_concurrency=1,  # GLM has strict rate limits
    ),
    # Cerebras Models
    # Note: Cerebras provides fast inference via custom hardware.
    # Uses OpenAI-compatible API with json_mode for structured output.
    "cerebras-glm": ModelConfig(
        name="Cerebras GLM-4.7",
        model_id=MODEL_CEREBRAS_GLM,
        provider=ModelProvider.CEREBRAS,
        cost_per_1k_input=0.00060,  # Estimated based on Cerebras pricing
        cost_per_1k_output=0.00060,  # Estimated - same rate for input/output
        description="GLM-4.7 on Cerebras hardware - extremely fast inference",
        factory=_create_cerebras_model,
        structured_output_method="json_mode",
        max_concurrency=1,  # Use 1 for debugging, can increase later
    ),
}


# -----------------------------------------------------------------------------
# Evaluation Profiles
# -----------------------------------------------------------------------------
# Pre-defined model combinations for different evaluation scenarios.
# These are used via CLI: --profile activity_detection

EVAL_PROFILES: dict[str, list[str]] = {
    # Activity detection: test fast, cheap models for classification
    "activity_detection": [
        "gemini-lite",
        "gemini-flash",
        "glm-flash",
        "glm-flashx",
        "cerebras-glm",
    ],
    # Conversation quality: test quality-focused models for responses
    "conversation": [
        "haiku",
        "glm-4.7",
        "gemini-flash",
        "cerebras-glm",
    ],
    # Full comparison: test all models across all tasks
    "full_comparison": [
        "haiku",
        "gemini-flash",
        "gemini-lite",
        "glm-4.7",
        "glm-flash",
        "glm-flashx",
        "cerebras-glm",
    ],
    # Budget-friendly: focus on low/no cost models
    "budget": [
        "gemini-lite",
        "glm-flash",
        "glm-flashx",
    ],
    # Quality-first: best models regardless of cost
    "quality": [
        "haiku",
        "glm-4.7",
        "gemini-flash",
        "cerebras-glm",
    ],
}


def get_models_for_profile(profile: str) -> list[ModelConfig]:
    """
    Get ModelConfig instances for all models in a profile.

    Args:
        profile: Name of the evaluation profile

    Returns:
        List of ModelConfig instances

    Raises:
        ValueError: If profile doesn't exist
    """
    if profile not in EVAL_PROFILES:
        available = ", ".join(EVAL_PROFILES.keys())
        raise ValueError(f"Unknown profile '{profile}'. Available: {available}")

    model_ids = EVAL_PROFILES[profile]
    return [EVAL_MODELS[model_id] for model_id in model_ids]


def get_model_by_id(model_id: str) -> ModelConfig:
    """
    Get a ModelConfig by its short identifier.

    Args:
        model_id: Short identifier (e.g., "haiku", "gemini-lite")

    Returns:
        ModelConfig instance

    Raises:
        ValueError: If model_id doesn't exist
    """
    if model_id not in EVAL_MODELS:
        available = ", ".join(EVAL_MODELS.keys())
        raise ValueError(f"Unknown model '{model_id}'. Available: {available}")

    return EVAL_MODELS[model_id]


def list_available_models() -> list[dict[str, str]]:
    """
    List all available models with their metadata.

    Returns:
        List of dicts with model info for display
    """
    return [
        {
            "id": model_id,
            "name": config.name,
            "provider": config.provider.value,
            "description": config.description,
            "cost_input": f"${config.cost_per_1k_input:.5f}/1k",
            "cost_output": f"${config.cost_per_1k_output:.5f}/1k",
        }
        for model_id, config in EVAL_MODELS.items()
    ]
