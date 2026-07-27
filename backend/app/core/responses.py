from typing import Any, Generic, TypeVar

from fastapi import status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import BaseModel

T = TypeVar("T")


class ApiSuccessBody(BaseModel, Generic[T]):
    success: bool = True
    data: T
    meta: dict[str, Any] | None = None


class ApiErrorBody(BaseModel):
    success: bool = False
    error: dict[str, Any]


def success_response(
    data: Any,
    status_code: int = status.HTTP_200_OK,
    meta: dict[str, Any] | None = None,
) -> JSONResponse:
    body: dict[str, Any] = {"success": True, "data": jsonable_encoder(data)}
    if meta:
        body["meta"] = jsonable_encoder(meta)
    return JSONResponse(status_code=status_code, content=body)


def error_response(
    message: str,
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
    details: Any = None,
) -> JSONResponse:
    error: dict[str, Any] = {"message": message}
    if details is not None:
        error["details"] = jsonable_encoder(details)
    return JSONResponse(status_code=status_code, content={"success": False, "error": error})
