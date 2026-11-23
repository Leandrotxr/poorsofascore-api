from typing import Annotated

from fastapi import Depends, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, NotAuthenticatedError
from app.core.seguranca import ler_token
from app.db.session import get_db
from app.models import PapelUsuario, Usuario

DbSession = Annotated[Session, Depends(get_db)]
Skip = Annotated[int, Query(ge=0, description="Quantos registros pular")]
Limit = Annotated[int, Query(ge=1, le=100, description="Máximo de registros por página")]

# auto_error=False: quem decide a resposta (401 no nosso formato) é obter_usuario.
_bearer = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def obter_usuario(db: DbSession, token: Annotated[str | None, Depends(_bearer)]) -> Usuario:
    if not token:
        raise NotAuthenticatedError("Faça login para alterar dados")
    usuario_id = ler_token(token)
    usuario = db.get(Usuario, usuario_id) if usuario_id is not None else None
    if usuario is None or not usuario.ativo:
        raise NotAuthenticatedError("Sessão inválida ou expirada; faça login de novo")
    return usuario


def exigir_admin(usuario: Annotated[Usuario, Depends(obter_usuario)]) -> Usuario:
    if usuario.papel != PapelUsuario.ADMIN:
        raise ForbiddenError("Apenas administradores podem fazer isso")
    return usuario


UsuarioAtual = Annotated[Usuario, Depends(obter_usuario)]
Admin = Annotated[Usuario, Depends(exigir_admin)]

# Para as rotas que ALTERAM dados: `@router.post(..., dependencies=ESCRITA)`.
# EDITOR e ADMIN podem escrever; a leitura (GET) continua pública.
ESCRITA = [Depends(obter_usuario)]
