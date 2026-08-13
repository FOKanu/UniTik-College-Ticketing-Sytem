from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.core.responses import success_response
from app.services import notifications as notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(db: DbSession, user: CurrentUser):
    rows = await notification_service.list_for_user(db, user)
    return success_response(
        [notification_service.to_response(r).model_dump() for r in rows]
    )


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    db: DbSession, user: CurrentUser, notification_id: str
):
    row = await notification_service.mark_read(db, notification_id, user)
    return success_response(notification_service.to_response(row).model_dump())


@router.post("/mark-all-read")
async def mark_all_notifications_read(db: DbSession, user: CurrentUser):
    updated = await notification_service.mark_all_read(db, user)
    return success_response({"updated": updated})
