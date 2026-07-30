from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.core.responses import success_response
from app.schemas.tickets import CommentCreate, TicketCreate, TicketUpdate
from app.services import tickets as ticket_service

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("")
async def list_tickets(db: DbSession, user: CurrentUser):
    tickets = await ticket_service.list_tickets(db, user)
    return success_response(
        [ticket_service.ticket_to_response(t).model_dump(mode="json") for t in tickets]
    )


@router.post("")
async def create_ticket(db: DbSession, user: CurrentUser, body: TicketCreate):
    ticket = await ticket_service.create_ticket(db, user, body)
    return success_response(
        ticket_service.ticket_to_response(ticket).model_dump(mode="json"), status_code=201
    )


@router.get("/{ticket_id}")
async def get_ticket(db: DbSession, user: CurrentUser, ticket_id: str):
    ticket = await ticket_service.get_ticket(db, ticket_id, user)
    return success_response(ticket_service.ticket_to_response(ticket).model_dump(mode="json"))


@router.patch("/{ticket_id}")
async def update_ticket(
    db: DbSession, user: CurrentUser, ticket_id: str, body: TicketUpdate
):
    ticket = await ticket_service.update_ticket(db, ticket_id, user, body)
    return success_response(ticket_service.ticket_to_response(ticket).model_dump(mode="json"))


@router.get("/{ticket_id}/comments")
async def list_comments(db: DbSession, user: CurrentUser, ticket_id: str):
    comments = await ticket_service.list_comments(db, ticket_id, user)
    return success_response(
        [ticket_service.comment_to_response(c).model_dump(mode="json") for c in comments]
    )


@router.post("/{ticket_id}/comments")
async def add_comment(
    db: DbSession, user: CurrentUser, ticket_id: str, body: CommentCreate
):
    comment = await ticket_service.add_comment(db, ticket_id, user, body)
    return success_response(
        ticket_service.comment_to_response(comment).model_dump(mode="json"), status_code=201
    )
