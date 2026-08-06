"""Outbound email providers (console for local; SMTP when SMTP_HOST is set)."""

from __future__ import annotations

import asyncio
import logging
import smtplib
from email.message import EmailMessage
from typing import Protocol

from app.core.config import Settings, get_settings

logger = logging.getLogger("app.email")


class EmailProvider(Protocol):
    async def send(self, *, to: str, subject: str, body: str) -> None: ...


class ConsoleEmailProvider:
    """Log messages instead of sending — default when SMTP is not configured."""

    async def send(self, *, to: str, subject: str, body: str) -> None:
        logger.info("email to=%s subject=%r body=%r", to, subject, body)


class SmtpEmailProvider:
    """Send plain-text mail via stdlib smtplib (runs in a thread)."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def _send_sync(self, *, to: str, subject: str, body: str) -> None:
        message = EmailMessage()
        message["From"] = self._settings.smtp_from
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)

        with smtplib.SMTP(self._settings.smtp_host, self._settings.smtp_port, timeout=30) as smtp:
            if self._settings.smtp_use_tls:
                smtp.starttls()
            if self._settings.smtp_user:
                smtp.login(self._settings.smtp_user, self._settings.smtp_password)
            smtp.send_message(message)

    async def send(self, *, to: str, subject: str, body: str) -> None:
        await asyncio.to_thread(self._send_sync, to=to, subject=subject, body=body)


def get_email_provider(settings: Settings | None = None) -> EmailProvider:
    cfg = settings or get_settings()
    if not (cfg.smtp_host or "").strip():
        return ConsoleEmailProvider()
    return SmtpEmailProvider(cfg)
