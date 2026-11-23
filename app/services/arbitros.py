from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import ConflictError
from app.models import Arbitro, FuncaoArbitro
from app.schemas import ArbitroCreate, ArbitroUpdate
from app.services.common import Pagina, aplicar_parcial, commit, obter_ou_404, paginar


def listar(
    db: Session,
    *,
    nome: str | None = None,
    funcao: FuncaoArbitro | None = None,
    federacao_id: int | None = None,
    sem_federacao: bool = False,
    skip: int = 0,
    limit: int = 50,
) -> Pagina[Arbitro]:
    stmt = select(Arbitro)
    if nome:
        stmt = stmt.where(Arbitro.nome.ilike(f"%{nome}%"))
    if funcao:
        stmt = stmt.where(Arbitro.funcao == funcao)
    if federacao_id:
        stmt = stmt.where(Arbitro.federacao_id == federacao_id)
    if sem_federacao:
        stmt = stmt.where(Arbitro.federacao_id.is_(None))
    return paginar(db, stmt, skip=skip, limit=limit, ordem=[Arbitro.nome], opcoes=[joinedload(Arbitro.federacao)])


def obter(db: Session, arbitro_id: int) -> Arbitro:
    return obter_ou_404(db, Arbitro, arbitro_id, "Árbitro")


def criar(db: Session, dados: ArbitroCreate) -> Arbitro:
    if db.scalar(select(Arbitro.id).where(Arbitro.cpf == dados.cpf)):
        raise ConflictError("Já existe um árbitro com esse CPF")
    arbitro = Arbitro(**dados.model_dump())
    db.add(arbitro)
    commit(db, "Já existe um árbitro com esse CPF")
    db.refresh(arbitro)
    return arbitro


def atualizar(db: Session, arbitro_id: int, dados: ArbitroUpdate) -> Arbitro:
    arbitro = obter(db, arbitro_id)
    aplicar_parcial(arbitro, dados.model_dump(exclude_unset=True))
    commit(db)
    db.refresh(arbitro)
    return arbitro


def remover(db: Session, arbitro_id: int) -> None:
    db.delete(obter(db, arbitro_id))
    commit(db)
