"""Local filesystem storage for ticket attachments (S3/MinIO deferred)."""

from __future__ import annotations

import re
import uuid
from pathlib import Path

from app.core.config import get_settings
from app.core.exceptions import BadRequestError

# Keep the prototype focused on common support-ticket evidence types.
ALLOWED_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".pdf",
    ".txt",
    ".doc",
    ".docx",
    ".csv",
}

_SAFE_NAME = re.compile(r"[^A-Za-z0-9._-]+")


def upload_root() -> Path:
    root = Path(get_settings().upload_dir)
    if not root.is_absolute():
        root = Path.cwd() / root
    root.mkdir(parents=True, exist_ok=True)
    return root.resolve()


def sanitize_filename(name: str) -> str:
    base = Path(name or "upload").name
    cleaned = _SAFE_NAME.sub("_", base).strip("._") or "upload"
    return cleaned[:180]


def extension_of(filename: str) -> str:
    return Path(filename).suffix.lower()


def validate_upload(filename: str, size_bytes: int) -> str:
    settings = get_settings()
    if size_bytes <= 0:
        raise BadRequestError("Empty uploads are not allowed")
    if size_bytes > settings.max_upload_bytes:
        raise BadRequestError(
            f"File exceeds the {settings.max_upload_mb} MB upload limit"
        )
    ext = extension_of(filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise BadRequestError(
            f"Unsupported file type '{ext or '(none)'}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    return ext.lstrip(".")


def save_ticket_bytes(
    ticket_id: str, filename: str, payload: bytes
) -> tuple[str, str]:
    """Persist bytes under uploads/attachments/{ticket_id}/… → (rel_path, file_type)."""
    original = sanitize_filename(filename)
    file_type = validate_upload(original, len(payload))
    rel_dir = Path("attachments") / ticket_id
    abs_dir = upload_root() / rel_dir
    abs_dir.mkdir(parents=True, exist_ok=True)

    stored_name = f"{uuid.uuid4().hex}_{original}"
    abs_path = abs_dir / stored_name
    abs_path.write_bytes(payload)

    return str(rel_dir / stored_name), file_type


def absolute_path(relative_path: str) -> Path:
    """Resolve a stored relative path and reject escapes outside the upload root."""
    root = upload_root()
    candidate = (root / relative_path).resolve()
    try:
        candidate.relative_to(root)
    except ValueError as exc:
        raise BadRequestError("Invalid attachment path") from exc
    return candidate


def delete_file(relative_path: str) -> None:
    path = absolute_path(relative_path)
    if path.is_file():
        path.unlink()
