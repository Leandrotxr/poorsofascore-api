from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models import PapelUsuario
from app.schemas.saida import CONFIG_SAIDA

SENHA_MINIMA = 8


def _minusculo(email: str | None) -> str | None:
    return email.lower() if email else email


class UsuarioCreate(BaseModel):
    email: EmailStr
    nome: str = Field(min_length=2, max_length=120)
    senha: str = Field(min_length=SENHA_MINIMA, max_length=128)
    papel: PapelUsuario = PapelUsuario.EDITOR

    _email = field_validator("email")(_minusculo)


class UsuarioUpdate(BaseModel):
    """PATCH (só ADMIN). O e-mail não muda; para trocar, crie outro usuário."""

    nome: str | None = Field(default=None, min_length=2, max_length=120)
    senha: str | None = Field(default=None, min_length=SENHA_MINIMA, max_length=128)
    papel: PapelUsuario | None = None
    ativo: bool | None = None


class TrocaDeSenha(BaseModel):
    """Qualquer usuário logado troca a própria senha (precisa confirmar a atual)."""

    senha_atual: str
    nova_senha: str = Field(min_length=SENHA_MINIMA, max_length=128)


class UsuarioOut(BaseModel):
    model_config = CONFIG_SAIDA
    id: int
    email: str
    nome: str
    papel: PapelUsuario
    ativo: bool


class Token(BaseModel):
    """Resposta do login, no formato do OAuth2 (o /docs usa para o botão Authorize)."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int = Field(description="Segundos até o token vencer")
    usuario: UsuarioOut
