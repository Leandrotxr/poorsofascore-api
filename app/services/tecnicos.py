from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import ConflictError
from app.models import Tecnico
from app.schemas import TecnicoCreate, TecnicoUpdate
from app.services.common import aplicar_parcial, commit, obter_ou_404


def listar(
    db: Session, *, nome: str | None = None, sem_equipe: bool = False, skip: int = 0, limit: int = 50
) -> list[Tecnico]:
    stmt = select(Tecnico).options(joinedload(Tecnico.equipe)).order_by(Tecnico.nome)
    if nome:
        stmt = stmt.where(Tecnico.nome.ilike(f"%{nome}%"))
    if sem_equipe:
        stmt = stmt.where(Tecnico.equipe_id.is_(None))
    return list(db.scalars(stmt.offset(skip).limit(limit)))


def obter(db: Session, tecnico_id: int) -> Tecnico:
    return obter_ou_404(db, Tecnico, tecnico_id, "Técnico")


def criar(db: Session, dados: TecnicoCreate) -> Tecnico:
    if db.scalar(select(Tecnico.id).where(Tecnico.cpf == dados.cpf)):
        raise ConflictError("Já existe um técnico com esse CPF")
    tecnico = Tecnico(**dados.model_dump())
    db.add(tecnico)
    commit(db, "Já existe um técnico com esse CPF")
    db.refresh(tecnico)
    return tecnico


def atualizar(db: Session, tecnico_id: int, dados: TecnicoUpdate) -> Tecnico:
    tecnico = obter(db, tecnico_id)
    aplicar_parcial(tecnico, dados.model_dump(exclude_unset=True))
    commit(db)
    db.refresh(tecnico)
    return tecnico


def remover(db: Session, tecnico_id: int) -> None:
    db.delete(obter(db, tecnico_id))
    commit(db)
