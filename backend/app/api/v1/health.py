from fastapi import APIRouter

from app.core.responses import success_response
from app.db.session import check_db_connection

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    db_ok = await check_db_connection()
    return success_response(
        {
            "status": "ok",
            "database": "connected" if db_ok else "disconnected",
        }
    )
