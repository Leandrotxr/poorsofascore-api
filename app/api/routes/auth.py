from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from app.api.deps import Admin, DbSession, UsuarioAtual
from app.core.seguranca import criar_token
from app.schemas import Token, TrocaDeSenha, UsuarioCreate, UsuarioOut, UsuarioUpdate
from app.services import usuarios as service

router = APIRouter(tags=["Acesso"])


@router.post("/auth/login", response_model=Token)
def login(db: DbSession, form: Annotated[OAuth2PasswordRequestForm, Depends()]):
    """
    Troca e-mail e senha por um token. Envie como formulário (`username` = e-mail, `password`).
    Depois mande o token no cabeçalho `Authorization: Bearer <token>` nas rotas que alteram dados.
    """
    usuario = service.autenticar(db, form.username, form.password)
    token, expira = criar_token(usuario.id)
    return Token(access_token=token, expires_in=expira, usuario=UsuarioOut.model_validate(usuario))


@router.get("/auth/eu", response_model=UsuarioOut)
def quem_sou_eu(usuario: UsuarioAtual):
    """Usuário dono do token (o front usa para saber se a sessão ainda vale)."""
    return usuario


@router.put("/auth/eu/senha", status_code=status.HTTP_204_NO_CONTENT)
def trocar_minha_senha(dados: TrocaDeSenha, db: DbSession, usuario: UsuarioAtual):
    """Troca a própria senha. O token atual continua valendo até vencer."""
    service.trocar_senha(db, usuario, dados)


# ---- Gestão de usuários (só ADMIN) ----


@router.get("/usuarios", response_model=list[UsuarioOut])
def listar_usuarios(db: DbSession, _: Admin):
    return service.listar(db)


@router.post("/usuarios", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def criar_usuario(dados: UsuarioCreate, db: DbSession, _: Admin):
    return service.criar(db, dados)


@router.patch("/usuarios/{usuario_id}", response_model=UsuarioOut)
def atualizar_usuario(usuario_id: int, dados: UsuarioUpdate, db: DbSession, admin: Admin):
    """Muda nome, senha, papel ou desativa. Não deixa o sistema sem nenhum ADMIN ativo
    e não deixa o admin desativar a própria conta."""
    return service.atualizar(db, usuario_id, dados, admin)


@router.delete("/usuarios/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_usuario(usuario_id: int, db: DbSession, admin: Admin):
    """Não permite excluir a própria conta nem o último ADMIN ativo."""
    service.remover(db, usuario_id, admin)
