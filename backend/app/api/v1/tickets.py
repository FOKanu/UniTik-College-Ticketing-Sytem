from fastapi import APIRouter, File, UploadFile
from fastapi.responses import FileResponse

from app.core.deps import CurrentUser, DbSession
from app.core.responses import success_response
from app.schemas.tickets import CommentCreate, TicketCreate, TicketUpdate
from app.services import attachments as attachment_service
from app.services import tickets as ticket_service

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("")
async def list_tickets(db: DbSession, user: CurrentUser):
    tickets = await ticket_service.list_tickets(db, user)
    return success_response([ticket_service.ticket_to_response(t).model_dump() for t in tickets])


@router.post("")
async def create_ticket(db: DbSession, user: CurrentUser, body: TicketCreate):
    ticket = await ticket_service.create_ticket(db, user, body)
    return success_response(ticket_service.ticket_to_response(ticket).model_dump(), status_code=201)


@router.get("/{ticket_id}")
async def get_ticket(db: DbSession, user: CurrentUser, ticket_id: str):
    ticket = await ticket_service.get_ticket(db, ticket_id, user)
    return success_response(ticket_service.ticket_to_response(ticket).model_dump())


@router.patch("/{ticket_id}")
async def update_ticket(db: DbSession, user: CurrentUser, ticket_id: str, body: TicketUpdate):
    ticket = await ticket_service.update_ticket(db, ticket_id, user, body)
    return success_response(ticket_service.ticket_to_response(ticket).model_dump())


@router.get("/{ticket_id}/comments")
async def list_comments(db: DbSession, user: CurrentUser, ticket_id: str):
    comments = await ticket_service.list_comments(db, ticket_id, user)
    return success_response([ticket_service.comment_to_response(c).model_dump() for c in comments])


@router.post("/{ticket_id}/comments")
async def add_comment(db: DbSession, user: CurrentUser, ticket_id: str, body: CommentCreate):
    comment = await ticket_service.add_comment(db, ticket_id, user, body)
    return success_response(
        ticket_service.comment_to_response(comment).model_dump(), status_code=201
    )


@router.get("/{ticket_id}/status-history")
async def list_status_history(db: DbSession, user: CurrentUser, ticket_id: str):
    rows = await ticket_service.list_status_history(db, ticket_id, user)
    return success_response(
        [ticket_service.status_history_to_response(r).model_dump() for r in rows]
    )


@router.get("/{ticket_id}/attachments")
async def list_attachments(db: DbSession, user: CurrentUser, ticket_id: str):
    items = await attachment_service.list_attachments(db, ticket_id, user)
    return success_response(
        [attachment_service.attachment_to_response(a).model_dump() for a in items]
    )


@router.post("/{ticket_id}/attachments")
async def upload_attachment(
    db: DbSession,
    user: CurrentUser,
    ticket_id: str,
    file: UploadFile = File(...),
):
    attachment = await attachment_service.create_attachment(db, ticket_id, user, file)
    return success_response(
        attachment_service.attachment_to_response(attachment).model_dump(),
        status_code=201,
    )


@router.get("/{ticket_id}/attachments/{attachment_id}")
async def download_attachment(
    db: DbSession, user: CurrentUser, ticket_id: str, attachment_id: str
):
    attachment = await attachment_service.get_attachment(
        db, ticket_id, attachment_id, user
    )
    path = attachment_service.resolve_download_path(attachment)
    response = attachment_service.attachment_to_response(attachment)
    return FileResponse(
        path,
        filename=response.name,
        media_type="application/octet-stream",
    )


@router.delete("/{ticket_id}/attachments/{attachment_id}")
async def delete_attachment(
    db: DbSession, user: CurrentUser, ticket_id: str, attachment_id: str
):
    await attachment_service.delete_attachment(db, ticket_id, attachment_id, user)
    return success_response({"deleted": True})
