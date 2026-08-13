from fastapi import APIRouter

from app.api.v1 import auth, chat, health, kb, notifications, tickets, users

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(tickets.router)
api_router.include_router(chat.router)
api_router.include_router(kb.router)
api_router.include_router(users.router)
api_router.include_router(notifications.router)
