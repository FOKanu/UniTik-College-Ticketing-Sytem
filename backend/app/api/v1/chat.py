import json
from collections.abc import AsyncIterator
from typing import Any

from fastapi import APIRouter
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse

from app.ai import LLMUnavailableError, check_llm_health, stream_chat_completion
from app.core.deps import CurrentUser, DbSession
from app.core.responses import success_response
from app.db.session import async_session_factory
from app.schemas.chat import (
    ConversationResponse,
    EscalatedTicket,
    EscalateResponse,
    MessageCreate,
    MessageResponse,
)
from app.services import chat as chat_service

router = APIRouter(prefix="/chat", tags=["chat"])

SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    # Stops nginx buffering the stream into one lump.
    "X-Accel-Buffering": "no",
}


def _sse(event: str, data: Any) -> str:
    return f"event: {event}\ndata: {json.dumps(jsonable_encoder(data))}\n\n"


def _retrieval_payload(retrieval: chat_service.RetrievalBundle) -> dict:
    return {
        "citations": [c.model_dump() for c in retrieval.citations],
        "retrievalWeak": retrieval.retrieval_weak,
    }


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
    return success_response([MessageResponse.model_validate(m).model_dump() for m in messages])


@router.post("/conversations/{conversation_id}/messages")
async def send_message(db: DbSession, user: CurrentUser, conversation_id: str, body: MessageCreate):
    user_msg, bot_msg, retrieval = await chat_service.send_message(db, conversation_id, user, body)
    return success_response(
        {
            "userMessage": MessageResponse.model_validate(user_msg).model_dump(),
            "botMessage": MessageResponse.model_validate(bot_msg).model_dump(),
            **_retrieval_payload(retrieval),
        },
        status_code=201,
    )


@router.post("/conversations/{conversation_id}/messages/stream")
async def stream_message(
    db: DbSession, user: CurrentUser, conversation_id: str, body: MessageCreate
):
    """Token-by-token reply over SSE. Auth and ownership are checked up front."""
    user_msg, prompt, retrieval = await chat_service.start_user_turn(
        db, conversation_id, user, body
    )
    user_payload = MessageResponse.model_validate(user_msg).model_dump()
    retrieval_payload = _retrieval_payload(retrieval)

    async def event_stream() -> AsyncIterator[str]:
        yield _sse("start", {"userMessage": user_payload, **retrieval_payload})
        yield _sse("citations", retrieval_payload)

        parts: list[str] = []
        offline = False
        try:
            async for delta in stream_chat_completion(prompt, body.mode):
                parts.append(delta)
                yield _sse("token", {"delta": delta})
        except LLMUnavailableError as exc:
            offline = True
            yield _sse("error", {"message": str(exc)})

        reply = chat_service.LLM_OFFLINE_REPLY if offline else "".join(parts).strip()

        # The request-scoped session is already closed by the time the body
        # streams, so the reply is persisted on a session this generator owns.
        async with async_session_factory() as session:
            bot_msg = await chat_service.finish_bot_turn(session, conversation_id, reply)
            bot_payload = MessageResponse.model_validate(bot_msg).model_dump()

        yield _sse("done", {"botMessage": bot_payload, **retrieval_payload})

    return StreamingResponse(event_stream(), media_type="text/event-stream", headers=SSE_HEADERS)


@router.get("/health")
async def chat_llm_health():
    return success_response(await check_llm_health())


@router.post("/conversations/{conversation_id}/escalate")
async def escalate(db: DbSession, user: CurrentUser, conversation_id: str):
    result = await chat_service.escalate_to_ticket(db, conversation_id, user)
    payload = EscalateResponse(
        conversation=ConversationResponse.model_validate(result.conversation),
        ticketId=result.ticket.id,
        ticket=EscalatedTicket.model_validate(result.ticket),
        alreadyEscalated=result.already_escalated,
        botMessage=(
            MessageResponse.model_validate(result.bot_message) if result.bot_message else None
        ),
    )
    return success_response(payload.model_dump())
