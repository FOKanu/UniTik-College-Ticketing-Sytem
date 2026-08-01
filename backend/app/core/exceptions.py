class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400, details: object = None) -> None:
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class BadRequestError(AppError):
    def __init__(self, message: str, details: object = None) -> None:
        super().__init__(message, status_code=400, details=details)


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Unauthorized") -> None:
        super().__init__(message, status_code=401)


class ForbiddenError(AppError):
    def __init__(self, message: str = "Forbidden") -> None:
        super().__init__(message, status_code=403)


class NotFoundError(AppError):
    def __init__(self, message: str = "Not found") -> None:
        super().__init__(message, status_code=404)


class ConflictError(AppError):
    def __init__(self, message: str, details: object = None) -> None:
        super().__init__(message, status_code=409, details=details)
