from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.responses import error_response, success_response

API_PREFIX = "/api/v1"


def create_app() -> FastAPI:
    settings = get_settings()
    local_frontend_origins = {
        settings.cors_origin,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    }
    app = FastAPI(
        title="University Support Ticketing System",
        version="0.2.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=sorted(local_frontend_origins),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(AppError)
    async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
        return error_response(exc.message, status_code=exc.status_code, details=exc.details)

    @app.exception_handler(Exception)
    async def unhandled_error_handler(_request: Request, exc: Exception) -> JSONResponse:
        if settings.is_development:
            return error_response(str(exc), status_code=500)
        return error_response("Internal server error", status_code=500)

    @app.get("/health")
    async def root_health():
        from app.db.session import check_db_connection

        db_ok = await check_db_connection()
        return success_response(
            {"status": "ok", "database": "connected" if db_ok else "disconnected"}
        )

    app.include_router(api_router, prefix=API_PREFIX)
    return app


app = create_app()
