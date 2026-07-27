from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.core.responses import success_response
from app.schemas.chat import ConversationResponse, MessageCreate, MessageResponse
from app.services import chat as chat_service

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/conversations")
async def create_conversation(db: DbSession, user: CurrentUser):
    conversation = await chat_service.create_conversation(db, user)
    return success_response(
        ConversationResponse.model_validate(conversation).model_dump(), status_code=201
    )


@router.get("/conversations")
async def list_conversations(db: DbSession, user: CurrentUser):
    conversations = await chat_service.list_conversations(db, user)
    return success_response(
        [ConversationResponse.model_validate(c).model_dump() for c in conversations]
    )


@router.get("/conversations/{conversation_id}/messages")
async def list_messages(db: DbSession, user: CurrentUser, conversation_id: str):
    messages = await chat_service.list_messages(db, conversation_id, user)
    return success_response(
        [MessageResponse.model_validate(m).model_dump() for m in messages]
    )


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    db: DbSession, user: CurrentUser, conversation_id: str, body: MessageCreate
):
    user_msg, bot_msg = await chat_service.send_message(db, conversation_id, user, body)
    return success_response(
        {
            "userMessage": MessageResponse.model_validate(user_msg).model_dump(),
            "botMessage": MessageResponse.model_validate(bot_msg).model_dump(),
        },
        status_code=201,
    )


@router.post("/conversations/{conversation_id}/escalate")
async def escalate(db: DbSession, user: CurrentUser, conversation_id: str):
    conversation, ticket = await chat_service.escalate_to_ticket(db, conversation_id, user)
    return success_response(
        {
            "conversation": ConversationResponse.model_validate(conversation).model_dump(),
            "ticketId": ticket.id,
        }
    )
