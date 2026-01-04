"""
============================================================================
ElevenLabs TTS Integration
============================================================================
Generate custom meditation audio using ElevenLabs Text-to-Speech API.

Features:
- High-quality voice synthesis for meditation scripts
- Caching to avoid regenerating identical content
- Personalization placeholder support ({{USER_NAME}}, etc.)
- Upload to Supabase Storage for delivery
============================================================================
"""

import hashlib
import os
from dataclasses import dataclass
from typing import TYPE_CHECKING

import httpx

from src.auth import get_supabase_client
from src.logging_config import NodeLogger

if TYPE_CHECKING:
    from supabase._async.client import AsyncClient

logger = NodeLogger("elevenlabs_tts")

ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"


@dataclass
class MeditationScript:
    """A meditation script to be synthesized."""

    id: str
    title: str
    type: str
    script_content: str
    duration_estimate_seconds: int
    placeholders: dict[str, str] | None = None


@dataclass
class GeneratedMeditation:
    """Result of TTS generation."""

    script_id: str
    audio_url: str
    duration_seconds: int
    voice_id: str
    cached: bool


class ElevenLabsTTS:
    """Generate meditation audio from scripts using ElevenLabs API."""

    def __init__(
        self,
        api_key: str | None = None,
        voice_id: str | None = None,
    ) -> None:
        self.api_key = api_key or os.getenv("ELEVENLABS_API_KEY")
        self.voice_id = voice_id or os.getenv("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL")

        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY environment variable required")

    def _get_cache_key(self, script: MeditationScript, voice_id: str) -> str:
        """Generate cache key from script content and voice."""
        content_hash = hashlib.sha256(f"{script.script_content}:{voice_id}".encode()).hexdigest()[
            :16
        ]
        return f"tts-{script.id}-{content_hash}"

    def _render_script(
        self,
        script: MeditationScript,
        user_name: str | None = None,
        user_goal: str | None = None,
    ) -> str:
        """Replace placeholders in script with user data."""
        content = script.script_content

        if user_name:
            content = content.replace("{{USER_NAME}}", user_name)
        else:
            content = content.replace("{{USER_NAME}}", "")

        if user_goal:
            content = content.replace("{{USER_GOAL}}", user_goal)
        else:
            content = content.replace("{{USER_GOAL}}", "finding peace")

        return content.strip()

    async def _check_cache(
        self,
        cache_key: str,
        supabase: "AsyncClient",
    ) -> str | None:
        """Check if audio already exists in storage."""
        try:
            bucket = supabase.storage.from_("meditation-audio")
            file_path = f"custom/{cache_key}.mp3"

            # Try to get public URL - if file exists, this works
            result = await bucket.get_public_url(file_path)
            if result:
                # Verify file exists by checking if URL is accessible
                async with httpx.AsyncClient() as client:
                    response = await client.head(result, timeout=5.0)
                    if response.status_code == 200:
                        return result
        except Exception:
            pass
        return None

    async def _upload_audio(
        self,
        audio_data: bytes,
        cache_key: str,
        supabase: "AsyncClient",
    ) -> str:
        """Upload generated audio to Supabase Storage."""
        bucket = supabase.storage.from_("meditation-audio")
        file_path = f"custom/{cache_key}.mp3"

        await bucket.upload(
            file_path,
            audio_data,
            {"content-type": "audio/mpeg"},
        )

        return await bucket.get_public_url(file_path)

    async def generate_meditation(
        self,
        script: MeditationScript,
        voice_id: str | None = None,
        user_name: str | None = None,
        user_goal: str | None = None,
    ) -> GeneratedMeditation:
        """
        Generate meditation audio from a script.

        Args:
            script: The meditation script to synthesize
            voice_id: ElevenLabs voice ID (defaults to configured voice)
            user_name: User's name for personalization
            user_goal: User's goal for personalization

        Returns:
            GeneratedMeditation with audio URL and metadata
        """
        voice = voice_id or self.voice_id
        cache_key = self._get_cache_key(script, voice)

        supabase = await get_supabase_client()

        # Check cache first
        cached_url = await self._check_cache(cache_key, supabase)
        if cached_url:
            logger.info("Cache hit", script_id=script.id, cache_key=cache_key)
            return GeneratedMeditation(
                script_id=script.id,
                audio_url=cached_url,
                duration_seconds=script.duration_estimate_seconds,
                voice_id=voice,
                cached=True,
            )

        # Render script with personalization
        rendered_content = self._render_script(script, user_name, user_goal)

        logger.info("Generating TTS", script_id=script.id, voice_id=voice)

        # Call ElevenLabs API
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{ELEVENLABS_API_URL}/text-to-speech/{voice}",
                headers={
                    "xi-api-key": self.api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "text": rendered_content,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": 0.75,
                        "similarity_boost": 0.75,
                        "style": 0.5,
                        "use_speaker_boost": True,
                    },
                },
                timeout=120.0,
            )

            if response.status_code != 200:
                error_detail = response.text
                logger.error(
                    "ElevenLabs API error", status=response.status_code, detail=error_detail
                )
                raise RuntimeError(f"ElevenLabs API error: {response.status_code}")

            audio_data = response.content

        # Upload to storage
        audio_url = await self._upload_audio(audio_data, cache_key, supabase)

        logger.info("Generated meditation", script_id=script.id, url=audio_url)

        return GeneratedMeditation(
            script_id=script.id,
            audio_url=audio_url,
            duration_seconds=script.duration_estimate_seconds,
            voice_id=voice,
            cached=False,
        )


async def generate_custom_meditation(
    script: MeditationScript,
    user_name: str | None = None,
    user_goal: str | None = None,
) -> GeneratedMeditation:
    """Convenience function to generate a custom meditation."""
    tts = ElevenLabsTTS()
    return await tts.generate_meditation(script, user_name=user_name, user_goal=user_goal)
