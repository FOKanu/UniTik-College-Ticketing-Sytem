import logging
import re
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import LLMUnavailableError, chat_completion
from app.ai.client import build_messages
from app.ai.triage import fallback_subject, suggest_ticket_fields
from app.core.exceptions import BadRequestError, ForbiddenError, NotFoundError
from app.db.base import TicketStatus
from app.models import ChatConversation, ChatMessage, Ticket, User
from app.schemas.chat import Citation, MessageCreate
from app.schemas.kb import FaqSearchResult
from app.services import kb as kb_service
from app.services.kb_embedding import EmbeddingProviderError, embed_text

logger = logging.getLogger(__name__)

# How many prior turns to replay as context. Keeps prompts bounded on an 8B model.
HISTORY_LIMIT = 20

# Ticket descriptions embed the transcript, so cap what one chat can write.
TRANSCRIPT_MAX_CHARS = 20_000

RAG_TOP_K = 5
# Cosine similarity (1 - distance). Below this we treat retrieval as weak.
RAG_MIN_SCORE = 0.55

LLM_OFFLINE_REPLY = (
    "I can't reach the AI assistant right now. A support agent can help if you "
    "escalate this conversation to a ticket."
)

LLM_EMPTY_REPLY = (
    "I could not produce an answer for that turn. Please try again, or propose "
    "a support ticket from this conversation."
)

# Soft prompts — avoid forcing "escalate" / FAQ chrome on greetings.
CHITCHAT_KB_CONTEXT = (
    "The user sent a greeting or small-talk message. Reply briefly and warmly. "
    "Do not mention the knowledge base, tickets, or escalation unless they ask."
)

NO_KB_CONTEXT = (
    "No matching knowledge-base excerpts were found for this question. "
    "Answer briefly without inventing specific university policy, deadlines, "
    "fees, or contact details. If this is a concrete support issue, offer to "
    "escalate to a ticket; otherwise just help as best you can."
)

_GREETING_RE = re.compile(
    r"^(hi|hello|hey|howdy|greetings|good\s+(morning|afternoon|evening)|"
    r"thanks|thank\s+you|thx|ty|ok|okay|cool|great|bye|goodbye|cheers|"
    r"hello there|hi there|hey there)[\s!.?]*$",
    re.IGNORECASE,
)

_SUPPORT_HINT_RE = re.compile(
    r"\b(help|problem|issue|broken|error|bug|can't|cannot|unable|won't|dont|"
    r"don't|how\s+(do|to|can)|where|when|why|ticket|login|password|vpn|"
    r"wifi|grade|exam|pay|tuition|refund|register|appeal)\b",
    re.IGNORECASE,
)


def is_chitchat_query(query: str) -> bool:
    """True for greetings / tiny non-questions that should skip FAQ retrieval."""
    text = " ".join(query.strip().split())
    if not text:
        return True
    if _GREETING_RE.match(text):
        return True
    words = text.split()
    # Short utterances without a question mark and without support keywords.
    if len(words) <= 3 and "?" not in text and not _SUPPORT_HINT_RE.search(text):
        return True
    return False


def looks_like_support_issue(query: str) -> bool:
    """True when a weak/no-hit reply should still surface escalate affordances."""
    text = query.strip()
    if not text or is_chitchat_query(text):
        return False
    if "?" in text:
        return True
    return bool(_SUPPORT_HINT_RE.search(text))


@dataclass
class EscalationResult:
    conversation: ChatConversation
    ticket: Ticket
    already_escalated: bool
    bot_message: ChatMessage | None


@dataclass
class RetrievalBundle:
    citations: list[Citation]
    kb_context: str
    retrieval_weak: bool


async def create_conversation(db: AsyncSession, user: User) -> ChatConversation:
    conversation = ChatConversation(userId=user.id)
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return conversation


async def list_conversations(db: AsyncSession, user: User) -> list[ChatConversation]:
    result = await db.execute(select(ChatConversation).where(ChatConversation.userId == user.id))
    return list(result.scalars().all())


async def get_conversation(
    db: AsyncSession, conversation_id: str, user: User
) -> ChatConversation:
    result = await db.execute(
        select(ChatConversation).where(ChatConversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise NotFoundError("Conversation not found")
    if conversation.userId != user.id:
        raise ForbiddenError("Cannot access another user's conversation")
    return conversation


async def list_messages(
    db: AsyncSession, conversation_id: str, user: User
) -> list[ChatMessage]:
    await get_conversation(db, conversation_id, user)
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversationId == conversation_id)
        .order_by(ChatMessage.createdAt)
    )
    return list(result.scalars().all())


async def _recent_history(db: AsyncSession, conversation_id: str) -> list[tuple[str, str]]:
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.conversationId == conversation_id)
        .order_by(ChatMessage.createdAt.desc())
        .limit(HISTORY_LIMIT)
    )
    rows = list(result.scalars().all())
    rows.reverse()
    return [(m.sender, m.content) for m in rows]


def _citations_from_hits(hits: list[FaqSearchResult]) -> list[Citation]:
    return [
        Citation(
            id=hit.id,
            question=hit.question,
            category=hit.category,
            score=float(hit.score),
        )
        for hit in hits
    ]


def _format_kb_context(hits: list[FaqSearchResult]) -> str:
    blocks = [
        f"[{index}] id={hit.id} category={hit.category or 'General'}\n"
        f"Q: {hit.question}\nA: {hit.answer}"
        for index, hit in enumerate(hits, start=1)
    ]
    return (
        "Knowledge-base excerpts (use these; cite FAQ ids when you rely on them):\n\n"
        + "\n\n".join(blocks)
    )


async def retrieve_for_query(db: AsyncSession, query: str) -> RetrievalBundle:
    """Vector search with text fallback. Skips RAG chrome for chitchat.

    Weak hits no longer surface "closest articles" — empty citations keep the
    UI clean while the model still gets a soft no-match instruction.
    """
    if is_chitchat_query(query):
        return RetrievalBundle(
            citations=[],
            kb_context=CHITCHAT_KB_CONTEXT,
            retrieval_weak=False,
        )

    hits: list[FaqSearchResult] = []
    try:
        vector = await embed_text(query)
        hits = await kb_service.search_faq_vector(db, vector, limit=RAG_TOP_K)
    except EmbeddingProviderError as exc:
        logger.warning("Embedding retrieval failed; falling back to text search: %s", exc)
        hits = await kb_service.search_faq(db, query, limit=RAG_TOP_K)

    strong = [hit for hit in hits if hit.score >= RAG_MIN_SCORE]
    if strong:
        return RetrievalBundle(
            citations=_citations_from_hits(strong),
            kb_context=_format_kb_context(strong),
            retrieval_weak=False,
        )

    # Low scores: do not pass noisy nearest-neighbour FAQs to the UI.
    supportish = looks_like_support_issue(query)
    return RetrievalBundle(
        citations=[],
        kb_context=NO_KB_CONTEXT if supportish else CHITCHAT_KB_CONTEXT,
        retrieval_weak=supportish,
    )


async def start_user_turn(
    db: AsyncSession, conversation_id: str, user: User, data: MessageCreate
) -> tuple[ChatMessage, list[dict[str, str]], RetrievalBundle]:
    """Persist the user's message, retrieve KB context, and build the LLM prompt."""
    conversation = await get_conversation(db, conversation_id, user)
    user_message = ChatMessage(
        conversationId=conversation.id,
        sender="user",
        content=data.content,
    )
    db.add(user_message)
    await db.commit()
    await db.refresh(user_message)

    retrieval = await retrieve_for_query(db, data.content)
    history = await _recent_history(db, conversation.id)
    prompt = build_messages(history, data.mode, kb_context=retrieval.kb_context)
    return user_message, prompt, retrieval


async def finish_bot_turn(db: AsyncSession, conversation_id: str, content: str) -> ChatMessage:
    bot_message = ChatMessage(
        conversationId=conversation_id,
        sender="bot",
        content=content or LLM_EMPTY_REPLY,
    )
    db.add(bot_message)
    await db.commit()
    await db.refresh(bot_message)
    return bot_message


async def send_message(
    db: AsyncSession, conversation_id: str, user: User, data: MessageCreate
) -> tuple[ChatMessage, ChatMessage, RetrievalBundle]:
    user_message, prompt, retrieval = await start_user_turn(db, conversation_id, user, data)

    try:
        reply = await chat_completion(prompt, data.mode)
    except LLMUnavailableError as exc:
        # A dead model server must not lose the user's message or 500 the request.
        logger.warning("Falling back to offline reply: %s", exc)
        reply = LLM_OFFLINE_REPLY

    bot_message = await finish_bot_turn(db, conversation_id, reply)
    return user_message, bot_message, retrieval


def _format_transcript(messages: list[ChatMessage], user: User) -> str:
    speaker = {"user": user.displayName or "User", "bot": "Assistant"}
    lines = [f"{speaker.get(m.sender, m.sender)}: {m.content}".strip() for m in messages]
    transcript = "\n\n".join(lines)
    if len(transcript) > TRANSCRIPT_MAX_CHARS:
        transcript = f"{transcript[:TRANSCRIPT_MAX_CHARS]}\n\n[transcript truncated]"
    return transcript


async def escalate_to_ticket(
    db: AsyncSession, conversation_id: str, user: User
) -> EscalationResult:
    """Create a support ticket from a conversation. Idempotent per conversation."""
    conversation = await get_conversation(db, conversation_id, user)

    if conversation.escalatedTicketId:
        result = await db.execute(
            select(Ticket).where(Ticket.id == conversation.escalatedTicketId)
        )
        return EscalationResult(
            conversation=conversation,
            ticket=result.scalar_one(),
            already_escalated=True,
            bot_message=None,
        )

    messages = await list_messages(db, conversation_id, user)
    if not any(m.sender == "user" and m.content.strip() for m in messages):
        raise BadRequestError(
            "Ask the assistant something before escalating to a ticket"
        )

    transcript = _format_transcript(messages, user)
    suggestion = await suggest_ticket_fields(transcript)

    ticket = Ticket(
        subject=suggestion.subject
        if suggestion
        else fallback_subject([(m.sender, m.content) for m in messages]),
        description=f"Escalated from the AI assistant chat.\n\n{transcript}",
        status=TicketStatus.OPEN,
        category=suggestion.category if suggestion else None,
        department=user.department,
        createdById=user.id,
    )
    db.add(ticket)
    await db.flush()

    conversation.escalatedTicketId = ticket.id
    bot_message = ChatMessage(
        conversationId=conversation.id,
        sender="bot",
        content=(
            f'I\'ve created support ticket "{ticket.subject}" from this conversation. '
            "A support agent will follow up with you there."
        ),
    )
    db.add(bot_message)

    await db.commit()
    await db.refresh(conversation)
    await db.refresh(ticket)
    await db.refresh(bot_message)

    return EscalationResult(
        conversation=conversation,
        ticket=ticket,
        already_escalated=False,
        bot_message=bot_message,
    )
