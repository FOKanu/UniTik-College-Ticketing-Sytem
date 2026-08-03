from pathlib import Path

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models import Attachment, User
from app.schemas.tickets import AttachmentResponse
from app.services import storage as storage_service
from app.services import tickets as ticket_service


async def list_attachments(
    db: AsyncSession, ticket_id: str, user: User
) -> list[Attachment]:
    await ticket_service.get_ticket(db, ticket_id, user)
    result = await db.execute(
        select(Attachment)
        .where(Attachment.ticketId == ticket_id)
        .order_by(Attachment.uploadedAt.asc())
    )
    return list(result.scalars().all())


async def get_attachment(
    db: AsyncSession, ticket_id: str, attachment_id: str, user: User
) -> Attachment:
    await ticket_service.get_ticket(db, ticket_id, user)
    result = await db.execute(
        select(Attachment).where(
            Attachment.id == attachment_id, Attachment.ticketId == ticket_id
        )
    )
    attachment = result.scalar_one_or_none()
    if not attachment:
        raise NotFoundError("Attachment not found")
    return attachment


async def create_attachment(
    db: AsyncSession, ticket_id: str, user: User, upload: UploadFile
) -> Attachment:
    # Any principal who can view the ticket may attach evidence (student on
    # their own ticket; staff/admin on any).
    await ticket_service.get_ticket(db, ticket_id, user)

    payload = await upload.read()
    relative_path, file_type = storage_service.save_ticket_bytes(
        ticket_id, upload.filename or "upload", payload
    )

    attachment = Attachment(
        ticketId=ticket_id,
        filePath=relative_path,
        fileType=file_type,
        fileSizeBytes=len(payload),
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    return attachment


async def delete_attachment(
    db: AsyncSession, ticket_id: str, attachment_id: str, user: User
) -> None:
    attachment = await get_attachment(db, ticket_id, attachment_id, user)
    relative_path = attachment.filePath
    await db.delete(attachment)
    await db.commit()
    storage_service.delete_file(relative_path)


def attachment_to_response(attachment: Attachment) -> AttachmentResponse:
    name = Path(attachment.filePath).name
    # Strip the uuid_ prefix we add on upload when present.
    if "_" in name and len(name.split("_", 1)[0]) == 32:
        name = name.split("_", 1)[1]
    return AttachmentResponse(
        id=attachment.id,
        ticketId=attachment.ticketId,
        name=name,
        fileType=attachment.fileType,
        fileSizeBytes=attachment.fileSizeBytes,
        uploadedAt=attachment.uploadedAt,
    )


def resolve_download_path(attachment: Attachment) -> Path:
    path = storage_service.absolute_path(attachment.filePath)
    if not path.is_file():
        raise NotFoundError("Attachment file missing on disk")
    return path
