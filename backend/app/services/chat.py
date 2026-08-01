from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.db.base import TicketStatus
from app.models import ChatConversation, ChatMessage, Ticket, User
from app.schemas.chat import MessageCreate


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


async def send_message(
    db: AsyncSession, conversation_id: str, user: User, data: MessageCreate
) -> tuple[ChatMessage, ChatMessage]:
    conversation = await get_conversation(db, conversation_id, user)
    user_message = ChatMessage(
        conversationId=conversation.id,
        sender="user",
        content=data.content,
    )
    db.add(user_message)
    bot_message = ChatMessage(
        conversationId=conversation.id,
        sender="bot",
        content=(
            "Thanks for your message. A support agent can help if you escalate this "
            "conversation to a ticket."
        ),
    )
    db.add(bot_message)
    await db.commit()
    await db.refresh(user_message)
    await db.refresh(bot_message)
    return user_message, bot_message


async def escalate_to_ticket(
    db: AsyncSession, conversation_id: str, user: User
) -> tuple[ChatConversation, Ticket]:
    conversation = await get_conversation(db, conversation_id, user)
    if conversation.escalatedTicketId:
        result = await db.execute(select(Ticket).where(Ticket.id == conversation.escalatedTicketId))
        ticket = result.scalar_one()
        return conversation, ticket

    messages = await list_messages(db, conversation_id, user)
    summary = "\n".join(f"{m.sender}: {m.content}" for m in messages[-10:])
    ticket = Ticket(
        subject="Escalated from chat",
        description=summary or "Escalated chat conversation",
        status=TicketStatus.OPEN,
        department=user.department,
        createdById=user.id,
    )
    db.add(ticket)
    await db.flush()
    conversation.escalatedTicketId = ticket.id
    await db.commit()
    await db.refresh(conversation)
    await db.refresh(ticket)
    return conversation, ticket
