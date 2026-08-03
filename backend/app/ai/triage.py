"""Turns a chat transcript into ticket metadata an agent can act on.

Per NEG-6 the model may categorise and route, but never decides an outcome —
everything here is a suggestion attached to a ticket a human then handles.
"""

import json
import logging
import re
from dataclasses import dataclass

from app.ai.client import LLMUnavailableError, chat_completion
from app.ai.prompts import ChatMode

logger = logging.getLogger(__name__)

SUBJECT_MAX_LENGTH = 120

CATEGORIES = ("academics", "it", "finance", "maintenance", "other")

TRIAGE_PROMPT = """You are triaging a university helpdesk conversation into a support ticket.

Reply with a single JSON object and nothing else:
{"subject": "...", "category": "..."}

- "subject": a specific one-line summary of the user's problem, at most 80 characters. \
Write it as a helpdesk ticket title. Do not start with "Ticket" or "Request".
- "category": exactly one of academics, it, finance, maintenance, other."""

_JSON_OBJECT = re.compile(r"\{.*?\}", re.DOTALL)


@dataclass(frozen=True)
class TicketSuggestion:
    subject: str
    category: str


def _first_sentence(text: str) -> str:
    collapsed = " ".join(text.split())
    if len(collapsed) <= SUBJECT_MAX_LENGTH:
        return collapsed
    return f"{collapsed[: SUBJECT_MAX_LENGTH - 1].rstrip()}…"


def fallback_subject(messages: list[tuple[str, str]]) -> str:
    """Subject derived from the first thing the user actually asked."""
    for sender, content in messages:
        if sender == "user" and content.strip():
            return _first_sentence(content)
    return "Escalated from chat"


def parse_suggestion(raw: str) -> TicketSuggestion | None:
    """Reads the model's JSON reply, tolerating surrounding prose."""
    match = _JSON_OBJECT.search(raw or "")
    if not match:
        return None
    try:
        payload = json.loads(match.group(0))
    except (json.JSONDecodeError, TypeError):
        return None
    if not isinstance(payload, dict):
        return None

    subject = str(payload.get("subject") or "").strip()
    if not subject:
        return None

    category = str(payload.get("category") or "").strip().lower()
    if category not in CATEGORIES:
        category = "other"

    return TicketSuggestion(subject=_first_sentence(subject), category=category)


async def suggest_ticket_fields(transcript: str) -> TicketSuggestion | None:
    """Returns None whenever the model is unavailable or answers unusably."""
    try:
        raw = await chat_completion(
            [
                {"role": "system", "content": TRIAGE_PROMPT},
                {"role": "user", "content": transcript},
            ],
            ChatMode.QUICK,
        )
    except LLMUnavailableError as exc:
        logger.warning("Ticket triage skipped, model unavailable: %s", exc)
        return None

    suggestion = parse_suggestion(raw)
    if suggestion is None:
        logger.warning("Ticket triage returned unparseable output: %r", raw[:200])
    return suggestion
