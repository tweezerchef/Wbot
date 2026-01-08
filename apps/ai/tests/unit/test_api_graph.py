"""
============================================================================
Tests for src/api/graph.py - FastAPI Graph Endpoints
============================================================================
Tests cover:
- Non-streaming chat endpoint
- SSE streaming format
- HITL interrupt handling
- History retrieval
- Error handling
- Content filtering
============================================================================
"""

import json
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from langchain_core.messages import AIMessage, HumanMessage

from src.api.auth import AuthenticatedUser

# -----------------------------------------------------------------------------
# Fixtures
# -----------------------------------------------------------------------------


@pytest.fixture
def mock_authenticated_user() -> AuthenticatedUser:
    """Mock authenticated user for tests."""
    return AuthenticatedUser(
        id="user-123",
        email="test@example.com",
        display_name="Test User",
        preferences={"primary_goal": "stress_anxiety"},
    )


@pytest.fixture
def mock_graph() -> AsyncMock:
    """Mock compiled graph."""
    mock = AsyncMock()
    # Default ainvoke response
    mock.ainvoke.return_value = {
        "messages": [
            HumanMessage(content="Hi"),
            AIMessage(content="Hello! How can I help you today?"),
        ],
        "suggested_activity": None,
    }
    return mock


@pytest.fixture
def test_client(mock_authenticated_user: AuthenticatedUser, mock_graph: AsyncMock) -> TestClient:
    """Create test client with mocked dependencies."""
    from src.api.auth import get_current_user
    from src.api.graph import router

    app = FastAPI()
    app.include_router(router)

    # Override auth dependency
    app.dependency_overrides[get_current_user] = lambda: mock_authenticated_user

    with patch("src.api.graph.get_compiled_graph", return_value=mock_graph):
        yield TestClient(app)


# -----------------------------------------------------------------------------
# Non-Streaming Chat Tests
# -----------------------------------------------------------------------------


class TestChatEndpoint:
    """Tests for POST /api/chat."""

    def test_successful_chat(self, test_client: TestClient, mock_graph: AsyncMock) -> None:
        """Should return AI response for valid request."""
        response = test_client.post("/api/chat", json={"message": "Hello"})

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Hello! How can I help you today?"
        assert "thread_id" in data

    def test_chat_with_thread_id(self, test_client: TestClient, mock_graph: AsyncMock) -> None:
        """Should use provided thread_id."""
        response = test_client.post(
            "/api/chat", json={"message": "Hello", "thread_id": "my-thread-123"}
        )

        assert response.status_code == 200
        assert response.json()["thread_id"] == "my-thread-123"

    def test_chat_with_activity(self, test_client: TestClient, mock_graph: AsyncMock) -> None:
        """Should include suggested activity in response."""
        mock_graph.ainvoke.return_value = {
            "messages": [AIMessage(content="Let's do a breathing exercise")],
            "suggested_activity": "breathing",
        }

        response = test_client.post("/api/chat", json={"message": "I'm stressed"})

        assert response.status_code == 200
        assert response.json()["activity"] == "breathing"

    def test_chat_generates_thread_id_if_not_provided(
        self, test_client: TestClient, mock_graph: AsyncMock
    ) -> None:
        """Should generate UUID thread_id when not provided."""
        response = test_client.post("/api/chat", json={"message": "Hello"})

        thread_id = response.json()["thread_id"]
        assert thread_id is not None
        # Should be a valid UUID format
        assert len(thread_id) == 36
        assert thread_id.count("-") == 4


# -----------------------------------------------------------------------------
# SSE Streaming Tests
# -----------------------------------------------------------------------------


class TestChatStreamEndpoint:
    """Tests for POST /api/chat/stream."""

    def test_sse_content_type(self, mock_authenticated_user: AuthenticatedUser) -> None:
        """Should return text/event-stream content type."""
        from src.api.auth import get_current_user
        from src.api.graph import router

        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[get_current_user] = lambda: mock_authenticated_user

        mock_graph = AsyncMock()

        # Create async generator that yields nothing
        async def empty_stream(*args: Any, **kwargs: Any) -> Any:
            return
            yield  # Make it a generator

        mock_graph.astream_events = empty_stream

        with patch("src.api.graph.get_compiled_graph", return_value=mock_graph):
            client = TestClient(app)
            response = client.post("/api/chat/stream", json={"message": "Hello"})

            assert response.headers["content-type"].startswith("text/event-stream")

    def test_thread_id_in_headers(self, mock_authenticated_user: AuthenticatedUser) -> None:
        """Should include thread_id in response headers."""
        from src.api.auth import get_current_user
        from src.api.graph import router

        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[get_current_user] = lambda: mock_authenticated_user

        mock_graph = AsyncMock()

        async def empty_stream(*args: Any, **kwargs: Any) -> Any:
            return
            yield

        mock_graph.astream_events = empty_stream

        with patch("src.api.graph.get_compiled_graph", return_value=mock_graph):
            client = TestClient(app)
            response = client.post("/api/chat/stream", json={"message": "Hello"})

            assert "x-thread-id" in response.headers


# -----------------------------------------------------------------------------
# SSE Format Tests
# -----------------------------------------------------------------------------


class TestSSEFormatting:
    """Tests for SSE event formatting functions."""

    def test_format_messages_partial(self) -> None:
        """Should format partial message correctly."""
        from src.api.graph import format_messages_partial

        result = format_messages_partial("Hello")

        assert result.startswith("data: ")
        assert result.endswith("\n\n")

        # Parse the JSON
        json_str = result[6:-2]  # Remove "data: " prefix and "\n\n" suffix
        data = json.loads(json_str)

        assert data["event"] == "messages/partial"
        assert data["data"][0]["role"] == "assistant"
        assert data["data"][0]["content"] == "Hello"

    def test_format_messages_complete(self) -> None:
        """Should format complete message correctly."""
        from src.api.graph import format_messages_complete

        result = format_messages_complete("Full response", "msg-123")

        json_str = result[6:-2]
        data = json.loads(json_str)

        assert data["event"] == "messages/complete"
        assert data["data"][0]["content"] == "Full response"
        assert data["data"][0]["id"] == "msg-123"

    def test_format_messages_complete_without_id(self) -> None:
        """Should format complete message without id."""
        from src.api.graph import format_messages_complete

        result = format_messages_complete("Full response")

        json_str = result[6:-2]
        data = json.loads(json_str)

        assert "id" not in data["data"][0]

    def test_format_interrupt_event(self) -> None:
        """Should format interrupt event for HITL."""
        from src.api.graph import format_interrupt_event

        interrupt_value = {
            "type": "breathing_confirmation",
            "proposed_technique": {"id": "box", "name": "Box Breathing"},
            "message": "Would you like to try Box Breathing?",
            "available_techniques": [],
            "options": ["start", "change_technique", "not_now"],
        }

        result = format_interrupt_event(interrupt_value)

        json_str = result[6:-2]
        data = json.loads(json_str)

        assert data["event"] == "updates"
        assert "__interrupt__" in data["data"]
        assert len(data["data"]["__interrupt__"]) == 1
        assert data["data"]["__interrupt__"][0]["value"]["type"] == "breathing_confirmation"

    def test_format_done_event(self) -> None:
        """Should format done event correctly."""
        from src.api.graph import format_done_event

        result = format_done_event()
        assert result == "data: [DONE]\n\n"

    def test_format_error_event(self) -> None:
        """Should format error event correctly."""
        from src.api.graph import format_error_event

        result = format_error_event("Something went wrong")

        json_str = result[6:-2]
        data = json.loads(json_str)

        assert data["event"] == "error"
        assert data["data"]["message"] == "Something went wrong"


# -----------------------------------------------------------------------------
# Content Filtering Tests
# -----------------------------------------------------------------------------


class TestContentFiltering:
    """Tests for content filtering functions."""

    def test_filter_technique_ids(self) -> None:
        """Should filter technique ID responses."""
        from src.api.graph import should_filter_content

        assert should_filter_content("box") is True
        assert should_filter_content("relaxing_478") is True
        assert should_filter_content("coherent") is True
        assert should_filter_content("deep_calm") is True
        # Case insensitive
        assert should_filter_content("BOX") is True
        assert should_filter_content("  box  ") is True

    def test_not_filter_regular_content(self) -> None:
        """Should not filter regular chat content."""
        from src.api.graph import should_filter_content

        assert should_filter_content("Hello! How can I help?") is False
        assert should_filter_content("Let's try a breathing exercise") is False
        assert should_filter_content("The box is on the table") is False


# -----------------------------------------------------------------------------
# Helper Function Tests
# -----------------------------------------------------------------------------


class TestHelperFunctions:
    """Tests for helper functions."""

    def test_extract_ai_response_string(self) -> None:
        """Should extract string content from AI message."""
        from src.api.graph import extract_ai_response

        messages = [
            HumanMessage(content="Hi"),
            AIMessage(content="Hello there!"),
        ]

        result = extract_ai_response(messages)
        assert result == "Hello there!"

    def test_extract_ai_response_list(self) -> None:
        """Should extract list content from AI message (Gemini format)."""
        from src.api.graph import extract_ai_response

        messages = [
            HumanMessage(content="Hi"),
            AIMessage(
                content=[{"type": "text", "text": "Hello "}, {"type": "text", "text": "there!"}]
            ),
        ]

        result = extract_ai_response(messages)
        assert result == "Hello there!"

    def test_extract_ai_response_empty(self) -> None:
        """Should return empty string when no AI messages."""
        from src.api.graph import extract_ai_response

        messages = [HumanMessage(content="Hi")]

        result = extract_ai_response(messages)
        assert result == ""

    def test_message_to_history_human(self) -> None:
        """Should convert human message to history format."""
        from src.api.graph import message_to_history

        msg = HumanMessage(content="Hello")
        result = message_to_history(msg, 0)

        assert result.role == "user"
        assert result.content == "Hello"
        assert result.id == "msg-0"

    def test_message_to_history_ai(self) -> None:
        """Should convert AI message to history format."""
        from src.api.graph import message_to_history

        msg = AIMessage(content="Hi there!")
        result = message_to_history(msg, 1)

        assert result.role == "assistant"
        assert result.content == "Hi there!"

    def test_message_to_history_with_id(self) -> None:
        """Should use message ID if present."""
        from src.api.graph import message_to_history

        msg = AIMessage(content="Hi", id="custom-id-123")
        result = message_to_history(msg, 0)

        assert result.id == "custom-id-123"


# -----------------------------------------------------------------------------
# History Endpoint Tests
# -----------------------------------------------------------------------------


class TestHistoryEndpoint:
    """Tests for GET /api/threads/{thread_id}/history."""

    def test_get_history(self, mock_authenticated_user: AuthenticatedUser) -> None:
        """Should return conversation history."""
        from src.api.auth import get_current_user
        from src.api.graph import router

        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[get_current_user] = lambda: mock_authenticated_user

        mock_graph = AsyncMock()
        mock_state = MagicMock()
        mock_state.values = {
            "messages": [
                HumanMessage(content="Hi"),
                AIMessage(content="Hello!"),
            ]
        }
        mock_graph.aget_state = AsyncMock(return_value=mock_state)

        with patch("src.api.graph.get_compiled_graph", return_value=mock_graph):
            client = TestClient(app)
            response = client.get("/api/threads/thread-123/history")

            assert response.status_code == 200
            data = response.json()
            assert data["thread_id"] == "thread-123"
            assert len(data["messages"]) == 2
            assert data["messages"][0]["role"] == "user"
            assert data["messages"][0]["content"] == "Hi"
            assert data["messages"][1]["role"] == "assistant"
            assert data["messages"][1]["content"] == "Hello!"

    def test_history_not_found(self, mock_authenticated_user: AuthenticatedUser) -> None:
        """Should return 404 for non-existent thread."""
        from src.api.auth import get_current_user
        from src.api.graph import router

        app = FastAPI()
        app.include_router(router)
        app.dependency_overrides[get_current_user] = lambda: mock_authenticated_user

        mock_graph = AsyncMock()
        mock_graph.aget_state = AsyncMock(side_effect=Exception("Thread not found"))

        with patch("src.api.graph.get_compiled_graph", return_value=mock_graph):
            client = TestClient(app)
            response = client.get("/api/threads/nonexistent/history")

            assert response.status_code == 404


# -----------------------------------------------------------------------------
# Delete Endpoint Tests
# -----------------------------------------------------------------------------


class TestDeleteEndpoint:
    """Tests for DELETE /api/threads/{thread_id}."""

    def test_delete_thread(self, test_client: TestClient) -> None:
        """Should return success for delete request."""
        response = test_client.delete("/api/threads/thread-123")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "deleted"
        assert data["thread_id"] == "thread-123"


# -----------------------------------------------------------------------------
# Resume Endpoint Tests
# -----------------------------------------------------------------------------


class TestResumeEndpoint:
    """Tests for POST /api/chat/resume."""

    def test_resume_request_model(self) -> None:
        """Should validate resume request model."""
        from src.api.graph import ResumeRequest

        # Valid request with all fields
        request = ResumeRequest(
            thread_id="thread-123",
            decision="start",
            technique_id="box",
            voice_id="nova",
        )
        assert request.thread_id == "thread-123"
        assert request.decision == "start"
        assert request.technique_id == "box"
        assert request.voice_id == "nova"

        # Valid request with only required fields
        request = ResumeRequest(thread_id="thread-456", decision="not_now")
        assert request.technique_id is None
        assert request.voice_id is None
