from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Erro de negócio base. As subclasses definem o status HTTP."""

    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT


class BusinessRuleError(AppError):
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT


class NotAuthenticatedError(AppError):
    """Sem token ou token inválido/vencido: o cliente precisa (re)fazer login."""

    status_code = status.HTTP_401_UNAUTHORIZED


class ForbiddenError(AppError):
    """Logado, mas sem permissão para a ação."""

    status_code = status.HTTP_403_FORBIDDEN


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        # O 401 avisa o esquema esperado (RFC 6750), como o próprio FastAPI faz.
        headers = {"WWW-Authenticate": "Bearer"} if isinstance(exc, NotAuthenticatedError) else None
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=headers)
