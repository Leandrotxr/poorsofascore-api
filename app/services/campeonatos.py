from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.models import Campeonato, Equipe, Federacao
from app.schemas import CampeonatoCreate, CampeonatoUpdate
from app.services.common import aplicar_parcial, commit, obter_ou_404

_COM_RELACOES = (joinedload(Campeonato.federacao), selectinload(Campeonato.equipes))


def listar(
    db: Session,
    *,
    nome: str | None = None,
    temporada: int | None = None,
    federacao_id: int | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Campeonato]:
    stmt = select(Campeonato).options(*_COM_RELACOES).order_by(Campeonato.temporada.desc(), Campeonato.nome)
    if nome:
        stmt = stmt.where(Campeonato.nome.ilike(f"%{nome}%"))
    if temporada:
        stmt = stmt.where(Campeonato.temporada == temporada)
    if federacao_id:
        stmt = stmt.where(Campeonato.federacao_id == federacao_id)
    return list(db.scalars(stmt.offset(skip).limit(limit)))


def obter(db: Session, campeonato_id: int) -> Campeonato:
    stmt = (
        select(Campeonato)
        .where(Campeonato.id == campeonato_id)
        .options(*_COM_RELACOES)
        .execution_options(populate_existing=True)  # sempre relê do banco (dados frescos)
    )
    campeonato = db.scalar(stmt)
    if campeonato is None:
        raise NotFoundError(f"Campeonato {campeonato_id} não encontrado(a)")
    return campeonato


def _exigir_unico(db: Session, nome: str, temporada: int, ignorar_id: int | None = None) -> None:
    stmt = select(Campeonato.id).where(Campeonato.nome == nome, Campeonato.temporada == temporada)
    if ignorar_id is not None:
        stmt = stmt.where(Campeonato.id != ignorar_id)
    if db.scalar(stmt):
        raise ConflictError(f"Já existe o campeonato {nome} na temporada {temporada}")


def criar(db: Session, dados: CampeonatoCreate) -> Campeonato:
    obter_ou_404(db, Federacao, dados.federacao_id, "Federação")
    _exigir_unico(db, dados.nome, dados.temporada)
    campeonato = Campeonato(**dados.model_dump())
    db.add(campeonato)
    commit(db, "Campeonato já cadastrado nesta temporada")
    return obter(db, campeonato.id)


def atualizar(db: Session, campeonato_id: int, dados: CampeonatoUpdate) -> Campeonato:
    campeonato = obter(db, campeonato_id)
    mudancas = dados.model_dump(exclude_unset=True)
    if mudancas.get("federacao_id") is not None:
        obter_ou_404(db, Federacao, mudancas["federacao_id"], "Federação")
    elif "federacao_id" in mudancas:
        raise BusinessRuleError("A federação organizadora é obrigatória")

    aplicar_parcial(campeonato, mudancas)
    # Confere com os valores finais: o PATCH pode mandar só uma das datas.
    if campeonato.data_inicio and campeonato.data_fim and campeonato.data_fim < campeonato.data_inicio:
        db.rollback()
        raise BusinessRuleError("A data de fim não pode ser anterior à data de início")
    _exigir_unico(db, campeonato.nome, campeonato.temporada, ignorar_id=campeonato.id)

    commit(db, "Campeonato já cadastrado nesta temporada")
    return obter(db, campeonato_id)


def remover(db: Session, campeonato_id: int) -> None:
    db.delete(obter(db, campeonato_id))  # as inscrições somem junto (CASCADE); as equipes ficam
    commit(db)


# ---------- Relação N:N  Campeonato <-> Equipes ----------


def inscrever_equipe(db: Session, campeonato_id: int, equipe_id: int) -> Campeonato:
    campeonato = obter(db, campeonato_id)
    equipe = obter_ou_404(db, Equipe, equipe_id, "Equipe")
    if equipe in campeonato.equipes:
        raise BusinessRuleError("Equipe já está inscrita neste campeonato")
    campeonato.equipes.append(equipe)
    commit(db, "Equipe já está inscrita neste campeonato")
    return obter(db, campeonato_id)


def remover_equipe(db: Session, campeonato_id: int, equipe_id: int) -> Campeonato:
    campeonato = obter(db, campeonato_id)
    equipe = obter_ou_404(db, Equipe, equipe_id, "Equipe")
    if equipe not in campeonato.equipes:
        raise BusinessRuleError("Equipe não está inscrita neste campeonato")
    campeonato.equipes.remove(equipe)
    commit(db)
    return obter(db, campeonato_id)
