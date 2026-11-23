from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.models import Abrangencia, Arbitro, Campeonato, Equipe, Federacao
from app.schemas import FederacaoCreate, FederacaoUpdate
from app.services.common import aplicar_parcial, commit, obter_ou_404


def listar(
    db: Session, *, nome: str | None = None, abrangencia: Abrangencia | None = None, skip: int = 0, limit: int = 50
) -> list[Federacao]:
    stmt = select(Federacao).order_by(Federacao.nome)
    if nome:
        stmt = stmt.where(Federacao.nome.ilike(f"%{nome}%") | Federacao.sigla.ilike(f"%{nome}%"))
    if abrangencia:
        stmt = stmt.where(Federacao.abrangencia == abrangencia)
    return list(db.scalars(stmt.offset(skip).limit(limit)))


def obter_detalhe(db: Session, federacao_id: int) -> Federacao:
    stmt = (
        select(Federacao)
        .where(Federacao.id == federacao_id)
        .options(
            selectinload(Federacao.equipes), selectinload(Federacao.arbitros), selectinload(Federacao.campeonatos)
        )
        .execution_options(populate_existing=True)  # sempre relê do banco (dados frescos)
    )
    federacao = db.scalar(stmt)
    if federacao is None:
        raise NotFoundError(f"Federação {federacao_id} não encontrado(a)")
    return federacao


def criar(db: Session, dados: FederacaoCreate) -> Federacao:
    if db.scalar(select(Federacao.id).where(Federacao.sigla == dados.sigla)):
        raise ConflictError("Já existe uma federação com essa sigla")
    if db.scalar(select(Federacao.id).where(Federacao.nome == dados.nome)):
        raise ConflictError("Já existe uma federação com esse nome")
    if dados.cnpj and db.scalar(select(Federacao.id).where(Federacao.cnpj == dados.cnpj)):
        raise ConflictError("Já existe uma federação com esse CNPJ")
    federacao = Federacao(**dados.model_dump())
    db.add(federacao)
    commit(db, "Federação já cadastrada")
    db.refresh(federacao)
    return federacao


def atualizar(db: Session, federacao_id: int, dados: FederacaoUpdate) -> Federacao:
    federacao = obter_ou_404(db, Federacao, federacao_id, "Federação")
    aplicar_parcial(federacao, dados.model_dump(exclude_unset=True))
    commit(db, "Já existe uma federação com esse nome ou sigla")
    db.refresh(federacao)
    return federacao


def remover(db: Session, federacao_id: int) -> None:
    federacao = obter_ou_404(db, Federacao, federacao_id, "Federação")
    if db.scalar(select(Campeonato.id).where(Campeonato.federacao_id == federacao_id).limit(1)):
        raise ConflictError("Federação organiza campeonatos; apague-os ou troque a organizadora antes")
    db.delete(federacao)  # equipes e árbitros ficam sem federação (ON DELETE SET NULL)
    commit(db)


# ---------- Vínculos 1:N  (Federação -> Equipes e Federação -> Árbitros) ----------
# As duas relações seguem a mesma regra, então usam os mesmos helpers.

def _vincular(db: Session, federacao_id: int, membro: Equipe | Arbitro, rotulo: str) -> Federacao:
    federacao = obter_ou_404(db, Federacao, federacao_id, "Federação")
    if membro.federacao_id == federacao.id:
        raise BusinessRuleError(f"{rotulo} já está vinculado(a) a esta federação")
    if membro.federacao_id is not None:
        raise ConflictError(f"{rotulo} está vinculado(a) a outra federação; desvincule primeiro")
    membro.federacao = federacao
    commit(db)
    return obter_detalhe(db, federacao_id)


def _desvincular(db: Session, federacao_id: int, membro: Equipe | Arbitro, rotulo: str) -> Federacao:
    obter_ou_404(db, Federacao, federacao_id, "Federação")
    if membro.federacao_id != federacao_id:
        raise BusinessRuleError(f"{rotulo} não está vinculado(a) a esta federação")
    membro.federacao = None
    commit(db)
    return obter_detalhe(db, federacao_id)


def filiar_equipe(db: Session, federacao_id: int, equipe_id: int) -> Federacao:
    return _vincular(db, federacao_id, obter_ou_404(db, Equipe, equipe_id, "Equipe"), "Equipe")


def desfiliar_equipe(db: Session, federacao_id: int, equipe_id: int) -> Federacao:
    return _desvincular(db, federacao_id, obter_ou_404(db, Equipe, equipe_id, "Equipe"), "Equipe")


def vincular_arbitro(db: Session, federacao_id: int, arbitro_id: int) -> Federacao:
    return _vincular(db, federacao_id, obter_ou_404(db, Arbitro, arbitro_id, "Árbitro"), "Árbitro")


def desvincular_arbitro(db: Session, federacao_id: int, arbitro_id: int) -> Federacao:
    return _desvincular(db, federacao_id, obter_ou_404(db, Arbitro, arbitro_id, "Árbitro"), "Árbitro")
