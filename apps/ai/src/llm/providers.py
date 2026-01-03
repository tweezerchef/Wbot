"""
============================================================================
LLM Provider Configuration
============================================================================
Configures and creates language model instances with tier-based selection.

Model tiers:
- FAST: Gemini 3 Flash Preview - for routing, classification, simple tasks
- STANDARD: Claude Haiku 4.5 - for complex responses, conversation

Model selection rationale:
- Gemini 3 Flash: High-speed model ideal for quick decisions and routing
- Claude Haiku 4.5: Nuanced, empathetic responses with good instruction following
============================================================================
"""

import os
from enum import Enum

from langchain_core.language_models.chat_models import BaseChatModel


class ModelTier(Enum):
    """
    Model tiers for different use cases.

    FAST: Use for routing, classification, and simple tasks.
          Currently uses Gemini 3 Flash Preview.

    STANDARD: Use for complex responses and main conversation.
              Currently uses Claude Haiku 4.5.
    """

    FAST = "fast"
    STANDARD = "standard"


def create_llm(
    tier: ModelTier = ModelTier.STANDARD,
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> BaseChatModel:
    """
    Creates a language model instance based on the specified tier.

    Args:
        tier: Which model tier to use.
              FAST for routing/simple tasks (Gemini 3 Flash).
              STANDARD for complex responses (Claude Haiku 4.5).

        temperature: Controls randomness in responses.
                     0.0 = deterministic, 1.0 = very random.

        max_tokens: Maximum tokens in the response.

    Returns:
        A LangChain chat model configured for the specified tier.

    Example:
        # Use default (STANDARD) for conversation responses
        llm = create_llm()

        # Use FAST for routing and classification
        llm = create_llm(tier=ModelTier.FAST, temperature=0.2)
    """
    if tier == ModelTier.FAST:
        return _create_google_model(temperature, max_tokens)
    else:
        return _create_anthropic_model(temperature, max_tokens)


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
