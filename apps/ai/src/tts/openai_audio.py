"""
============================================================================
OpenAI Chat Completions Audio API
============================================================================
Generate meditation audio using OpenAI's Chat Completions with audio output.

This replaces the separate Claude script generation → ElevenLabs TTS pipeline
with a single API call that generates both text AND audio together.

Key benefits:
- Single API call for script + audio
- Direct streaming to client
- Simpler architecture
============================================================================
"""

import asyncio
import base64
import hashlib
import os
from collections.abc import AsyncGenerator
from dataclasses import dataclass
from io import BytesIO

import imageio_ffmpeg
from openai import AsyncOpenAI
from pydub import AudioSegment

from src.auth import get_supabase_client
from src.logging_config import NodeLogger

# Configure pydub to use bundled ffmpeg from imageio-ffmpeg
AudioSegment.converter = imageio_ffmpeg.get_ffmpeg_exe()

logger = NodeLogger("openai_audio")

# OpenAI TTS voices (all 13 available voices)
VALID_VOICES = [
    "alloy",
    "ash",
    "ballad",
    "coral",
    "echo",
    "fable",
    "marin",
    "nova",
    "onyx",
    "sage",
    "shimmer",
    "verse",
    "cedar",
]

# Default system prompt for meditation guide
DEFAULT_MEDITATION_SYSTEM_PROMPT = (
    "You are a calm, soothing meditation guide. "
    "Speak slowly with natural pauses between sentences. "
    "Create a peaceful, relaxing experience. "
    "Use a warm, gentle tone throughout. "
    "Include brief pauses between sections for the listener to breathe and absorb."
)


def convert_pcm16_to_mp3(pcm_bytes: bytes) -> bytes:
    """
    Convert raw PCM16 audio bytes to MP3 format (batch conversion).

    OpenAI outputs PCM16 with:
    - Sample rate: 24kHz
    - Channels: 1 (mono)
    - Sample width: 2 bytes (16-bit)
    - Byte order: Little-endian

    Args:
        pcm_bytes: Raw PCM16 audio data from OpenAI

    Returns:
        MP3-encoded audio bytes
    """
    audio = AudioSegment.from_raw(
        BytesIO(pcm_bytes),
        sample_width=2,  # 16-bit = 2 bytes
        frame_rate=24000,  # 24kHz
        channels=1,  # Mono
    )

    mp3_buffer = BytesIO()
    audio.export(mp3_buffer, format="mp3", bitrate="128k")
    return mp3_buffer.getvalue()


async def stream_pcm16_to_mp3(
    pcm_generator: AsyncGenerator[bytes, None],
) -> AsyncGenerator[bytes, None]:
    """
    Stream PCM16 audio to MP3 using ffmpeg subprocess for real-time conversion.

    This enables true streaming audio playback - MP3 chunks are yielded as soon
    as ffmpeg produces them, without waiting for full audio generation.

    OpenAI PCM16 format:
    - Sample rate: 24kHz
    - Channels: 1 (mono)
    - Sample width: 2 bytes (16-bit signed little-endian)

    Args:
        pcm_generator: Async generator yielding PCM16 audio chunks

    Yields:
        MP3 audio chunks as they're produced by ffmpeg
    """
    ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()

    # Start ffmpeg with stdin/stdout pipes for streaming conversion
    proc = await asyncio.create_subprocess_exec(
        ffmpeg_path,
        "-f",
        "s16le",  # Input: signed 16-bit little-endian PCM
        "-ar",
        "24000",  # Sample rate: 24kHz (OpenAI output)
        "-ac",
        "1",  # Channels: mono
        "-i",
        "pipe:0",  # Read from stdin
        "-f",
        "mp3",  # Output: MP3
        "-b:a",
        "128k",  # Bitrate
        "pipe:1",  # Write to stdout
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.DEVNULL,
    )

    # Feed PCM chunks to ffmpeg stdin in a separate task
    async def feed_pcm() -> None:
        try:
            async for chunk in pcm_generator:
                if proc.stdin:
                    proc.stdin.write(chunk)
                    await proc.stdin.drain()
        finally:
            if proc.stdin:
                proc.stdin.close()
                await proc.stdin.wait_closed()

    # Start feeding PCM data
    feed_task = asyncio.create_task(feed_pcm())

    # Read and yield MP3 chunks as they become available
    try:
        while True:
            if proc.stdout is None:
                break
            chunk = await proc.stdout.read(8192)  # 8KB chunks for smooth streaming
            if not chunk:
                break
            yield chunk
    finally:
        # Wait for feed task to complete
        await feed_task
        await proc.wait()


@dataclass
class MeditationScript:
    """Meditation script metadata (for backward compatibility)."""

    id: str
    title: str
    type: str
    script_content: str
    duration_estimate_seconds: int
    placeholders: dict[str, str] | None = None


@dataclass
class GeneratedMeditation:
    """Result of meditation generation."""

    script_id: str
    audio_url: str
    duration_seconds: int
    voice: str
    cached: bool


@dataclass
class MeditationAudioResult:
    """Result of generating meditation with both text and audio."""

    text_content: str  # The transcript/script text
    audio_bytes: bytes  # Raw audio data (MP3)
    audio_url: str | None  # Public URL after caching (optional)
    voice: str
    duration_estimate_seconds: int  # Estimated from text word count


class OpenAIAudio:
    """
    Generate meditation audio using OpenAI Chat Completions with audio output.

    Uses the gpt-audio model with modalities=["text", "audio"] to generate
    both the meditation script and audio in a single streaming call.
    """

    def __init__(
        self,
        api_key: str | None = None,
        voice: str = "marin",
        model: str = "gpt-4o-mini-audio-preview",
    ) -> None:
        """
        Initialize OpenAI Audio client.

        Args:
            api_key: OpenAI API key (defaults to OPENAI_API_KEY env var)
            voice: Voice to use (marin, cedar recommended for quality)
            model: Model to use (gpt-4o-mini-audio-preview for audio generation)
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable required")

        if voice not in VALID_VOICES:
            raise ValueError(f"Voice must be one of {VALID_VOICES}")

        self.voice = voice
        self.model = model
        self.client = AsyncOpenAI(api_key=self.api_key)

    async def stream_meditation(
        self,
        prompt: str,
        system_prompt: str | None = None,
        voice: str | None = None,
    ) -> AsyncGenerator[bytes, None]:
        """
        Generate and stream meditation audio via Chat Completions with real-time delivery.

        This creates both the meditation script AND audio in a single call.
        Uses ffmpeg subprocess to convert PCM16 to MP3 in real-time, yielding
        MP3 chunks as soon as they're available for immediate playback.

        Args:
            prompt: The meditation request (e.g., "Create a 5-minute body scan")
            system_prompt: Optional custom system prompt
            voice: Voice to use (defaults to instance voice)

        Yields:
            MP3 audio chunks as they're produced (real-time streaming)
        """
        voice = voice or self.voice

        logger.info(
            "Starting real-time audio stream",
            voice=voice,
            model=self.model,
            prompt_length=len(prompt),
        )

        async def get_pcm_chunks_from_openai() -> AsyncGenerator[bytes, None]:
            """Generator that yields PCM16 chunks from OpenAI streaming response."""
            # Use PCM16 format for streaming (MP3 not supported with stream=True)
            response = await self.client.chat.completions.create(
                model=self.model,
                modalities=["text", "audio"],
                audio={"voice": voice, "format": "pcm16"},
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt or DEFAULT_MEDITATION_SYSTEM_PROMPT,
                    },
                    {"role": "user", "content": prompt},
                ],
                stream=True,
            )

            # Note: delta.audio is an untyped dict from OpenAI SDK
            # Format: {"id": str, "data": str (base64), "transcript": str, "expires_at": int}
            chunk_count = 0
            audio_chunk_count = 0

            async for chunk in response:
                chunk_count += 1
                if chunk.choices and chunk.choices[0].delta:
                    delta = chunk.choices[0].delta

                    # Access audio dict (untyped extra attribute from OpenAI API)
                    audio_dict: dict | None = getattr(delta, "audio", None)

                    # Debug: Log first audio chunk structure
                    if audio_dict and audio_chunk_count == 0:
                        logger.info(
                            "Audio chunk received",
                            keys=list(audio_dict.keys()),
                            has_data="data" in audio_dict,
                        )

                    # Extract base64-encoded PCM16 audio data
                    if audio_dict and "data" in audio_dict:
                        audio_data = audio_dict["data"]
                        decoded = base64.b64decode(audio_data)
                        yield decoded
                        audio_chunk_count += 1

            logger.info(
                "OpenAI streaming complete",
                total_chunks=chunk_count,
                audio_chunks=audio_chunk_count,
            )

        try:
            # Stream PCM16 through ffmpeg for real-time MP3 conversion
            mp3_chunk_count = 0
            total_mp3_bytes = 0

            async for mp3_chunk in stream_pcm16_to_mp3(get_pcm_chunks_from_openai()):
                mp3_chunk_count += 1
                total_mp3_bytes += len(mp3_chunk)
                yield mp3_chunk

            logger.info(
                "Audio stream complete",
                mp3_chunks=mp3_chunk_count,
                mp3_bytes=total_mp3_bytes,
                voice=voice,
            )

            if mp3_chunk_count == 0:
                logger.warning("No audio data received from OpenAI")

        except Exception as e:
            logger.error("OpenAI audio streaming error", error=str(e))
            raise

    async def generate_from_script(
        self,
        script: MeditationScript,
        voice: str | None = None,
        user_name: str | None = None,
    ) -> AsyncGenerator[bytes, None]:
        """
        Generate audio from an existing script content.

        Used for backward compatibility with pre-written scripts.

        Args:
            script: The meditation script to read
            voice: Voice to use
            user_name: User's name for personalization

        Yields:
            Audio bytes as generated
        """
        content = script.script_content

        # Apply personalization
        if user_name:
            content = content.replace("{{USER_NAME}}", user_name)
        else:
            content = content.replace("{{USER_NAME}}", "")

        prompt = f"Read the following meditation script aloud:\n\n{content}"

        async for chunk in self.stream_meditation(prompt, voice=voice):
            yield chunk

    def _get_cache_key(self, prompt: str, voice: str) -> str:
        """Generate cache key from prompt and voice."""
        content_hash = hashlib.sha256(f"{prompt}:{voice}".encode()).hexdigest()[:16]
        return f"openai-{content_hash}"

    async def generate_meditation_with_text(
        self,
        prompt: str,
        system_prompt: str | None = None,
        voice: str | None = None,
    ) -> MeditationAudioResult:
        """
        Generate meditation audio AND text transcript in a single API call.

        Uses Chat Completions with modalities=["text", "audio"] to get both
        the spoken meditation text and audio together. Streams PCM16 from
        OpenAI, then converts to MP3.

        Args:
            prompt: The meditation request with full context
            system_prompt: Optional custom system prompt
            voice: Voice to use (defaults to instance voice)

        Returns:
            MeditationAudioResult with text content, audio bytes (MP3), and metadata
        """
        voice = voice or self.voice

        logger.info(
            "Generating meditation with text+audio",
            voice=voice,
            model=self.model,
            prompt_length=len(prompt),
        )

        try:
            # Use PCM16 format for streaming (MP3 not supported with stream=True)
            response = await self.client.chat.completions.create(
                model=self.model,
                modalities=["text", "audio"],
                audio={"voice": voice, "format": "pcm16"},
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt or DEFAULT_MEDITATION_SYSTEM_PROMPT,
                    },
                    {"role": "user", "content": prompt},
                ],
                stream=True,
            )

            # Note: delta.audio is an untyped dict from OpenAI SDK
            # Format: {"id": str, "data": str (base64), "transcript": str, "expires_at": int}
            text_chunks: list[str] = []
            pcm_chunks: list[bytes] = []

            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta:
                    delta = chunk.choices[0].delta

                    # Collect text content
                    if hasattr(delta, "content") and delta.content:
                        text_chunks.append(delta.content)

                    # Access audio dict (untyped extra attribute from OpenAI API)
                    audio_dict: dict | None = getattr(delta, "audio", None)

                    # Extract base64-encoded PCM16 audio data
                    if audio_dict and "data" in audio_dict:
                        audio_data = audio_dict["data"]
                        decoded = base64.b64decode(audio_data)
                        pcm_chunks.append(decoded)

            text_content = "".join(text_chunks)

            # Convert PCM16 to MP3
            pcm_audio = b"".join(pcm_chunks)
            mp3_audio = convert_pcm16_to_mp3(pcm_audio) if pcm_audio else b""

            # Estimate duration from word count (~120 words per minute for meditation)
            word_count = len(text_content.split())
            duration_estimate = int((word_count / 120) * 60)  # seconds

            logger.info(
                "Meditation generated",
                text_length=len(text_content),
                pcm_size=len(pcm_audio),
                mp3_size=len(mp3_audio),
                word_count=word_count,
                duration_estimate=duration_estimate,
            )

            return MeditationAudioResult(
                text_content=text_content,
                audio_bytes=mp3_audio,
                audio_url=None,  # Will be set after caching
                voice=voice,
                duration_estimate_seconds=duration_estimate,
            )

        except Exception as e:
            logger.error("OpenAI audio generation error", error=str(e))
            raise


async def stream_meditation_audio(
    prompt: str,
    voice: str = "marin",
    system_prompt: str | None = None,
) -> AsyncGenerator[bytes, None]:
    """
    Convenience function to stream meditation audio.

    Args:
        prompt: The meditation request
        voice: Voice to use
        system_prompt: Optional custom system prompt

    Yields:
        Audio bytes as generated
    """
    audio = OpenAIAudio(voice=voice)
    async for chunk in audio.stream_meditation(prompt, system_prompt=system_prompt):
        yield chunk


async def stream_meditation_with_caching(
    prompt: str,
    meditation_id: str,
    user_id: str,
    voice: str = "marin",
    system_prompt: str | None = None,
) -> AsyncGenerator[bytes, None]:
    """
    Stream meditation audio with automatic caching.

    After streaming completes, saves the full audio to Supabase Storage
    for future playback without regeneration.

    Args:
        prompt: The meditation request
        meditation_id: UUID for this meditation
        user_id: User ID for storage path
        voice: Voice to use
        system_prompt: Optional custom system prompt

    Yields:
        Audio bytes as generated
    """
    audio = OpenAIAudio(voice=voice)
    audio_chunks: list[bytes] = []

    async for chunk in audio.stream_meditation(prompt, system_prompt=system_prompt):
        audio_chunks.append(chunk)
        yield chunk

    # After streaming, cache the result
    if audio_chunks:
        try:
            full_audio = b"".join(audio_chunks)
            cache_key = audio._get_cache_key(prompt, voice)

            supabase = await get_supabase_client()
            bucket = supabase.storage.from_("meditation-audio")
            file_path = f"generated/{user_id}/{cache_key}.mp3"

            await bucket.upload(
                file_path,
                full_audio,
                {"content-type": "audio/mpeg"},
            )

            audio_url = await bucket.get_public_url(file_path)
            logger.info(
                "Cached streaming meditation",
                url=audio_url,
                size=len(full_audio),
            )

        except Exception as e:
            # Don't fail the stream if caching fails
            logger.warning("Failed to cache streaming meditation", error=str(e))


async def generate_meditation_with_caching(
    prompt: str,
    meditation_id: str,
    user_id: str,
    voice: str = "marin",
    system_prompt: str | None = None,
) -> MeditationAudioResult:
    """
    Generate meditation with both text and audio, caching audio to Supabase.

    This is the main function for AI-generated meditations. It:
    1. Calls OpenAI Chat Completions with modalities=["text", "audio"]
    2. Collects both the text transcript and audio bytes
    3. Caches audio to Supabase Storage
    4. Returns MeditationAudioResult with text, audio bytes, and public URL

    Args:
        prompt: The meditation request with full context
        meditation_id: UUID for this meditation (used in cache path)
        user_id: User ID for storage path
        voice: Voice to use (marin, cedar recommended)
        system_prompt: Optional custom system prompt

    Returns:
        MeditationAudioResult with text_content, audio_bytes, audio_url, etc.
    """
    audio_client = OpenAIAudio(voice=voice)

    # Generate both text and audio
    result = await audio_client.generate_meditation_with_text(
        prompt=prompt,
        system_prompt=system_prompt,
        voice=voice,
    )

    # Cache audio to Supabase Storage
    if result.audio_bytes:
        try:
            supabase = await get_supabase_client()
            bucket = supabase.storage.from_("meditation-audio")
            file_path = f"generated/{user_id}/{meditation_id}.mp3"

            # Upload audio file
            await bucket.upload(
                file_path,
                result.audio_bytes,
                {"content-type": "audio/mpeg"},
            )

            # Get public URL
            audio_url = bucket.get_public_url(file_path)
            result.audio_url = audio_url

            logger.info(
                "Meditation cached to storage",
                meditation_id=meditation_id,
                audio_url=audio_url,
                size=len(result.audio_bytes),
            )

        except Exception as e:
            logger.warning("Failed to cache meditation audio", error=str(e))
            # Continue without URL - audio_bytes are still available

    return result
