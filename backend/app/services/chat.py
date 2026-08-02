import logging
from dataclasses import dataclass

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import LLMUnavailableError, chat_completion
from app.ai.client import build_messages
from app.ai.triage import fallback_subject, suggest_ticket_fields
from app.core.exceptions import BadRequestError, ForbiddenError, NotFoundError
from app.db.base import TicketStatus
from app.models import ChatConversation, ChatMessage, Ticket, User
from app.schemas.chat import MessageCreate

logger = logging.getLogger(__name__)

# How many prior turns to replay as context. Keeps prompts bounded on an 8B model.
HISTORY_LIMIT = 20

# Ticket descriptions embed the transcript, so cap what one chat can write.
TRANSCRIPT_MAX_CHARS = 20_000

LLM_OFFLINE_REPLY = (
    "I can't reach the AI assistant right now. A support agent can help if you "
    "escalate this conversation to a ticket."
)


@dataclass
class EscalationResult:
    conversation: ChatConversation
    ticket: Ticket
    already_escalated: bool
    bot_message: ChatMessage | None


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


async def start_user_turn(
    db: AsyncSession, conversation_id: str, user: User, data: MessageCreate
) -> tuple[ChatMessage, list[dict[str, str]]]:
    """Persist the user's message and build the prompt the model will answer."""
    conversation = await get_conversation(db, conversation_id, user)
    user_message = ChatMessage(
        conversationId=conversation.id,
        sender="user",
        content=data.content,
    )
    db.add(user_message)
    await db.commit()
    await db.refresh(user_message)

    history = await _recent_history(db, conversation.id)
    return user_message, build_messages(history, data.mode)


async def finish_bot_turn(db: AsyncSession, conversation_id: str, content: str) -> ChatMessage:
    bot_message = ChatMessage(
        conversationId=conversation_id,
        sender="bot",
        content=content or LLM_OFFLINE_REPLY,
    )
    db.add(bot_message)
    await db.commit()
    await db.refresh(bot_message)
    return bot_message


async def send_message(
    db: AsyncSession, conversation_id: str, user: User, data: MessageCreate
) -> tuple[ChatMessage, ChatMessage]:
    user_message, prompt = await start_user_turn(db, conversation_id, user, data)

    try:
        reply = await chat_completion(prompt, data.mode)
    except LLMUnavailableError as exc:
        # A dead model server must not lose the user's message or 500 the request.
        logger.warning("Falling back to offline reply: %s", exc)
        reply = LLM_OFFLINE_REPLY

    bot_message = await finish_bot_turn(db, conversation_id, reply)
    return user_message, bot_message


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
        result = await db.execute(select(Ticket).where(Ticket.id == conversation.escalatedTicketId))
        return EscalationResult(
            conversation=conversation,
            ticket=result.scalar_one(),
            already_escalated=True,
            bot_message=None,
        )

    messages = await list_messages(db, conversation_id, user)
    if not any(m.sender == "user" and m.content.strip() for m in messages):
        raise BadRequestError("Ask the assistant something before escalating to a ticket")

    transcript = _format_transcript(messages, user)
    suggestion = await suggest_ticket_fields(transcript)

    ticket = Ticket(
        subject=suggestion.subject if suggestion else fallback_subject(
            [(m.sender, m.content) for m in messages]
        ),
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
