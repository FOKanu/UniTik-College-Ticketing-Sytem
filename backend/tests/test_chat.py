import uuid
from types import SimpleNamespace

import pytest
from sqlalchemy import delete

from app.ai import client as ai_client
from app.ai.llm_config import LLMSettings
from app.ai.triage import TicketSuggestion
from app.core.exceptions import BadRequestError
from app.db.base import Role
from app.db.session import async_session_factory
from app.models import ChatConversation, ChatMessage, User
from app.services import chat as chat_service
from app.services.chat import TRANSCRIPT_MAX_CHARS, _format_transcript
from tests.conftest import integration

# Reserved discard port — nothing is listening, so the client must fail fast.
UNREACHABLE_BASE_URL = "http://127.0.0.1:9/v1"


@pytest.fixture
def offline_llm(monkeypatch):
    config = LLMSettings(ollama_openai_base_url=UNREACHABLE_BASE_URL).resolve()
    monkeypatch.setattr(ai_client, "get_llm_config", lambda: config)
    monkeypatch.setattr(ai_client, "_health_cache", None)
    yield config
    ai_client._health_cache = None


@pytest.mark.asyncio
async def test_create_conversation_requires_auth(client):
    response = await client.post("/api/v1/chat/conversations")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_stream_message_requires_auth(client):
    response = await client.post(
        "/api/v1/chat/conversations/does-not-matter/messages/stream",
        json={"content": "hello"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_health_reports_offline_without_raising(client, offline_llm):
    response = await client.get("/api/v1/chat/health")
    assert response.status_code == 200

    data = response.json()["data"]
    assert data["status"] == "offline"
    assert data["baseUrl"] == UNREACHABLE_BASE_URL
    assert data["model"] == "qwen3:8b"
    assert "error" in data


@pytest.mark.asyncio
async def test_escalate_requires_auth(client):
    response = await client.post("/api/v1/chat/conversations/x/escalate")
    assert response.status_code == 401


def test_transcript_labels_speakers_by_display_name():
    user = SimpleNamespace(displayName="Ada Lovelace")
    messages = [
        SimpleNamespace(sender="user", content="My WiFi keeps dropping"),
        SimpleNamespace(sender="bot", content="Try forgetting the network"),
    ]

    transcript = _format_transcript(messages, user)

    assert "Ada Lovelace: My WiFi keeps dropping" in transcript
    assert "Assistant: Try forgetting the network" in transcript


def test_transcript_is_capped():
    user = SimpleNamespace(displayName="Ada")
    messages = [SimpleNamespace(sender="user", content="x" * 5000) for _ in range(10)]

    transcript = _format_transcript(messages, user)

    assert len(transcript) < 50_000
    assert transcript.endswith("[transcript truncated]")
    assert len(transcript) <= TRANSCRIPT_MAX_CHARS + len("\n\n[transcript truncated]")


@pytest.mark.asyncio
async def test_invalid_mode_is_rejected(client):
    response = await client.post(
        "/api/v1/chat/conversations/x/messages/stream",
        json={"content": "hello", "mode": "not-a-mode"},
        headers={"Authorization": "Bearer invalid"},
    )
    assert response.status_code in (401, 422)


async def _seed_conversation(db, *, with_messages: bool):
    user = User(
        email=f"escalate-{uuid.uuid4()}@student.university.edu",
        displayName="Ada Lovelace",
        role=Role.STUDENT,
        department="IT",
    )
    db.add(user)
    await db.flush()

    conversation = ChatConversation(userId=user.id)
    db.add(conversation)
    await db.flush()

    if with_messages:
        db.add(
            ChatMessage(
                conversationId=conversation.id,
                sender="user",
                content="My WiFi keeps dropping in the library",
            )
        )
        db.add(
            ChatMessage(
                conversationId=conversation.id,
                sender="bot",
                content="Try forgetting the network and reconnecting.",
            )
        )
    await db.commit()
    return user, conversation


async def _cleanup(db, user, conversation, ticket=None):
    await db.execute(delete(ChatMessage).where(ChatMessage.conversationId == conversation.id))
    await db.delete(conversation)
    await db.flush()
    if ticket is not None:
        await db.delete(ticket)
    await db.delete(user)
    await db.commit()


@pytest.mark.asyncio
@integration
async def test_escalation_builds_ticket_from_transcript(monkeypatch):
    async def fake_triage(_transcript):
        return TicketSuggestion(subject="WiFi drops in the library", category="it")

    monkeypatch.setattr(chat_service, "suggest_ticket_fields", fake_triage)

    async with async_session_factory() as db:
        user, conversation = await _seed_conversation(db, with_messages=True)

        result = await chat_service.escalate_to_ticket(db, conversation.id, user)

        assert result.already_escalated is False
        assert result.ticket.subject == "WiFi drops in the library"
        assert result.ticket.category == "it"
        assert result.ticket.department == "IT"
        assert "Ada Lovelace: My WiFi keeps dropping in the library" in result.ticket.description
        assert "Assistant: Try forgetting the network" in result.ticket.description
        assert result.conversation.escalatedTicketId == result.ticket.id
        # The user sees a confirmation turn in the chat itself.
        assert result.bot_message is not None
        assert "WiFi drops in the library" in result.bot_message.content

        await _cleanup(db, user, conversation, result.ticket)


@pytest.mark.asyncio
@integration
async def test_escalating_twice_reuses_the_same_ticket(monkeypatch):
    calls = {"n": 0}

    async def fake_triage(_transcript):
        calls["n"] += 1
        return TicketSuggestion(subject="Only made once", category="it")

    monkeypatch.setattr(chat_service, "suggest_ticket_fields", fake_triage)

    async with async_session_factory() as db:
        user, conversation = await _seed_conversation(db, with_messages=True)

        first = await chat_service.escalate_to_ticket(db, conversation.id, user)
        second = await chat_service.escalate_to_ticket(db, conversation.id, user)

        assert second.already_escalated is True
        assert second.ticket.id == first.ticket.id
        assert second.bot_message is None
        assert calls["n"] == 1

        await _cleanup(db, user, conversation, first.ticket)


@pytest.mark.asyncio
@integration
async def test_escalating_an_empty_conversation_is_rejected():
    async with async_session_factory() as db:
        user, conversation = await _seed_conversation(db, with_messages=False)

        with pytest.raises(BadRequestError):
            await chat_service.escalate_to_ticket(db, conversation.id, user)

        assert conversation.escalatedTicketId is None
        await _cleanup(db, user, conversation)


@pytest.mark.asyncio
@integration
async def test_escalation_survives_an_offline_model(monkeypatch):
    async def unavailable(_transcript):
        return None

    monkeypatch.setattr(chat_service, "suggest_ticket_fields", unavailable)

    async with async_session_factory() as db:
        user, conversation = await _seed_conversation(db, with_messages=True)

        result = await chat_service.escalate_to_ticket(db, conversation.id, user)

        # Falls back to the user's own words rather than failing the escalation.
        assert result.ticket.subject == "My WiFi keeps dropping in the library"
        assert result.ticket.category is None

        await _cleanup(db, user, conversation, result.ticket)
