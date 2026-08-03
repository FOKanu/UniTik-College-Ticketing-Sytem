import json

import httpx
import pytest
from openai import AsyncOpenAI

from app.ai import client as ai_client
from app.ai import triage
from app.ai.client import ThinkTagFilter, build_messages, strip_think_tags
from app.ai.llm_config import LLMProvider, LLMSettings
from app.ai.prompts import ChatMode


def _stream(chunks: list[str]) -> str:
    filt = ThinkTagFilter()
    return "".join(filt.feed(chunk) for chunk in chunks) + filt.flush()


def test_strips_reasoning_span():
    assert strip_think_tags("<think>scratchpad</think>Answer.") == "Answer."


def test_passes_through_text_without_tags():
    assert strip_think_tags("Just an answer.") == "Just an answer."


def test_strips_tags_split_across_stream_chunks():
    assert _stream(["<thi", "nk>secret", "</thi", "nk>Hel", "lo"]) == "Hello"


def test_drops_unterminated_reasoning():
    assert _stream(["<think>", "cut off mid-thought"]) == ""


def test_keeps_text_before_and_after_reasoning():
    assert _stream(["Before ", "<think>x</think>", "after"]) == "Before after"


def test_build_messages_maps_bot_sender_to_assistant_role():
    messages = build_messages([("user", "hi"), ("bot", "hello")], ChatMode.QUICK)
    assert messages[0]["role"] == "system"
    assert [m["role"] for m in messages[1:]] == ["user", "assistant"]


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("http://127.0.0.1:11434", "http://127.0.0.1:11434/v1"),
        ("http://127.0.0.1:11434/", "http://127.0.0.1:11434/v1"),
        ("http://127.0.0.1:11434/v1", "http://127.0.0.1:11434/v1"),
    ],
)
def test_ollama_host_normalises_to_openai_path(raw, expected):
    config = LLMSettings(ollama_host=raw, ollama_openai_base_url="", ollama_base_url="").resolve()
    assert config.base_url == expected


def test_explicit_openai_base_url_wins_over_host():
    config = LLMSettings(
        ollama_host="http://ignored:1234",
        ollama_openai_base_url="http://gpu-box:11434/v1",
    ).resolve()
    assert config.base_url == "http://gpu-box:11434/v1"


def test_ollama_sends_keep_alive_hint():
    config = LLMSettings(ollama_keep_alive="10m").resolve()
    assert config.extra_body == {"keep_alive": "10m", "think": False}
    assert config.is_configured


def test_ollama_disables_think_without_keep_alive():
    config = LLMSettings(ollama_keep_alive="").resolve()
    assert config.extra_body == {"think": False}


def test_switching_provider_swaps_endpoint_and_model():
    config = LLMSettings(
        llm_provider=LLMProvider.GOOGLE,
        google_api_key="test-key",
        google_model="gemini-2.0-flash",
    ).resolve()
    assert config.provider is LLMProvider.GOOGLE
    assert "generativelanguage.googleapis.com" in config.base_url
    assert config.model == "gemini-2.0-flash"


def test_provider_without_api_key_is_not_configured():
    config = LLMSettings(llm_provider=LLMProvider.OPENAI, openai_api_key="").resolve()
    assert not config.is_configured


def test_public_summary_never_leaks_the_api_key():
    config = LLMSettings(llm_provider=LLMProvider.OPENAI, openai_api_key="sk-secret").resolve()
    assert "sk-secret" not in str(config.public_summary())


def test_triage_parses_plain_json():
    suggestion = triage.parse_suggestion('{"subject": "Library card expired", "category": "it"}')
    assert suggestion == triage.TicketSuggestion(subject="Library card expired", category="it")


def test_triage_parses_json_wrapped_in_prose():
    suggestion = triage.parse_suggestion(
        'Sure! {"subject": "Refund not received", "category": "finance"} Hope that helps.'
    )
    assert suggestion is not None
    assert suggestion.category == "finance"


def test_triage_falls_back_to_other_for_unknown_category():
    suggestion = triage.parse_suggestion('{"subject": "Broken door", "category": "banana"}')
    assert suggestion is not None
    assert suggestion.category == "other"


@pytest.mark.parametrize(
    "raw",
    ["I cannot help with that", "", '{"subject": "", "category": "it"}', "{not json}"],
)
def test_triage_rejects_unusable_output(raw):
    assert triage.parse_suggestion(raw) is None


def test_triage_truncates_an_overlong_subject():
    suggestion = triage.parse_suggestion(
        '{"subject": "' + "x" * 400 + '", "category": "it"}',
    )
    assert suggestion is not None
    assert len(suggestion.subject) <= triage.SUBJECT_MAX_LENGTH


def test_fallback_subject_uses_the_first_user_message():
    subject = triage.fallback_subject(
        [("bot", "Hi, how can I help?"), ("user", "My WiFi keeps dropping"), ("user", "still bad")]
    )
    assert subject == "My WiFi keeps dropping"


def test_fallback_subject_without_user_messages():
    assert triage.fallback_subject([("bot", "Hi")]) == "Escalated from chat"


@pytest.mark.asyncio
async def test_triage_returns_none_when_model_is_unavailable(monkeypatch):
    async def boom(*_args, **_kwargs):
        raise ai_client.LLMUnavailableError("connection refused")

    monkeypatch.setattr(triage, "chat_completion", boom)
    assert await triage.suggest_ticket_fields("User: help") is None


def _sse_chunks(pieces: list[str]) -> str:
    frames = []
    for piece in pieces:
        payload = {
            "id": "1",
            "object": "chat.completion.chunk",
            "created": 0,
            "model": "qwen3:8b",
            "choices": [{"index": 0, "delta": {"content": piece}, "finish_reason": None}],
        }
        frames.append(f"data: {json.dumps(payload)}\n\n")
    frames.append("data: [DONE]\n\n")
    return "".join(frames)


@pytest.fixture
def fake_provider(monkeypatch):
    """Wires the client to an in-process OpenAI-compatible endpoint."""
    sent: dict = {}

    def build(pieces: list[str]):
        def handler(request: httpx.Request) -> httpx.Response:
            sent.update(json.loads(request.content))
            return httpx.Response(
                200,
                text=_sse_chunks(pieces),
                headers={"content-type": "text/event-stream"},
            )

        config = LLMSettings(ollama_openai_base_url="http://fake-gpu:11434/v1").resolve()
        monkeypatch.setattr(ai_client, "get_llm_config", lambda: config)
        monkeypatch.setattr(
            ai_client,
            "_clients",
            {
                (config.base_url, config.api_key, config.timeout): AsyncOpenAI(
                    base_url=config.base_url,
                    api_key=config.api_key,
                    http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler)),
                )
            },
        )
        return sent

    return build


@pytest.mark.asyncio
async def test_stream_yields_answer_without_reasoning(fake_provider):
    fake_provider(["<thi", "nk>deliberating", "</think>", "Card ", "expires ", "in June."])

    deltas = [
        delta
        async for delta in ai_client.stream_chat_completion(
            [{"role": "user", "content": "when?"}], ChatMode.QUICK
        )
    ]

    assert "".join(deltas) == "Card expires in June."
    assert "think" not in "".join(deltas)


@pytest.mark.asyncio
async def test_stream_sends_model_and_keep_alive(fake_provider):
    sent = fake_provider(["ok"])

    async for _ in ai_client.stream_chat_completion(
        [{"role": "user", "content": "hi"}], ChatMode.QUICK
    ):
        pass

    assert sent["model"] == "qwen3:8b"
    assert sent["stream"] is True
    assert sent["keep_alive"] == "10m"
    assert sent["think"] is False


@pytest.mark.asyncio
async def test_quick_mode_caps_response_length(fake_provider):
    sent = fake_provider(["ok"])

    async for _ in ai_client.stream_chat_completion(
        [{"role": "user", "content": "hi"}], ChatMode.QUICK
    ):
        pass

    assert sent["max_tokens"] == 600
    assert sent.get("think") is False
