"""
============================================================================
Embeddings Module
============================================================================
Generates text embeddings for semantic memory storage using Gemini.

Uses Google's gemini-embedding-001 model:
- 768 dimensions (configurable, using recommended size for balance)
- Task type: SEMANTIC_SIMILARITY for memory retrieval
- Fast inference, good quality

The embeddings are used to:
1. Store memories in the vector database (Supabase pgvector)
2. Search for semantically similar past conversations
============================================================================
"""

import asyncio
import os
from functools import lru_cache

from google import genai
from google.genai import types

# Embedding dimensions - 768 is a good balance of quality and storage
# Gemini supports 128 to 3072 dimensions
EMBEDDING_DIMENSIONS = 768


@lru_cache(maxsize=1)
def get_genai_client() -> genai.Client:
    """
    Returns a cached Google GenAI client instance.

    Uses GOOGLE_API_KEY environment variable for authentication.
    The same key used for Gemini LLM also works for embeddings.

    Returns:
        genai.Client instance configured for API access.

    Raises:
        ValueError: If GOOGLE_API_KEY is not set.
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError(
            "GOOGLE_API_KEY environment variable is required for embeddings. "
            "Get your API key from https://makersuite.google.com/app/apikey"
        )

    return genai.Client(api_key=api_key)


async def generate_embedding(text: str) -> list[float]:
    """
    Generates an embedding vector for the given text.

    Uses Gemini's gemini-embedding-001 model with SEMANTIC_SIMILARITY task type
    for optimal performance in memory retrieval use cases.

    Args:
        text: The text to embed. For memories, this should be
              the combined user message + AI response.

    Returns:
        A list of 768 floats representing the text embedding.

    Example:
        >>> embedding = await generate_embedding("I'm feeling stressed about work")
        >>> len(embedding)
        768
    """
    client = get_genai_client()

    # Wrap blocking API call in thread pool to avoid blocking the event loop
    # The google-genai client uses synchronous HTTP calls
    def _embed() -> genai.types.EmbedContentResponse:
        return client.models.embed_content(
            model="gemini-embedding-001",
            contents=text,
            config=types.EmbedContentConfig(
                task_type="SEMANTIC_SIMILARITY",
                output_dimensionality=EMBEDDING_DIMENSIONS,
            ),
        )

    result = await asyncio.to_thread(_embed)

    # The API returns a list of embeddings, we only sent one text
    return list(result.embeddings[0].values)


async def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """
    Generates embeddings for multiple texts in a single API call.

    More efficient than calling generate_embedding() multiple times
    when you have several texts to embed.

    Args:
        texts: List of texts to embed.

    Returns:
        List of embedding vectors (each is a list of 768 floats).

    Example:
        >>> embeddings = await generate_embeddings_batch(["Hello", "World"])
        >>> len(embeddings)
        2
    """
    if not texts:
        return []

    client = get_genai_client()

    # Wrap blocking API call in thread pool to avoid blocking the event loop
    def _embed_batch() -> genai.types.EmbedContentResponse:
        return client.models.embed_content(
            model="gemini-embedding-001",
            contents=texts,
            config=types.EmbedContentConfig(
                task_type="SEMANTIC_SIMILARITY",
                output_dimensionality=EMBEDDING_DIMENSIONS,
            ),
        )

    result = await asyncio.to_thread(_embed_batch)

    return [list(emb.values) for emb in result.embeddings]


def format_memory_text(user_message: str, ai_response: str) -> str:
    """
    Formats a conversation pair into text for embedding.

    The format is designed to:
    - Capture the context of both messages
    - Work well with embedding models
    - Be readable if inspected manually

    Args:
        user_message: The user's message
        ai_response: The AI's response

    Returns:
        Formatted string combining both messages.

    Example:
        >>> text = format_memory_text("I'm stressed", "I hear you...")
        >>> print(text)
        User: I'm stressed

        Assistant: I hear you...
    """
    return f"User: {user_message}\n\nAssistant: {ai_response}"
