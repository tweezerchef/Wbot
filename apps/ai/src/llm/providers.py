"""
============================================================================
LLM Provider Configuration
============================================================================
Configures and creates language model instances with tier-based selection.

Model tiers:
- LITE: Gemini 2.5 Flash-Lite - for very simple tasks (activity detection)
- FAST: Gemini 3 Flash Preview - for routing, classification, structured extraction
- STANDARD: Claude Haiku 4.5 - for complex responses, conversation

Fallback chain (on 429 rate limit errors):
- Gemini 3 Flash → Haiku → Gemini 2.5 Flash-Lite
- Gemini 2.5 Flash-Lite → Haiku
- Haiku → Gemini 2.5 Flash-Lite
============================================================================
"""

import os
from enum import Enum
from typing import Any

from langchain_core.language_models.chat_models import BaseChatModel
from pydantic import BaseModel

from src.logging_config import NodeLogger

logger = NodeLogger("llm_providers")


class ModelTier(Enum):
    """
    Model tiers for different use cases.

    LITE: Use for very simple classification tasks.
          Currently uses Gemini 2.5 Flash-Lite.

    FAST: Use for routing, classification, and structured extraction.
          Currently uses Gemini 3 Flash Preview.

    STANDARD: Use for complex responses and main conversation.
              Currently uses Claude Haiku 4.5.
    """

    LITE = "lite"
    FAST = "fast"
    STANDARD = "standard"


# Model identifiers
MODEL_GEMINI_FLASH = "gemini-3-flash-preview"
MODEL_GEMINI_LITE = "gemini-2.5-flash-lite"
MODEL_HAIKU = "claude-haiku-4-5-20251001"

# Fallback chain for rate limit handling
# Each model maps to a list of fallback models to try in order
FALLBACK_CHAIN: dict[str, list[str]] = {
    MODEL_GEMINI_FLASH: [MODEL_HAIKU, MODEL_GEMINI_LITE],
    MODEL_GEMINI_LITE: [MODEL_HAIKU],
    MODEL_HAIKU: [MODEL_GEMINI_LITE],
}

# Map tiers to their primary model
TIER_TO_MODEL: dict[ModelTier, str] = {
    ModelTier.LITE: MODEL_GEMINI_LITE,
    ModelTier.FAST: MODEL_GEMINI_FLASH,
    ModelTier.STANDARD: MODEL_HAIKU,
}


def is_rate_limit_error(error: Exception) -> bool:
    """
    Check if an exception is a rate limit error (429).

    Detects rate limits via:
    - HTTP 429 status code
    - Error message containing "429", "RESOURCE_EXHAUSTED", or "quota"
    """
    error_str = str(error).lower()
    return (
        "429" in error_str
        or "resource_exhausted" in error_str
        or "quota" in error_str
        or "rate limit" in error_str
    )


def create_llm(
    tier: ModelTier = ModelTier.STANDARD,
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> BaseChatModel:
    """
    Creates a language model instance based on the specified tier.

    Args:
        tier: Which model tier to use.
              LITE for very simple tasks (Gemini 2.5 Flash-Lite).
              FAST for routing/classification (Gemini 3 Flash).
              STANDARD for complex responses (Claude Haiku 4.5).

        temperature: Controls randomness in responses.
                     0.0 = deterministic, 1.0 = very random.

        max_tokens: Maximum tokens in the response.

    Returns:
        A LangChain chat model configured for the specified tier.

    Example:
        # Use default (STANDARD) for conversation responses
        llm = create_llm()

        # Use LITE for simple classification
        llm = create_llm(tier=ModelTier.LITE, temperature=0.2)

        # Use FAST for routing and structured extraction
        llm = create_llm(tier=ModelTier.FAST, temperature=0.2)
    """
    if tier == ModelTier.LITE:
        return _create_google_lite_model(temperature, max_tokens)
    elif tier == ModelTier.FAST:
        return _create_google_model(temperature, max_tokens)
    else:
        return _create_anthropic_model(temperature, max_tokens)


def _create_model_by_name(model_name: str, temperature: float, max_tokens: int) -> BaseChatModel:
    """
    Creates a model instance by model name.

    Used internally for fallback chain handling.
    """
    if model_name == MODEL_GEMINI_FLASH:
        return _create_google_model(temperature, max_tokens)
    elif model_name == MODEL_GEMINI_LITE:
        return _create_google_lite_model(temperature, max_tokens)
    elif model_name == MODEL_HAIKU:
        return _create_anthropic_model(temperature, max_tokens)
    else:
        raise ValueError(f"Unknown model: {model_name}")


def _create_anthropic_model(temperature: float, max_tokens: int) -> BaseChatModel:
    """
    Creates an Anthropic Claude Haiku 4.5 model instance.

    Used for complex responses and main conversation:
    - Excellent at nuanced, empathetic conversation
    - Strong instruction following
    - Fast and cost-effective

    Requires: ANTHROPIC_API_KEY environment variable
    """
    from langchain_anthropic import ChatAnthropic

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY environment variable is required for Anthropic models. "
            "Get your API key from https://console.anthropic.com/"
        )

    return ChatAnthropic(
        model="claude-haiku-4-5-20251001",
        temperature=temperature,
        max_tokens=max_tokens,
    )


def _create_google_model(temperature: float, max_tokens: int) -> BaseChatModel:
    """
    Creates a Google Gemini 3 Flash Preview model instance.

    Used for routing, classification, and simple tasks:
    - Very fast response times
    - Excellent for quick decisions
    - Cost-effective

    Requires: GOOGLE_API_KEY environment variable
    """
    from langchain_google_genai import ChatGoogleGenerativeAI

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError(
            "GOOGLE_API_KEY environment variable is required for Google models. "
            "Get your API key from https://makersuite.google.com/app/apikey"
        )

    return ChatGoogleGenerativeAI(
        model="gemini-3-flash-preview",
        temperature=temperature,
        max_output_tokens=max_tokens,
    )


def _create_google_lite_model(temperature: float, max_tokens: int) -> BaseChatModel:
    """
    Creates a Google Gemini 2.5 Flash-Lite model instance.

    Used for very simple tasks like activity detection:
    - Extremely fast response times
    - Very cost-effective
    - Good for simple classification

    Requires: GOOGLE_API_KEY environment variable
    """
    from langchain_google_genai import ChatGoogleGenerativeAI

    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError(
            "GOOGLE_API_KEY environment variable is required for Google models. "
            "Get your API key from https://makersuite.google.com/app/apikey"
        )

    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash-lite",
        temperature=temperature,
        max_output_tokens=max_tokens,
    )


# -----------------------------------------------------------------------------
# Resilient LLM with Fallback Support
# -----------------------------------------------------------------------------


class ResilientLLM:
    """
    Wrapper around BaseChatModel that provides automatic fallback on rate limits.

    When a 429 rate limit error is encountered, automatically retries with
    the next model in the fallback chain.

    Fallback chain:
    - Gemini 3 Flash → Haiku → Gemini 2.5 Flash-Lite
    - Gemini 2.5 Flash-Lite → Haiku
    - Haiku → Gemini 2.5 Flash-Lite

    Example:
        llm = create_resilient_llm(tier=ModelTier.FAST)
        result = await llm.ainvoke(messages)  # Auto-fallback on 429
    """

    def __init__(
        self,
        tier: ModelTier,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> None:
        self.tier = tier
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.primary_model_name = TIER_TO_MODEL[tier]

        # Create primary model
        self.primary = create_llm(tier, temperature, max_tokens)

        # Get fallback model names
        self.fallback_names = FALLBACK_CHAIN.get(self.primary_model_name, [])

    async def ainvoke(
        self,
        input: Any,
        **kwargs: Any,  # noqa: ANN401
    ) -> Any:  # noqa: ANN401
        """
        Invoke the LLM with automatic fallback on rate limit errors.
        """
        # Try primary model
        try:
            return await self.primary.ainvoke(input, **kwargs)
        except Exception as e:
            if not is_rate_limit_error(e):
                raise

            logger.warning(
                "Rate limit hit, trying fallback",
                primary=self.primary_model_name,
                error=str(e)[:100],
            )

        # Try fallback models
        for fallback_name in self.fallback_names:
            try:
                logger.info("Trying fallback model", model=fallback_name)
                fallback = _create_model_by_name(fallback_name, self.temperature, self.max_tokens)
                return await fallback.ainvoke(input, **kwargs)
            except Exception as e:
                if not is_rate_limit_error(e):
                    raise
                logger.warning(
                    "Fallback also rate limited",
                    model=fallback_name,
                    error=str(e)[:100],
                )
                continue

        # All fallbacks exhausted
        raise RuntimeError(
            f"All models rate limited. Tried: {self.primary_model_name}, "
            f"{', '.join(self.fallback_names)}"
        )

    def with_structured_output(
        self,
        schema: type[BaseModel],
        **kwargs: Any,  # noqa: ANN401
    ) -> "ResilientStructuredLLM":
        """
        Return a wrapper that handles structured output with fallback.
        """
        return ResilientStructuredLLM(self, schema, **kwargs)


class ResilientStructuredLLM:
    """
    Wrapper for structured output with fallback support.
    """

    def __init__(
        self,
        resilient_llm: ResilientLLM,
        schema: type[BaseModel],
        **kwargs: Any,  # noqa: ANN401
    ) -> None:
        self.resilient_llm = resilient_llm
        self.schema = schema
        self.kwargs = kwargs

    async def ainvoke(
        self,
        input: Any,
        **invoke_kwargs: Any,  # noqa: ANN401
    ) -> Any:  # noqa: ANN401
        """
        Invoke structured LLM with automatic fallback on rate limit errors.
        """
        tier = self.resilient_llm.tier
        temp = self.resilient_llm.temperature
        max_tok = self.resilient_llm.max_tokens
        primary_name = self.resilient_llm.primary_model_name
        fallback_names = self.resilient_llm.fallback_names

        # Try primary model
        try:
            primary = create_llm(tier, temp, max_tok)
            structured = primary.with_structured_output(self.schema, **self.kwargs)
            return await structured.ainvoke(input, **invoke_kwargs)
        except Exception as e:
            if not is_rate_limit_error(e):
                raise

            logger.warning(
                "Rate limit hit on structured call, trying fallback",
                primary=primary_name,
                error=str(e)[:100],
            )

        # Try fallback models
        for fallback_name in fallback_names:
            try:
                logger.info("Trying fallback model", model=fallback_name)
                fallback = _create_model_by_name(fallback_name, temp, max_tok)
                structured = fallback.with_structured_output(self.schema, **self.kwargs)
                return await structured.ainvoke(input, **invoke_kwargs)
            except Exception as e:
                if not is_rate_limit_error(e):
                    raise
                logger.warning(
                    "Fallback also rate limited",
                    model=fallback_name,
                    error=str(e)[:100],
                )
                continue

        # All fallbacks exhausted
        raise RuntimeError(
            f"All models rate limited for structured output. "
            f"Tried: {primary_name}, {', '.join(fallback_names)}"
        )


def create_resilient_llm(
    tier: ModelTier = ModelTier.STANDARD,
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> ResilientLLM:
    """
    Creates a resilient LLM with automatic fallback on rate limits.

    Use this instead of create_llm() when you want automatic retry
    on 429 errors.

    Args:
        tier: Which model tier to use as primary.
        temperature: Controls randomness in responses.
        max_tokens: Maximum tokens in the response.

    Returns:
        A ResilientLLM instance with fallback support.

    Example:
        llm = create_resilient_llm(tier=ModelTier.FAST, temperature=0.2)
        result = await llm.ainvoke(messages)  # Auto-fallback on 429

        # With structured output
        structured = llm.with_structured_output(MySchema)
        result = await structured.ainvoke(prompt)
    """
    return ResilientLLM(tier, temperature, max_tokens)
