from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.exceptions import BusinessRuleError, ConflictError, NotAuthenticatedError
from app.core.seguranca import HASH_FALSO, conferir_senha, gerar_hash
from app.models import PapelUsuario, Usuario
from app.schemas import TrocaDeSenha, UsuarioCreate, UsuarioUpdate
from app.services.common import aplicar_parcial, commit, obter_ou_404

CREDENCIAIS_INVALIDAS = "E-mail ou senha incorretos"


def autenticar(db: Session, email: str, senha: str) -> Usuario:
    usuario = db.scalar(select(Usuario).where(Usuario.email == email.strip().lower()))
    if usuario is None:
        conferir_senha(senha, HASH_FALSO)  # mesmo custo: não revela se o e-mail existe
        raise NotAuthenticatedError(CREDENCIAIS_INVALIDAS)
    if not conferir_senha(senha, usuario.senha_hash):
        raise NotAuthenticatedError(CREDENCIAIS_INVALIDAS)
    if not usuario.ativo:
        raise NotAuthenticatedError("Usuário desativado")
    return usuario


def listar(db: Session) -> list[Usuario]:
    return list(db.scalars(select(Usuario).order_by(Usuario.nome)))


def criar(db: Session, dados: UsuarioCreate) -> Usuario:
    if db.scalar(select(Usuario.id).where(Usuario.email == dados.email)):
        raise ConflictError("Já existe um usuário com esse e-mail")
    usuario = Usuario(email=dados.email, nome=dados.nome, papel=dados.papel, senha_hash=gerar_hash(dados.senha))
    db.add(usuario)
    commit(db, "Já existe um usuário com esse e-mail")
    db.refresh(usuario)
    return usuario


def _admins_ativos(db: Session) -> int:
    return db.scalar(select(func.count()).where(Usuario.papel == PapelUsuario.ADMIN, Usuario.ativo.is_(True))) or 0


def _deixaria_sem_admin(db: Session, usuario: Usuario) -> bool:
    return usuario.papel == PapelUsuario.ADMIN and usuario.ativo and _admins_ativos(db) <= 1


def atualizar(db: Session, usuario_id: int, dados: UsuarioUpdate, autor: Usuario) -> Usuario:
    usuario = obter_ou_404(db, Usuario, usuario_id, "Usuário")
    mudancas = dados.model_dump(exclude_unset=True, exclude={"senha"})
    if usuario.id == autor.id and mudancas.get("ativo") is False:
        raise BusinessRuleError("Você não pode desativar a própria conta")
    perde_admin = mudancas.get("papel", usuario.papel) != PapelUsuario.ADMIN or mudancas.get("ativo") is False
    if perde_admin and _deixaria_sem_admin(db, usuario):
        raise BusinessRuleError("Este é o único administrador ativo; promova outro antes")
    aplicar_parcial(usuario, mudancas)
    if dados.senha:
        usuario.senha_hash = gerar_hash(dados.senha)
    commit(db)
    db.refresh(usuario)
    return usuario


def remover(db: Session, usuario_id: int, autor: Usuario) -> None:
    usuario = obter_ou_404(db, Usuario, usuario_id, "Usuário")
    if usuario.id == autor.id:
        raise BusinessRuleError("Você não pode excluir a própria conta")
    if _deixaria_sem_admin(db, usuario):
        raise BusinessRuleError("Este é o único administrador ativo; promova outro antes")
    db.delete(usuario)
    commit(db)


def trocar_senha(db: Session, usuario: Usuario, dados: TrocaDeSenha) -> None:
    if not conferir_senha(dados.senha_atual, usuario.senha_hash):
        raise BusinessRuleError("A senha atual está incorreta")
    usuario.senha_hash = gerar_hash(dados.nova_senha)
    commit(db)
