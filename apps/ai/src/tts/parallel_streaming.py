"""
============================================================================
Parallel Streaming Pipeline
============================================================================
Streams meditation scripts from Claude to ElevenLabs TTS in real-time.

Pipeline flow:
1. Claude generates script tokens (streaming)
2. Tokens are buffered until sentence boundary
3. Each complete sentence is sent to ElevenLabs
4. Audio chunks are yielded to the client in real-time
5. Complete audio is cached after streaming finishes

This approach minimizes time-to-first-audio:
- Audio starts playing within 2-3 seconds (first sentence)
- User hears audio while Claude is still generating
============================================================================
"""

import hashlib
import os
import re
from collections.abc import AsyncGenerator, Callable
from dataclasses import dataclass, field

import httpx
from langchain_core.messages import HumanMessage

from src.auth import get_supabase_client
from src.llm.providers import ModelTier, create_llm
from src.logging_config import NodeLogger

logger = NodeLogger("parallel_streaming")

ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"


@dataclass
class StreamingConfig:
    """Configuration for the streaming pipeline."""

    voice_id: str
    model_id: str = "eleven_multilingual_v2"
    stability: float = 0.75
    similarity_boost: float = 0.75
    style: float = 0.5
    use_speaker_boost: bool = True


@dataclass
class StreamingState:
    """State tracking for the streaming pipeline."""

    sentence_buffer: str = ""
    audio_chunks: list[bytes] = field(default_factory=list)
    total_script: str = ""
    sentences_sent: int = 0
    bytes_streamed: int = 0


# Sentence boundary pattern for meditation scripts
# Matches: period, exclamation, question mark, or double newline (paragraph break)
SENTENCE_BOUNDARY_PATTERN = re.compile(r"[.!?]\s+|\n\n")

# Pause markers in meditation scripts
PAUSE_PATTERN = re.compile(r"\[PAUSE \d+s\]")


def is_sentence_complete(text: str) -> bool:
    """
    Check if the buffer contains a complete sentence.

    A sentence is complete if it ends with:
    - A period, exclamation mark, or question mark followed by whitespace
    - A double newline (paragraph break)
    - A pause marker
    """
    stripped = text.strip()
    if not stripped:
        return False

    # Check for standard sentence endings
    if re.search(r"[.!?]\s*$", stripped):
        return True

    # Check for paragraph breaks
    if "\n\n" in text:
        return True

    # Check for pause markers (send them with surrounding text)
    return bool(PAUSE_PATTERN.search(text) and len(stripped) > 20)


def extract_sentences(text: str) -> tuple[str, str]:
    """
    Extract complete sentences from buffer.

    Returns:
        Tuple of (sentences_to_send, remaining_buffer)
    """
    # Find the last sentence boundary
    matches = list(SENTENCE_BOUNDARY_PATTERN.finditer(text))

    if not matches:
        # No complete sentence yet
        return "", text

    # Get position after last sentence boundary
    last_match = matches[-1]
    boundary_end = last_match.end()

    # Split at the boundary
    sentences = text[:boundary_end].strip()
    remaining = text[boundary_end:].strip()

    return sentences, remaining


async def stream_to_elevenlabs(
    text: str,
    config: StreamingConfig,
) -> AsyncGenerator[bytes, None]:
    """
    Stream text to ElevenLabs and yield audio chunks.

    Args:
        text: Text to synthesize
        config: ElevenLabs configuration

    Yields:
        Audio bytes in chunks
    """
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        logger.error("ELEVENLABS_API_KEY not set")
        raise ValueError("ELEVENLABS_API_KEY environment variable required")

    # Clean the text - remove pause markers (TTS handles pacing naturally)
    clean_text = PAUSE_PATTERN.sub("", text).strip()
    if not clean_text:
        return

    async with httpx.AsyncClient() as client:
        try:
            async with client.stream(
                "POST",
                f"{ELEVENLABS_API_URL}/text-to-speech/{config.voice_id}/stream",
                headers={
                    "xi-api-key": api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "text": clean_text,
                    "model_id": config.model_id,
                    "voice_settings": {
                        "stability": config.stability,
                        "similarity_boost": config.similarity_boost,
                        "style": config.style,
                        "use_speaker_boost": config.use_speaker_boost,
                    },
                },
                timeout=60.0,
            ) as response:
                if response.status_code != 200:
                    error_text = await response.aread()
                    logger.error(
                        "ElevenLabs API error",
                        status=response.status_code,
                        error=error_text.decode()[:200],
                    )
                    return

                async for chunk in response.aiter_bytes(chunk_size=4096):
                    yield chunk

        except httpx.TimeoutException:
            logger.error("ElevenLabs streaming timeout")
        except Exception as e:
            logger.error("ElevenLabs streaming error", error=str(e))


async def generate_script_streaming(
    prompt: str,
) -> AsyncGenerator[str, None]:
    """
    Generate meditation script with Claude, yielding tokens as they arrive.

    Args:
        prompt: The script generation prompt

    Yields:
        Script tokens as they're generated
    """
    llm = create_llm(tier=ModelTier.STANDARD, temperature=0.7, max_tokens=2000)

    try:
        async for chunk in llm.astream([HumanMessage(content=prompt)]):
            if hasattr(chunk, "content") and chunk.content:
                yield str(chunk.content)
    except Exception as e:
        logger.error("Claude streaming error", error=str(e))
        raise


async def parallel_stream_meditation(
    script_prompt: str,
    voice_id: str,
    on_script_chunk: Callable[[str], None] | None = None,
) -> AsyncGenerator[bytes, None]:
    """
    Stream Claude output to ElevenLabs in parallel.

    This is the main entry point for the parallel streaming pipeline.

    Args:
        script_prompt: Prompt for Claude to generate the meditation script
        voice_id: ElevenLabs voice ID
        on_script_chunk: Optional callback for script text (for saving)

    Yields:
        Audio bytes as they're generated by ElevenLabs
    """
    config = StreamingConfig(voice_id=voice_id)
    state = StreamingState()

    logger.info("Starting parallel stream", voice_id=voice_id)

    async for token in generate_script_streaming(script_prompt):
        state.sentence_buffer += token
        state.total_script += token

        # Notify callback of script progress
        if on_script_chunk:
            on_script_chunk(token)

        # Check if we have a complete sentence to send
        if is_sentence_complete(state.sentence_buffer):
            sentences, remaining = extract_sentences(state.sentence_buffer)
            state.sentence_buffer = remaining

            if sentences:
                state.sentences_sent += 1
                logger.info(
                    "Sending sentence to TTS",
                    sentence_num=state.sentences_sent,
                    length=len(sentences),
                )

                # Stream this sentence's audio
                async for audio_chunk in stream_to_elevenlabs(sentences, config):
                    state.audio_chunks.append(audio_chunk)
                    state.bytes_streamed += len(audio_chunk)
                    yield audio_chunk

    # Send any remaining text in the buffer
    if state.sentence_buffer.strip():
        logger.info("Sending final text to TTS", length=len(state.sentence_buffer))
        async for audio_chunk in stream_to_elevenlabs(state.sentence_buffer, config):
            state.audio_chunks.append(audio_chunk)
            state.bytes_streamed += len(audio_chunk)
            yield audio_chunk

    logger.info(
        "Parallel stream complete",
        sentences=state.sentences_sent,
        total_bytes=state.bytes_streamed,
        script_length=len(state.total_script),
    )


async def parallel_stream_with_caching(
    script_prompt: str,
    voice_id: str,
    meditation_id: str,
    user_id: str,
) -> AsyncGenerator[bytes, None]:
    """
    Stream meditation with automatic caching of the result.

    After streaming completes, saves the full audio to Supabase Storage
    for future playback without regeneration.

    Args:
        script_prompt: Prompt for script generation
        voice_id: ElevenLabs voice ID
        meditation_id: UUID for this meditation
        user_id: User ID for storage path

    Yields:
        Audio bytes as they're generated
    """
    audio_chunks: list[bytes] = []
    script_chunks: list[str] = []

    def on_script_chunk(chunk: str) -> None:
        script_chunks.append(chunk)

    async for audio_chunk in parallel_stream_meditation(script_prompt, voice_id, on_script_chunk):
        audio_chunks.append(audio_chunk)
        yield audio_chunk

    # After streaming, cache the result
    if audio_chunks:
        try:
            full_audio = b"".join(audio_chunks)
            full_script = "".join(script_chunks)

            # Generate cache key
            content_hash = hashlib.sha256(f"{full_script}:{voice_id}".encode()).hexdigest()[:16]
            cache_key = f"ai-{meditation_id}-{content_hash}"

            # Upload to storage
            supabase = await get_supabase_client()
            bucket = supabase.storage.from_("meditation-audio")
            file_path = f"generated/{user_id}/{cache_key}.mp3"

            await bucket.upload(
                file_path,
                full_audio,
                {"content-type": "audio/mpeg"},
            )

            audio_url = await bucket.get_public_url(file_path)
            logger.info("Cached streaming meditation", url=audio_url, size=len(full_audio))

        except Exception as e:
            # Don't fail the stream if caching fails
            logger.warning("Failed to cache streaming meditation", error=str(e))


# Convenience function for testing
async def test_parallel_stream(
    text: str,
    voice_id: str = "EXAVITQu4vr4xnSDxMaL",
) -> bytes:
    """
    Test the parallel streaming with a simple text input.

    Args:
        text: Text to synthesize
        voice_id: Voice to use

    Returns:
        Complete audio as bytes
    """
    prompt = f"Generate a short meditation script based on: {text}"
    chunks = []

    async for chunk in parallel_stream_meditation(prompt, voice_id):
        chunks.append(chunk)

    return b"".join(chunks)
