"""
============================================================================
Tests for Embeddings Module
============================================================================
Tests embedding generation using Google's Gemini model.

Tests:
- generate_embedding(): Vector generation with correct dimensions
- generate_embeddings_batch(): Batch processing
- format_memory_text(): Text formatting for embeddings
============================================================================
"""

from unittest.mock import MagicMock, patch

import pytest

from src.memory.embeddings import (
    EMBEDDING_DIMENSIONS,
    format_memory_text,
    generate_embedding,
    generate_embeddings_batch,
)

# =============================================================================
# generate_embedding() Tests
# =============================================================================


@pytest.mark.asyncio
async def test_generate_embedding_returns_768_dimensions(mock_env):
    """generate_embedding() should return 768-dimensional vector."""
    with patch("src.memory.embeddings.get_genai_client") as mock_get_client:
        # Setup mock
        mock_client = MagicMock()
        mock_embedding = MagicMock()
        mock_embedding.values = [0.1] * 768
        mock_result = MagicMock()
        mock_result.embeddings = [mock_embedding]
        mock_client.models.embed_content.return_value = mock_result
        mock_get_client.return_value = mock_client

        # Call function
        result = await generate_embedding("Test text")

        # Verify dimensions
        assert len(result) == 768
        assert all(isinstance(x, (int, float)) for x in result)


@pytest.mark.asyncio
async def test_generate_embedding_uses_correct_model(mock_env):
    """generate_embedding() should use gemini-embedding-001 model."""
    with patch("src.memory.embeddings.get_genai_client") as mock_get_client:
        # Setup mock
        mock_client = MagicMock()
        mock_embedding = MagicMock()
        mock_embedding.values = [0.1] * 768
        mock_result = MagicMock()
        mock_result.embeddings = [mock_embedding]
        mock_client.models.embed_content.return_value = mock_result
        mock_get_client.return_value = mock_client

        # Call function
        await generate_embedding("Test text")

        # Verify correct model was used
        call_args = mock_client.models.embed_content.call_args
        assert call_args[1]["model"] == "gemini-embedding-001"


@pytest.mark.asyncio
async def test_generate_embedding_uses_semantic_similarity_task(mock_env):
    """generate_embedding() should use SEMANTIC_SIMILARITY task type."""
    with patch("src.memory.embeddings.get_genai_client") as mock_get_client:
        # Setup mock
        mock_client = MagicMock()
        mock_embedding = MagicMock()
        mock_embedding.values = [0.1] * 768
        mock_result = MagicMock()
        mock_result.embeddings = [mock_embedding]
        mock_client.models.embed_content.return_value = mock_result
        mock_get_client.return_value = mock_client

        # Call function
        await generate_embedding("Test text")

        # Verify task type
        call_args = mock_client.models.embed_content.call_args
        config = call_args[1]["config"]
        assert config.task_type == "SEMANTIC_SIMILARITY"
        assert config.output_dimensionality == EMBEDDING_DIMENSIONS


@pytest.mark.asyncio
async def test_generate_embedding_handles_api_errors():
    """generate_embedding() should propagate API errors."""
    with patch("src.memory.embeddings.get_genai_client") as mock_get_client:
        # Setup mock to raise error
        mock_client = MagicMock()
        mock_client.models.embed_content.side_effect = Exception("API Error")
        mock_get_client.return_value = mock_client

        # Should raise the error (caller handles it)
        with pytest.raises(Exception, match="API Error"):
            await generate_embedding("Test")


# =============================================================================
# generate_embeddings_batch() Tests
# =============================================================================


@pytest.mark.asyncio
async def test_generate_embeddings_batch_returns_multiple_vectors(mock_env):
    """generate_embeddings_batch() should return one vector per input text."""
    with patch("src.memory.embeddings.get_genai_client") as mock_get_client:
        # Setup mock
        mock_client = MagicMock()
        mock_emb1 = MagicMock()
        mock_emb1.values = [0.1] * 768
        mock_emb2 = MagicMock()
        mock_emb2.values = [0.2] * 768
        mock_result = MagicMock()
        mock_result.embeddings = [mock_emb1, mock_emb2]
        mock_client.models.embed_content.return_value = mock_result
        mock_get_client.return_value = mock_client

        # Call function
        results = await generate_embeddings_batch(["Text 1", "Text 2"])

        # Verify 2 embeddings returned
        assert len(results) == 2
        assert len(results[0]) == 768
        assert len(results[1]) == 768


@pytest.mark.asyncio
async def test_generate_embeddings_batch_handles_empty_list(mock_env):
    """generate_embeddings_batch() should handle empty input list."""
    # Call with empty list
    results = await generate_embeddings_batch([])

    # Should return empty list without API call
    assert results == []


# =============================================================================
# format_memory_text() Tests
# =============================================================================


def test_format_memory_text_includes_both_messages():
    """format_memory_text() should include both user and assistant messages."""
    result = format_memory_text("I'm feeling stressed", "Let's try breathing together")

    assert "I'm feeling stressed" in result
    assert "Let's try breathing together" in result


def test_format_memory_text_uses_correct_format():
    """format_memory_text() should format as 'User: ... Assistant: ...'."""
    result = format_memory_text("Hello", "Hi there")

    assert "User: Hello" in result
    assert "Assistant: Hi there" in result


def test_format_memory_text_separates_with_newlines():
    """format_memory_text() should separate messages with newlines."""
    result = format_memory_text("Message 1", "Message 2")

    # Should have double newline separator
    assert "\n\n" in result


def test_format_memory_text_handles_special_characters():
    """format_memory_text() should handle special characters in messages."""
    user_msg = "I'm feeling 100% stressed! 😰"
    ai_msg = "I hear you're feeling stressed—let's breathe."

    result = format_memory_text(user_msg, ai_msg)

    # Should preserve special characters
    assert "100%" in result
    assert "😰" in result
    assert "—" in result
