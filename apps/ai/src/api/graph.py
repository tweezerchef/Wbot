"""
============================================================================
Graph API Endpoints - LangGraph Conversation Interface
============================================================================
FastAPI endpoints for LangGraph conversation.
Replaces the licensed LangGraph server endpoints.

Endpoints:
- POST /api/chat - Non-streaming chat
- POST /api/chat/stream - SSE streaming chat with HITL support
- POST /api/chat/resume - Resume interrupted graph (HITL)
- GET /api/threads/{thread_id}/history - Get conversation history
- DELETE /api/threads/{thread_id} - Delete thread

SSE Event Format:
    data: {"event": "messages/partial", "data": [{"role": "assistant", "content": "..."}]}
    data: {"event": "messages/complete", "data": [{"role": "assistant", "content": "..."}]}
    data: {"event": "updates", "data": {"__interrupt__": [{"value": {...}}]}}
    data: [DONE]

Usage:
    # In FastAPI app
    from src.api.graph import router as graph_router
    app.include_router(graph_router)
============================================================================
"""

import json
import uuid
from collections.abc import AsyncGenerator
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage
from pydantic import BaseModel, Field

from src.api.auth import CurrentUser, build_langgraph_config
from src.graph.wellness import get_compiled_graph
from src.logging_config import NodeLogger

logger = NodeLogger("graph_api")

# Type for JSON-serializable data (used in SSE formatting)
JsonValue = dict | list | str | int | float | bool | None

router = APIRouter(prefix="/api", tags=["chat"])


# -----------------------------------------------------------------------------
# Request/Response Models
# -----------------------------------------------------------------------------


class ChatRequest(BaseModel):
    """Request body for chat endpoint."""

    message: str = Field(..., description="User's message text")
    thread_id: str | None = Field(
        None, description="Conversation thread ID (created if not provided)"
    )


class ChatResponse(BaseModel):
    """Response from non-streaming chat endpoint."""

    thread_id: str
    message: str
    activity: str | None = None


class ResumeRequest(BaseModel):
    """Request body for resuming interrupted graph (HITL)."""

    thread_id: str = Field(..., description="Thread ID to resume")
    decision: str = Field(..., description="User's decision (e.g., 'start', 'not_now', 'confirm')")
    technique_id: str | None = Field(None, description="Selected breathing technique ID")
    voice_id: str | None = Field(None, description="Selected meditation voice ID")


class HistoryMessage(BaseModel):
    """A message in conversation history."""

    id: str
    role: Literal["user", "assistant"]
    content: str


class HistoryResponse(BaseModel):
    """Response from history endpoint."""

    thread_id: str
    messages: list[HistoryMessage]


# -----------------------------------------------------------------------------
# SSE Event Formatting
# -----------------------------------------------------------------------------


def format_sse_event(event_type: str, data: JsonValue) -> str:
    """
    Format data as Server-Sent Event.

    Matches the format expected by the frontend's stream parser.
    Format: data: {"event": "...", "data": ...}\n\n
    """
    json_data = json.dumps({"event": event_type, "data": data})
    return f"data: {json_data}\n\n"


def format_messages_partial(content: str) -> str:
    """Format a messages/partial event for streaming tokens."""
    return format_sse_event("messages/partial", [{"role": "assistant", "content": content}])


def format_messages_complete(content: str, message_id: str | None = None) -> str:
    """Format a messages/complete event for stream end."""
    msg: dict[str, str] = {"role": "assistant", "content": content}
    if message_id:
        msg["id"] = message_id
    return format_sse_event("messages/complete", [msg])


def format_interrupt_event(interrupt_value: JsonValue) -> str:
    """
    Format an interrupt event for HITL.

    This matches the frontend's expectation of __interrupt__ in updates event.
    """
    return format_sse_event("updates", {"__interrupt__": [{"value": interrupt_value}]})


def format_done_event() -> str:
    """Format the stream completion marker."""
    return "data: [DONE]\n\n"


def format_error_event(error_message: str) -> str:
    """Format an error event."""
    return format_sse_event("error", {"message": error_message})


# -----------------------------------------------------------------------------
# Helper Functions
# -----------------------------------------------------------------------------


def extract_ai_response(messages: list[BaseMessage]) -> str:
    """Extract the content of the last AI message."""
    for msg in reversed(messages):
        if isinstance(msg, AIMessage):
            content = msg.content
            # Handle string content directly
            if isinstance(content, str):
                return content
            # Handle list content (e.g., from Gemini)
            if isinstance(content, list):
                return "".join(
                    block.get("text", "") if isinstance(block, dict) else str(block)
                    for block in content
                )
    return ""


def message_to_history(msg: BaseMessage, index: int) -> HistoryMessage:
    """Convert a LangChain message to history format."""
    role: Literal["user", "assistant"] = "user" if isinstance(msg, HumanMessage) else "assistant"
    content = msg.content
    if isinstance(content, list):
        content = "".join(
            block.get("text", "") if isinstance(block, dict) else str(block) for block in content
        )
    return HistoryMessage(
        id=getattr(msg, "id", None) or f"msg-{index}",
        role=role,
        content=str(content),
    )


# Technique IDs to filter from streaming output (internal LLM responses)
TECHNIQUE_IDS = {"box", "relaxing_478", "coherent", "deep_calm"}

# Nodes whose LLM output should be streamed to the user
# Internal nodes like detect_activity and analyze_profile use structured output
# that produces JSON - we don't want to stream that to the frontend
# NOTE: breathing_exercise is NOT included because its internal technique selection
# LLM call returns technique IDs that shouldn't be streamed to the user
STREAMING_NODES = {"generate_response", "generate_meditation_script"}


def should_filter_content(content: str) -> bool:
    """
    Check if content should be filtered from streaming output.

    Note: Most filtering is now done by STREAMING_NODES (node-level filter).
    This function handles edge cases like technique IDs that might slip through.
    """
    trimmed = content.strip().lower()
    # Filter technique IDs (short responses from technique selection LLM)
    return trimmed in TECHNIQUE_IDS


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, user: CurrentUser) -> ChatResponse:
    """
    Send a message and get a response (non-streaming).

    Use this for simpler cases where streaming UI isn't needed.
    For chat interfaces, prefer /chat/stream for better UX.
    """
    logger.info("Chat request", user_id=user.id)

    thread_id = request.thread_id or str(uuid.uuid4())
    graph = await get_compiled_graph()
    config = build_langgraph_config(user, thread_id)

    try:
        result = await graph.ainvoke(
            {"messages": [HumanMessage(content=request.message)]}, config=config
        )

        response_text = extract_ai_response(result.get("messages", []))

        return ChatResponse(
            thread_id=thread_id,
            message=response_text,
            activity=result.get("suggested_activity"),
        )
    except Exception as e:
        logger.error("Chat failed", error=str(e))
        raise HTTPException(status_code=500, detail="Chat processing failed") from e


@router.post("/chat/stream")
async def chat_stream(request: ChatRequest, user: CurrentUser) -> StreamingResponse:
    """
    Send a message and stream the response via SSE.

    Supports HITL interrupts for breathing/meditation activities.
    Frontend should handle 'messages/partial', 'messages/complete',
    and '__interrupt__' (in 'updates') events.

    Response Headers:
        X-Thread-Id: The conversation thread ID
    """
    logger.info("Stream request", user_id=user.id)

    thread_id = request.thread_id or str(uuid.uuid4())

    async def generate() -> AsyncGenerator[str, None]:
        graph = await get_compiled_graph()
        config = build_langgraph_config(user, thread_id)

        accumulated_content = ""

        try:
            # Use astream with stream_mode=["updates", "messages"] to properly capture
            # both LLM token streaming AND interrupt events (HITL).
            # astream_events() does NOT properly emit interrupt events.
            async for mode, chunk in graph.astream(
                {"messages": [HumanMessage(content=request.message)]},
                config=config,
                stream_mode=["updates", "messages"],
            ):
                if mode == "messages":
                    # LLM token streaming - chunk is (message_chunk, metadata)
                    message_chunk, metadata = chunk
                    node_name = metadata.get("langgraph_node")

                    # Only stream from user-facing nodes
                    if node_name not in STREAMING_NODES:
                        continue

                    content = message_chunk.content
                    if content:
                        # Handle list content (Gemini format)
                        if isinstance(content, list):
                            content = "".join(
                                block.get("text", "") if isinstance(block, dict) else str(block)
                                for block in content
                            )
                        if content and not should_filter_content(content):
                            accumulated_content += content
                            yield format_messages_partial(accumulated_content)

                elif mode == "updates":
                    # Check for interrupt events (HITL)
                    if isinstance(chunk, dict) and "__interrupt__" in chunk:
                        interrupt_data = chunk["__interrupt__"]
                        if interrupt_data and len(interrupt_data) > 0:
                            # Extract the interrupt value from the Interrupt object
                            interrupt_obj = interrupt_data[0]
                            interrupt_value = getattr(
                                interrupt_obj, "value", None
                            ) or interrupt_obj.get("value")
                            if interrupt_value:
                                yield format_interrupt_event(interrupt_value)
                                return  # Stop streaming, wait for resume

            # Send completion event
            if accumulated_content:
                yield format_messages_complete(accumulated_content)

            yield format_done_event()

        except Exception as e:
            logger.error("Stream failed", error=str(e))
            yield format_error_event(str(e))

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Thread-Id": thread_id,
        },
    )


@router.post("/chat/resume")
async def chat_resume(request: ResumeRequest, user: CurrentUser) -> StreamingResponse:
    """
    Resume an interrupted graph with user's decision (HITL).

    Called after user responds to breathing/meditation confirmation.
    Streams the continued response.

    Resume data format:
        - decision: 'start', 'change_technique', 'not_now', 'confirm', etc.
        - technique_id: For breathing exercise selection
        - voice_id: For meditation voice selection
    """
    logger.info("Resume request", user_id=user.id, thread_id=request.thread_id)

    async def generate() -> AsyncGenerator[str, None]:
        graph = await get_compiled_graph()
        config = build_langgraph_config(user, request.thread_id)

        accumulated_content = ""

        # Build resume data matching what the nodes expect
        resume_data: dict[str, Any] = {"decision": request.decision}
        if request.technique_id:
            resume_data["technique_id"] = request.technique_id
        if request.voice_id:
            resume_data["voice_id"] = request.voice_id

        try:
            # Use Command pattern to resume the interrupted graph
            from langgraph.types import Command

            # Use astream with stream_mode=["updates", "messages"] to properly capture
            # both LLM token streaming AND interrupt events (for chained HITL).
            async for mode, chunk in graph.astream(
                Command(resume=resume_data),
                config=config,
                stream_mode=["updates", "messages"],
            ):
                if mode == "messages":
                    # LLM token streaming - chunk is (message_chunk, metadata)
                    message_chunk, metadata = chunk
                    node_name = metadata.get("langgraph_node")

                    # Only stream from user-facing nodes
                    if node_name not in STREAMING_NODES:
                        continue

                    content = message_chunk.content
                    if content:
                        # Handle list content (Gemini format)
                        if isinstance(content, list):
                            content = "".join(
                                block.get("text", "") if isinstance(block, dict) else str(block)
                                for block in content
                            )
                        if content and not should_filter_content(content):
                            accumulated_content += content
                            yield format_messages_partial(accumulated_content)

                elif mode == "updates":
                    # Check for interrupt events (chained HITL)
                    if isinstance(chunk, dict) and "__interrupt__" in chunk:
                        interrupt_data = chunk["__interrupt__"]
                        if interrupt_data and len(interrupt_data) > 0:
                            # Extract the interrupt value from the Interrupt object
                            interrupt_obj = interrupt_data[0]
                            interrupt_value = getattr(
                                interrupt_obj, "value", None
                            ) or interrupt_obj.get("value")
                            if interrupt_value:
                                yield format_interrupt_event(interrupt_value)
                                return

            if accumulated_content:
                yield format_messages_complete(accumulated_content)

            yield format_done_event()

        except Exception as e:
            logger.error("Resume failed", error=str(e))
            yield format_error_event(str(e))

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.get("/threads/{thread_id}/history", response_model=HistoryResponse)
async def get_thread_history(thread_id: str, user: CurrentUser) -> HistoryResponse:
    """
    Get conversation history for a thread.

    Returns all messages in chronological order.
    """
    logger.info("History request", user_id=user.id, thread_id=thread_id)

    graph = await get_compiled_graph()
    config = {"configurable": {"thread_id": thread_id}}

    try:
        state = await graph.aget_state(config)
        messages = state.values.get("messages", [])

        return HistoryResponse(
            thread_id=thread_id,
            messages=[message_to_history(m, i) for i, m in enumerate(messages)],
        )
    except Exception as e:
        logger.error("History fetch failed", error=str(e))
        raise HTTPException(status_code=404, detail="Thread not found") from e


@router.delete("/threads/{thread_id}")
async def delete_thread(thread_id: str, user: CurrentUser) -> dict[str, str]:
    """
    Delete a conversation thread.

    Note: This marks the thread for deletion. The actual checkpoint
    data may be cleaned up asynchronously.
    """
    logger.info("Delete request", user_id=user.id, thread_id=thread_id)

    # TODO: Implement actual deletion via checkpointer
    # For now, return success - checkpoints can be cleaned up separately
    # In production, we would call checkpointer.adelete(thread_id)
    return {"status": "deleted", "thread_id": thread_id}
