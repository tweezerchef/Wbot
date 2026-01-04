"""
============================================================================
Meditation API Endpoints
============================================================================
HTTP API endpoints for meditation-related operations.

Endpoints:
- POST /api/meditation/generate - Generate personalized meditation via TTS
- POST /api/meditation/cache-check - Check if cached audio exists
- POST /api/meditation/stream - Stream audio as it's generated
- POST /api/meditation/generate-ai - Generate AI meditation with parallel streaming
- GET /api/meditation/voices - Get available voices for AI meditation
- POST /api/meditation/generated/{id}/complete - Mark AI meditation complete
============================================================================
"""

from collections.abc import AsyncGenerator
from datetime import datetime
from typing import Literal

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, Path
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.auth import get_supabase_client
from src.logging_config import NodeLogger
from src.tts.elevenlabs import ElevenLabsTTS
from src.tts.openai_audio import MeditationScript, OpenAIAudio
from src.tts.parallel_streaming import parallel_stream_with_caching
from src.tts.voices import get_all_voices, get_voice, validate_voice_id

logger = NodeLogger("meditation_api")

router = APIRouter(prefix="/api/meditation", tags=["meditation"])


# -----------------------------------------------------------------------------
# Auth Dependency
# -----------------------------------------------------------------------------


async def get_current_user(authorization: str = Header(...)) -> dict:
    """
    Validate the Authorization header and return user info.

    This is a FastAPI dependency that mirrors the LangGraph auth validation.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid Authorization header",
        )

    token = authorization[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Empty token")

    try:
        supabase = await get_supabase_client()
        user_response = await supabase.auth.get_user(token)

        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = user_response.user
        return {"id": user.id, "email": user.email}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed") from e


# Module-level dependency for use in route handlers
CurrentUser = Depends(get_current_user)


# -----------------------------------------------------------------------------
# Request/Response Models
# -----------------------------------------------------------------------------


class GenerateMeditationRequest(BaseModel):
    """Request to generate a personalized meditation."""

    script_id: str
    user_name: str | None = None
    user_goal: str | None = None


class GenerateMeditationResponse(BaseModel):
    """Response from TTS generation."""

    audio_url: str
    script_id: str
    duration_seconds: int
    cached: bool
    voice_id: str


class CacheCheckRequest(BaseModel):
    """Request to check meditation cache."""

    script_id: str
    user_name: str | None = None
    user_goal: str | None = None


class CacheCheckResponse(BaseModel):
    """Response from cache check."""

    audio_url: str | None


class ErrorResponse(BaseModel):
    """Error response."""

    error: str
    details: str | None = None


# -----------------------------------------------------------------------------
# AI-Generated Meditation Request/Response Models
# -----------------------------------------------------------------------------


class GenerateAIMeditationRequest(BaseModel):
    """Request to generate an AI-personalized meditation with parallel streaming."""

    meditation_id: str = Field(..., description="Unique ID for this meditation")
    script_prompt: str = Field(..., description="Prompt for Claude to generate the script")
    voice_id: str = Field(..., description="ElevenLabs voice ID")
    title: str = Field(..., description="Title for the meditation")
    meditation_type: str = Field(..., description="Type of meditation")
    duration_minutes: int = Field(..., ge=1, le=30, description="Target duration in minutes")
    generation_context: dict = Field(
        default_factory=dict,
        description="Context used for generation (for saving)",
    )


class VoiceInfo(BaseModel):
    """Information about an available voice."""

    id: str
    name: str
    description: str
    best_for: list[str]
    preview_url: str | None = None


class VoicesResponse(BaseModel):
    """Response with available voices."""

    voices: list[VoiceInfo]
    default_voice: str


class CompleteMeditationRequest(BaseModel):
    """Request to mark a meditation as complete."""

    mood_before: int | None = Field(None, ge=1, le=5, description="Mood rating before (1-5)")
    mood_after: int | None = Field(None, ge=1, le=5, description="Mood rating after (1-5)")
    completed_at: datetime | None = Field(None, description="Completion timestamp")
    notes: str | None = Field(None, max_length=500, description="Optional user notes")


class CompleteMeditationResponse(BaseModel):
    """Response after completing a meditation."""

    meditation_id: str
    play_count: int
    is_favorite: bool


# -----------------------------------------------------------------------------
# Script Definitions (matching 007_meditation_scripts.sql)
# -----------------------------------------------------------------------------

MeditationType = Literal[
    "body_scan",
    "loving_kindness",
    "breathing_focus",
    "sleep",
    "anxiety_relief",
    "daily_mindfulness",
]

# These should match the database, but we include defaults here for resilience
DEFAULT_SCRIPTS: dict[str, MeditationScript] = {
    "breathing_custom_5min": MeditationScript(
        id="breathing_custom_5min",
        title="Personalized Breathing Meditation",
        type="breathing_focus",
        script_content="""Welcome, {{USER_NAME}}. Find a comfortable position and gently close your eyes.

Take a deep breath in through your nose... and slowly exhale through your mouth.

Let go of any tension you're holding. This is your time to simply be present.

Begin to notice your natural breath. No need to change it, just observe.

Feel your chest rise and fall. Feel your belly expand and contract.

With each exhale, allow yourself to relax a little more deeply.

If your mind wanders, that's perfectly normal. Simply guide your attention back to your breath.

Breathe in calm... breathe out tension.

You're doing wonderfully, {{USER_NAME}}. Continue this gentle rhythm.

As we near the end of this practice, take one more deep breath in... and release.

Slowly begin to bring awareness back to your surroundings.

When you're ready, gently open your eyes.

Thank you for taking this time for yourself today.""",
        duration_estimate_seconds=300,
        placeholders={"name": "USER_NAME"},
    ),
    "body_scan_custom_10min": MeditationScript(
        id="body_scan_custom_10min",
        title="Personalized Body Scan",
        type="body_scan",
        script_content="""Hello {{USER_NAME}}. Let's take a journey through your body together.

Find a comfortable position, either sitting or lying down.

Close your eyes and take three deep breaths.

We'll start at the top of your head. Notice any sensations there.

Slowly move your attention down to your forehead... release any tension.

Feel your eyes, your cheeks, your jaw. Let your jaw soften and relax.

Move down to your neck and shoulders. These areas often hold stress.

Breathe into any tightness. With each exhale, let it melt away.

Bring awareness to your arms, your hands, your fingers.

Feel the weight of your arms resting comfortably.

Now notice your chest and upper back. Feel the gentle rise and fall with each breath.

Move to your belly. Allow it to be soft and relaxed.

Continue down to your lower back and hips.

Feel your thighs, your knees, your calves.

Finally, bring attention to your feet and toes.

You've now scanned your entire body, {{USER_NAME}}.

Take a moment to feel your body as a whole.

When you're ready, slowly open your eyes.""",
        duration_estimate_seconds=600,
        placeholders={"name": "USER_NAME"},
    ),
    "loving_kindness_custom": MeditationScript(
        id="loving_kindness_custom",
        title="Personalized Loving Kindness",
        type="loving_kindness",
        script_content="""{{USER_NAME}}, welcome to this loving kindness meditation.

Find a comfortable seat and close your eyes.

Begin by placing your hand over your heart.

Feel the warmth of your own touch.

Silently repeat these words to yourself:

May I be happy.
May I be healthy.
May I be safe.
May I live with ease.

Feel these wishes for yourself. You deserve this kindness, {{USER_NAME}}.

Now, think of someone you love deeply.

Picture them clearly in your mind.

Extend these same wishes to them:

May you be happy.
May you be healthy.
May you be safe.
May you live with ease.

Now expand this circle of kindness to all beings everywhere.

May all beings be happy.
May all beings be healthy.
May all beings be safe.
May all beings live with ease.

Rest in this feeling of universal compassion.

When you're ready, gently open your eyes.

Carry this kindness with you, {{USER_NAME}}.""",
        duration_estimate_seconds=480,
        placeholders={"name": "USER_NAME"},
    ),
    "sleep_custom": MeditationScript(
        id="sleep_custom",
        title="Personalized Sleep Meditation",
        type="sleep",
        script_content="""Good evening, {{USER_NAME}}. It's time to prepare for restful sleep.

Lie down comfortably in your bed.

Close your eyes and take a long, slow breath.

Release the day's worries with your exhale.

Feel the support of your bed beneath you.

Let your body sink into the mattress.

Starting with your feet, imagine warm, golden light relaxing each muscle.

Feel this warmth move up through your calves... your thighs...

Your hips and lower back... melting into deep relaxation.

The warmth continues up your spine... across your shoulders...

Down your arms to your fingertips.

Feel your neck relax... your jaw... your face.

Your entire body is now deeply relaxed.

With each breath, you sink deeper into comfort.

You are safe. You are at peace.

Let sleep come naturally, {{USER_NAME}}.

Sweet dreams.""",
        duration_estimate_seconds=900,
        placeholders={"name": "USER_NAME"},
    ),
    "anxiety_relief_custom": MeditationScript(
        id="anxiety_relief_custom",
        title="Personalized Anxiety Relief",
        type="anxiety_relief",
        script_content="""{{USER_NAME}}, I'm here with you. Let's work through this together.

Place both feet flat on the ground.

Feel the solid earth beneath you.

Take a slow breath in for 4 counts... hold for 4... release for 6.

You are safe in this moment.

Notice five things you can see around you.

Now notice four things you can feel.

Three things you can hear.

Two things you can smell.

One thing you can taste.

You are grounded. You are present.

Whatever you're feeling is valid, {{USER_NAME}}.

But remember: feelings are temporary visitors.

They come, and they go.

Take another deep breath.

Feel your body supported and safe.

You have survived every difficult moment so far.

You will get through this one too.

When you're ready, open your eyes with renewed calm.""",
        duration_estimate_seconds=420,
        placeholders={"name": "USER_NAME"},
    ),
}


# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------


async def get_script_from_db(script_id: str) -> MeditationScript | None:
    """
    Fetch a meditation script from the database.

    Falls back to DEFAULT_SCRIPTS if database lookup fails.
    """
    try:
        supabase = await get_supabase_client()
        result = (
            await supabase.table("meditation_scripts")
            .select("*")
            .eq("id", script_id)
            .single()
            .execute()
        )

        if result.data:
            data = result.data
            return MeditationScript(
                id=data["id"],
                title=data["title"],
                type=data["type"],
                script_content=data["script_content"],
                duration_estimate_seconds=data["duration_estimate_seconds"],
                placeholders=data.get("placeholders"),
            )
    except Exception as e:
        logger.warning(f"Failed to fetch script from database: {e}")

    # Fall back to defaults
    return DEFAULT_SCRIPTS.get(script_id)


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------


@router.post(
    "/generate",
    response_model=GenerateMeditationResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def generate_meditation(
    request: GenerateMeditationRequest,
    user: dict = CurrentUser,
) -> GenerateMeditationResponse:
    """
    Generate a personalized meditation using ElevenLabs TTS.

    This endpoint:
    1. Fetches the script from the database
    2. Applies personalization (replaces placeholders)
    3. Generates audio via ElevenLabs API
    4. Uploads to Supabase Storage
    5. Returns the audio URL

    The backend caches generated audio - identical scripts return cached URLs.
    """
    logger.info("Generating meditation", script_id=request.script_id, user_id=user.get("id"))

    # Get the script
    script = await get_script_from_db(request.script_id)
    if not script:
        raise HTTPException(status_code=400, detail=f"Script not found: {request.script_id}")

    try:
        # Initialize OpenAI Audio client
        audio = OpenAIAudio()

        # Generate audio - collect all chunks
        audio_chunks: list[bytes] = []
        async for chunk in audio.generate_from_script(
            script=script,
            user_name=request.user_name,
        ):
            audio_chunks.append(chunk)

        # For non-streaming, we'd need to upload to storage
        # For now, return a placeholder response
        logger.info(
            "Meditation generated",
            script_id=script.id,
            size=sum(len(c) for c in audio_chunks),
        )

        # Note: For full implementation, upload audio_chunks to storage
        # and return the URL. For now this endpoint should use streaming instead.
        return GenerateMeditationResponse(
            audio_url="",  # Would need storage upload
            script_id=script.id,
            duration_seconds=script.duration_estimate_seconds,
            cached=False,
            voice_id=audio.voice,
        )

    except ValueError as e:
        # Missing API key or configuration error
        logger.error(f"Configuration error: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e
    except Exception as e:
        # OpenAI API error
        logger.error(f"TTS generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post(
    "/cache-check",
    response_model=CacheCheckResponse,
)
async def check_cache(
    request: CacheCheckRequest,
    user: dict = CurrentUser,
) -> CacheCheckResponse:
    """
    Check if cached audio exists for a meditation script.

    This is a quick check that doesn't trigger generation.
    Returns the audio URL if cached, null otherwise.
    """
    logger.info("Checking cache", script_id=request.script_id)

    # Get the script
    script = await get_script_from_db(request.script_id)
    if not script:
        return CacheCheckResponse(audio_url=None)

    try:
        tts = ElevenLabsTTS()

        # Generate the cache key (same logic as in TTS class)
        cache_key = tts._get_cache_key(script, tts.voice_id)

        # Check if cached audio exists
        supabase = await get_supabase_client()
        cached_url = await tts._check_cache(cache_key, supabase)

        return CacheCheckResponse(audio_url=cached_url)

    except Exception as e:
        logger.warning(f"Cache check failed: {e}")
        return CacheCheckResponse(audio_url=None)


# -----------------------------------------------------------------------------
# Streaming Endpoint
# -----------------------------------------------------------------------------


@router.post(
    "/stream",
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def stream_meditation(
    request: GenerateMeditationRequest,
    user: dict = CurrentUser,
) -> StreamingResponse:
    """
    Stream a personalized meditation audio as it's generated.

    This endpoint:
    1. Fetches the script from the database
    2. Applies personalization (replaces placeholders)
    3. Streams audio directly from ElevenLabs as it's generated
    4. Saves to Supabase Storage in background for caching

    Use this endpoint when you want immediate audio playback without
    waiting for the full file to generate.
    """
    logger.info("Streaming meditation", script_id=request.script_id, user_id=user.get("id"))

    # Get the script
    script = await get_script_from_db(request.script_id)
    if not script:
        raise HTTPException(status_code=400, detail=f"Script not found: {request.script_id}")

    try:
        tts = ElevenLabsTTS()
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

    # Render the script with personalization
    rendered_content = tts._render_script(script, request.user_name, request.user_goal)

    async def generate_audio_stream() -> AsyncGenerator[bytes, None]:
        """Stream audio chunks from ElevenLabs."""
        audio_chunks: list[bytes] = []

        async with (
            httpx.AsyncClient() as client,
            client.stream(
                "POST",
                f"https://api.elevenlabs.io/v1/text-to-speech/{tts.voice_id}/stream",
                headers={
                    "xi-api-key": tts.api_key,
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
            ) as response,
        ):
            if response.status_code != 200:
                error_text = await response.aread()
                logger.error(
                    "ElevenLabs streaming error",
                    status=response.status_code,
                    detail=error_text.decode(),
                )
                raise HTTPException(
                    status_code=500,
                    detail=f"ElevenLabs API error: {response.status_code}",
                )

            # Stream audio chunks to client
            async for chunk in response.aiter_bytes(chunk_size=4096):
                audio_chunks.append(chunk)
                yield chunk

        # After streaming completes, save to storage for caching
        if audio_chunks:
            try:
                full_audio = b"".join(audio_chunks)
                cache_key = tts._get_cache_key(script, tts.voice_id)
                supabase = await get_supabase_client()
                audio_url = await tts._upload_audio(full_audio, cache_key, supabase)
                logger.info("Cached streamed meditation", script_id=script.id, url=audio_url)
            except Exception as e:
                # Don't fail the stream if caching fails
                logger.warning(f"Failed to cache streamed audio: {e}")

    return StreamingResponse(
        generate_audio_stream(),
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": f'inline; filename="{request.script_id}.mp3"',
            "Cache-Control": "no-cache",
            "X-Script-Id": request.script_id,
        },
    )


# -----------------------------------------------------------------------------
# AI-Generated Meditation Endpoints
# -----------------------------------------------------------------------------


@router.get(
    "/voices",
    response_model=VoicesResponse,
)
async def get_voices(
    user: dict = CurrentUser,
) -> VoicesResponse:
    """
    Get available voices for AI-generated meditations.

    Returns a list of curated voices with names, descriptions,
    and suggested meditation types for each voice.
    """
    logger.info("Fetching available voices", user_id=user.get("id"))

    voices = get_all_voices()

    return VoicesResponse(
        voices=[
            VoiceInfo(
                id=voice["id"],
                name=voice["name"],
                description=voice["description"],
                best_for=voice["best_for"],
                preview_url=voice.get("preview_url"),
            )
            for voice in voices
        ],
        default_voice="sarah_calm",
    )


@router.post(
    "/generate-ai",
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def generate_ai_meditation(
    request: GenerateAIMeditationRequest,
    user: dict = CurrentUser,
) -> StreamingResponse:
    """
    Generate an AI-personalized meditation with parallel streaming.

    This endpoint uses the parallel pipeline architecture:
    1. Claude generates script tokens (streaming)
    2. Tokens are buffered until sentence boundary
    3. Each complete sentence is sent to ElevenLabs
    4. Audio chunks are yielded to the client in real-time
    5. Complete audio is cached after streaming finishes

    Audio starts playing within 2-3 seconds (first sentence arrives).
    """
    logger.info(
        "Generating AI meditation",
        meditation_id=request.meditation_id,
        voice_id=request.voice_id,
        user_id=user.get("id"),
    )

    # Validate voice ID
    if not validate_voice_id(request.voice_id):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid voice ID: {request.voice_id}",
        )

    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")

    # Save meditation record to database before streaming
    try:
        supabase = await get_supabase_client()
        voice = get_voice_by_key_or_id(request.voice_id)

        await (
            supabase.table("user_generated_meditations")
            .insert(
                {
                    "id": request.meditation_id,
                    "user_id": user_id,
                    "title": request.title,
                    "meditation_type": request.meditation_type,
                    "script_content": "",  # Will be updated after generation
                    "duration_seconds": request.duration_minutes * 60,
                    "voice_id": request.voice_id,
                    "voice_name": voice["name"] if voice else "Unknown",
                    "generation_context": request.generation_context,
                    "status": "generating",
                }
            )
            .execute()
        )

    except Exception as e:
        logger.warning(f"Failed to save meditation record: {e}")
        # Continue anyway - we'll try to save after streaming

    # Create streaming generator using parallel pipeline
    async def stream_with_tracking() -> AsyncGenerator[bytes, None]:
        """Stream audio and track script for database update."""
        script_chunks: list[str] = []

        def on_script_chunk(chunk: str) -> None:
            script_chunks.append(chunk)

        try:
            async for audio_chunk in parallel_stream_with_caching(
                script_prompt=request.script_prompt,
                voice_id=request.voice_id,
                meditation_id=request.meditation_id,
                user_id=user_id,
            ):
                yield audio_chunk

            # After streaming completes, update the database record
            if script_chunks:
                full_script = "".join(script_chunks)
                try:
                    supabase = await get_supabase_client()
                    await (
                        supabase.table("user_generated_meditations")
                        .update(
                            {
                                "script_content": full_script,
                                "status": "ready",
                            }
                        )
                        .eq("id", request.meditation_id)
                        .execute()
                    )
                    logger.info(
                        "Updated meditation record",
                        meditation_id=request.meditation_id,
                    )
                except Exception as e:
                    logger.warning(f"Failed to update meditation record: {e}")

        except Exception as e:
            # Update status to error
            try:
                supabase = await get_supabase_client()
                await (
                    supabase.table("user_generated_meditations")
                    .update(
                        {
                            "status": "error",
                            "error_message": str(e)[:500],
                        }
                    )
                    .eq("id", request.meditation_id)
                    .execute()
                )
            except Exception:
                pass
            raise

    return StreamingResponse(
        stream_with_tracking(),
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": f'inline; filename="{request.meditation_id}.mp3"',
            "Cache-Control": "no-cache",
            "X-Meditation-Id": request.meditation_id,
            "Transfer-Encoding": "chunked",
        },
    )


@router.post(
    "/generated/{meditation_id}/complete",
    response_model=CompleteMeditationResponse,
    responses={404: {"model": ErrorResponse}},
)
async def complete_meditation(
    meditation_id: str = Path(..., description="The meditation ID"),
    request: CompleteMeditationRequest = None,
    user: dict = CurrentUser,
) -> CompleteMeditationResponse:
    """
    Mark an AI-generated meditation as complete.

    Records mood data, increments play count, and updates last_played_at.
    Called by the frontend when a meditation finishes playing.
    """
    logger.info(
        "Completing meditation",
        meditation_id=meditation_id,
        user_id=user.get("id"),
    )

    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found")

    try:
        supabase = await get_supabase_client()

        # Verify the meditation belongs to this user
        existing = (
            await supabase.table("user_generated_meditations")
            .select("id, user_id, play_count, is_favorite")
            .eq("id", meditation_id)
            .single()
            .execute()
        )

        if not existing.data:
            raise HTTPException(status_code=404, detail="Meditation not found")

        if existing.data["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        # Build update payload
        update_data = {
            "play_count": existing.data["play_count"] + 1,
            "last_played_at": datetime.utcnow().isoformat(),
            "status": "complete",
        }

        # Add mood data if provided
        if request:
            if request.mood_before is not None:
                update_data["mood_before"] = request.mood_before
            if request.mood_after is not None:
                update_data["mood_after"] = request.mood_after
            if request.notes:
                update_data["notes"] = request.notes

        # Update the record
        await (
            supabase.table("user_generated_meditations")
            .update(update_data)
            .eq("id", meditation_id)
            .execute()
        )

        return CompleteMeditationResponse(
            meditation_id=meditation_id,
            play_count=update_data["play_count"],
            is_favorite=existing.data["is_favorite"],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to complete meditation: {e}")
        raise HTTPException(status_code=500, detail="Failed to update meditation") from e


def get_voice_by_key_or_id(voice_key_or_id: str) -> dict | None:
    """
    Get voice by key or by ElevenLabs ID.

    Allows flexibility in how the frontend specifies the voice.
    """
    # First try as a key
    voice = get_voice(voice_key_or_id)
    if voice:
        return voice

    # Otherwise, search by ElevenLabs ID
    from src.tts.voices import MEDITATION_VOICES

    for v in MEDITATION_VOICES.values():
        if v["id"] == voice_key_or_id:
            return v
    return None
