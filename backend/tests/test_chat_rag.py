from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.ai.client import build_messages
from app.ai.prompts import ChatMode
from app.schemas.kb import FaqSearchResult
from app.services import chat as chat_service
from app.services.kb_embedding import EmbeddingProviderError


def test_format_kb_context_includes_ids():
    hits = [
        FaqSearchResult(
            id="faq-it-support-001",
            question="I forgot my password",
            answer="Use the reset form.",
            category="IT Support",
            score=0.9,
        )
    ]
    text = chat_service._format_kb_context(hits)
    assert "faq-it-support-001" in text
    assert "Use the reset form." in text


@pytest.mark.asyncio
async def test_retrieve_marks_strong_hits(monkeypatch):
    hits = [
        FaqSearchResult(
            id="faq-it-support-001",
            question="I forgot my password",
            answer="Reset it.",
            category="IT Support",
            score=0.8,
        )
    ]
    monkeypatch.setattr(chat_service, "embed_text", AsyncMock(return_value=[0.1] * 8))
    monkeypatch.setattr(
        chat_service.kb_service,
        "search_faq_vector",
        AsyncMock(return_value=hits),
    )
    bundle = await chat_service.retrieve_for_query(SimpleNamespace(), "password reset")
    assert bundle.retrieval_weak is False
    assert bundle.citations[0].id == "faq-it-support-001"
    assert "faq-it-support-001" in bundle.kb_context


@pytest.mark.asyncio
async def test_retrieve_falls_back_to_text_search(monkeypatch):
    hits = [
        FaqSearchResult(
            id="faq-finance-001",
            question="Tuition deadline",
            answer="Pay by the portal date.",
            category="Finance",
            score=1.0,
        )
    ]
    monkeypatch.setattr(
        chat_service,
        "embed_text",
        AsyncMock(side_effect=EmbeddingProviderError("offline")),
    )
    monkeypatch.setattr(
        chat_service.kb_service,
        "search_faq",
        AsyncMock(return_value=hits),
    )
    bundle = await chat_service.retrieve_for_query(SimpleNamespace(), "tuition")
    assert bundle.retrieval_weak is False
    assert bundle.citations[0].id == "faq-finance-001"


@pytest.mark.asyncio
async def test_retrieve_skips_chitchat_without_embedding(monkeypatch):
    embed = AsyncMock()
    monkeypatch.setattr(chat_service, "embed_text", embed)
    bundle = await chat_service.retrieve_for_query(SimpleNamespace(), "Hello there")
    assert bundle.retrieval_weak is False
    assert bundle.citations == []
    assert bundle.kb_context == chat_service.CHITCHAT_KB_CONTEXT
    embed.assert_not_called()


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("hi", True),
        ("Hello there!", True),
        ("thanks", True),
        ("How do I reset my password?", False),
        ("VPN will not connect", False),
    ],
)
def test_is_chitchat_query(text, expected):
    assert chat_service.is_chitchat_query(text) is expected


@pytest.mark.asyncio
async def test_retrieve_weak_when_scores_low(monkeypatch):
    hits = [
        FaqSearchResult(
            id="faq-misc-001",
            question="Unrelated",
            answer="Nope",
            category="Academics",
            score=0.2,
        )
    ]
    monkeypatch.setattr(chat_service, "embed_text", AsyncMock(return_value=[0.1] * 8))
    monkeypatch.setattr(
        chat_service.kb_service,
        "search_faq_vector",
        AsyncMock(return_value=hits),
    )
    bundle = await chat_service.retrieve_for_query(
        SimpleNamespace(), "How do I fix something obscure?"
    )
    assert bundle.retrieval_weak is True
    assert bundle.citations == []
    assert bundle.kb_context == chat_service.NO_KB_CONTEXT


@pytest.mark.asyncio
async def test_retrieve_weak_non_support_stays_quiet(monkeypatch):
    """Long-ish non-support chatter: no escalate chrome, soft chitchat context."""
    hits = [
        FaqSearchResult(
            id="faq-misc-001",
            question="Unrelated",
            answer="Nope",
            category="Academics",
            score=0.1,
        )
    ]
    monkeypatch.setattr(chat_service, "embed_text", AsyncMock(return_value=[0.1] * 8))
    monkeypatch.setattr(
        chat_service.kb_service,
        "search_faq_vector",
        AsyncMock(return_value=hits),
    )
    bundle = await chat_service.retrieve_for_query(
        SimpleNamespace(), "Just wondering about the weather today overall"
    )
    assert bundle.retrieval_weak is False
    assert bundle.citations == []
    assert bundle.kb_context == chat_service.CHITCHAT_KB_CONTEXT


def test_build_messages_injects_kb_context():
    messages = build_messages(
        [("user", "hello")],
        ChatMode.QUICK,
        kb_context="KB block",
    )
    assert messages[0]["role"] == "system"
    assert messages[1] == {"role": "system", "content": "KB block"}
    assert messages[2] == {"role": "user", "content": "hello"}
