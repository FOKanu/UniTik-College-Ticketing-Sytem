"""Isolated AI boundary — see docs/architecture/README.md.

Nothing outside this package talks to a model provider directly.
"""

from app.ai.client import (
    LLMUnavailableError,
    chat_completion,
    check_llm_health,
    create_embedding,
    stream_chat_completion,
)
from app.ai.llm_config import LLMProvider, get_llm_settings

__all__ = [
    "LLMProvider",
    "LLMUnavailableError",
    "chat_completion",
    "check_llm_health",
    "create_embedding",
    "get_llm_settings",
    "stream_chat_completion",
]
