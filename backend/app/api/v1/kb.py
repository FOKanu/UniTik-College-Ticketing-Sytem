from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.core.deps import DbSession, require_roles
from app.core.responses import success_response
from app.db.base import Role
from app.models import User
from app.schemas.kb import FaqCreate, FaqSearchRequest
from app.services import kb as kb_service

router = APIRouter(prefix="/kb", tags=["knowledge-base"])

StaffOrAdmin = Annotated[User, Depends(require_roles(Role.STAFF, Role.ADMIN))]
AdminOnly = Annotated[User, Depends(require_roles(Role.ADMIN))]


@router.get("/faq")
async def list_faq(db: DbSession):
    entries = await kb_service.list_faq(db)
    return success_response([kb_service.faq_to_response(e).model_dump() for e in entries])


@router.get("/faq/{faq_id}")
async def get_faq(db: DbSession, faq_id: str):
    entry = await kb_service.get_faq(db, faq_id)
    return success_response(kb_service.faq_to_response(entry).model_dump())


@router.post("/faq")
async def create_faq(
    db: DbSession,
    body: FaqCreate,
    user: StaffOrAdmin,
):
    entry = await kb_service.create_faq(db, body, user=user)
    return success_response(kb_service.faq_to_response(entry).model_dump(), status_code=201)


@router.post("/search")
async def search_faq(db: DbSession, body: FaqSearchRequest):
    results = await kb_service.search_faq(db, body.query, body.limit)
    return success_response([r.model_dump() for r in results])


@router.post("/admin/reembed")
async def reembed_faq(
    db: DbSession,
    _user: AdminOnly,
    missing: Annotated[bool, Query()] = False,
):
    """Enqueue embedding jobs for FAQ entries (worker must be running)."""
    enqueued = await kb_service.enqueue_reembed(db, missing_only=missing)
    await db.commit()
    return success_response({"enqueued": enqueued})
