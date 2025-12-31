"""
============================================================================
LLM Provider Configuration
============================================================================
Configures and creates language model instances.

Supported providers:
- Anthropic (Claude) - Primary model for therapy conversations
- Google (Gemini) - Alternative/experimental model

The provider can be selected via:
1. Environment variable (LLM_PROVIDER)
2. Explicit parameter to create_llm()

Model selection rationale:
- Claude: Known for nuanced, empathetic responses; good at following
  complex instructions; strong at maintaining conversation context
- Gemini: Fast responses; good for experimentation; different style

Both models are configured with:
- Moderate temperature (0.7) for natural, varied responses
- Reasonable token limits for chat
- Streaming enabled for real-time output
============================================================================
"""

import os
from enum import Enum

from langchain_core.language_models.chat_models import BaseChatModel


class LLMProvider(Enum):
    """
    Supported LLM providers.

    Use these values when selecting a provider explicitly
    or setting the LLM_PROVIDER environment variable.
    """

    ANTHROPIC = "anthropic"
    GOOGLE = "google"


def create_llm(
    provider: LLMProvider | None = None,
    temperature: float = 0.7,
    max_tokens: int = 1024,
) -> BaseChatModel:
    """
    Creates a language model instance.

    Args:
        provider: Which LLM provider to use. If None, reads from
                  LLM_PROVIDER environment variable (default: anthropic).

        temperature: Controls randomness in responses.
                     0.0 = deterministic, 1.0 = very random.
                     0.7 is a good balance for natural conversation.

        max_tokens: Maximum tokens in the response.
                    1024 is reasonable for chat responses.

    Returns:
        A LangChain chat model configured for the specified provider.

    Raises:
        ValueError: If the provider is not recognized.
        ImportError: If the provider's package is not installed.

    Example:
        # Use default provider (from env or anthropic)
        llm = create_llm()

        # Explicitly use Gemini
        llm = create_llm(provider=LLMProvider.GOOGLE)

        # Custom settings
        llm = create_llm(temperature=0.3, max_tokens=2048)
    """
    # Determine which provider to use
    if provider is None:
        provider_str = os.getenv("LLM_PROVIDER", "anthropic").lower()
        try:
            provider = LLMProvider(provider_str)
        except ValueError:
            raise ValueError(
                f"Unknown LLM_PROVIDER: '{provider_str}'. "
                f"Valid options: {[p.value for p in LLMProvider]}"
            )

    # Create the appropriate model
    if provider == LLMProvider.ANTHROPIC:
        return _create_anthropic_model(temperature, max_tokens)
    elif provider == LLMProvider.GOOGLE:
        return _create_google_model(temperature, max_tokens)
    else:
        raise ValueError(f"Unsupported provider: {provider}")


def _create_anthropic_model(temperature: float, max_tokens: int) -> BaseChatModel:
    """
    Creates an Anthropic Claude model instance.

    Uses Claude 3.5 Sonnet as the default model:
    - Excellent at nuanced, empathetic conversation
    - Strong instruction following
    - Good balance of capability and cost

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
        # Claude 3.5 Sonnet - good balance of quality and speed
        model="claude-sonnet-4-20250514",
        temperature=temperature,
        max_tokens=max_tokens,
        # API key is read from environment automatically
        # but we validate it exists above for better error messages
    )


def _create_google_model(temperature: float, max_tokens: int) -> BaseChatModel:
    """
    Creates a Google Gemini model instance.

    Uses Gemini 1.5 Flash as the default model:
    - Fast response times
    - Good for experimentation
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
        # Gemini 1.5 Flash - fast and capable
        model="gemini-2.0-flash-exp",
        temperature=temperature,
        max_output_tokens=max_tokens,
        # API key is read from environment automatically
    )
