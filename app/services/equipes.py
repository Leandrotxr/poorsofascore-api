from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.models import Equipe, Jogador, Tecnico
from app.schemas import EquipeCreate, EquipeUpdate
from app.services.common import Pagina, aplicar_parcial, commit, obter_ou_404, paginar

_COM_RELACOES = (
    joinedload(Equipe.federacao),
    selectinload(Equipe.jogadores),
    selectinload(Equipe.tecnico),
    selectinload(Equipe.campeonatos),
)


def listar(
    db: Session,
    *,
    nome: str | None = None,
    federacao_id: int | None = None,
    sem_federacao: bool = False,
    sem_tecnico: bool = False,
    skip: int = 0,
    limit: int = 50,
) -> Pagina[Equipe]:
    stmt = select(Equipe)
    if nome:
        stmt = stmt.where(Equipe.nome.ilike(f"%{nome}%"))  # parâmetro seguro, sem SQL injection
    if federacao_id:
        stmt = stmt.where(Equipe.federacao_id == federacao_id)
    if sem_federacao:
        stmt = stmt.where(Equipe.federacao_id.is_(None))
    if sem_tecnico:
        stmt = stmt.where(~Equipe.tecnico.has())
    # A lista já traz técnico, elenco e campeonatos: os cards não precisam de uma chamada por equipe.
    return paginar(db, stmt, skip=skip, limit=limit, ordem=[Equipe.nome], opcoes=_COM_RELACOES)


def obter_detalhe(db: Session, equipe_id: int) -> Equipe:
    stmt = (
        select(Equipe)
        .where(Equipe.id == equipe_id)
        .options(*_COM_RELACOES)
        .execution_options(populate_existing=True)  # sempre relê do banco (dados frescos)
    )
    equipe = db.scalar(stmt)
    if equipe is None:
        raise NotFoundError(f"Equipe {equipe_id} não encontrado(a)")
    return equipe


def criar(db: Session, dados: EquipeCreate) -> Equipe:
    if db.scalar(select(Equipe.id).where(Equipe.cnpj == dados.cnpj)):
        raise ConflictError("Já existe uma equipe com esse CNPJ")
    if db.scalar(select(Equipe.id).where(Equipe.nome == dados.nome)):
        raise ConflictError("Já existe uma equipe com esse nome")
    equipe = Equipe(**dados.model_dump())
    db.add(equipe)
    commit(db, "Equipe já cadastrada")
    db.refresh(equipe)
    return equipe


def atualizar(db: Session, equipe_id: int, dados: EquipeUpdate) -> Equipe:
    equipe = obter_ou_404(db, Equipe, equipe_id, "Equipe")
    aplicar_parcial(equipe, dados.model_dump(exclude_unset=True))
    commit(db, "Já existe uma equipe com esse nome")
    db.refresh(equipe)
    return equipe


def remover(db: Session, equipe_id: int) -> None:
    equipe = obter_ou_404(db, Equipe, equipe_id, "Equipe")
    db.delete(equipe)  # jogadores e técnico ficam sem equipe (ON DELETE SET NULL)
    commit(db)


# ---------- Relação 1:N  Equipe -> Jogadores ----------


def contratar_jogador(db: Session, equipe_id: int, jogador_id: int) -> Equipe:
    equipe = obter_ou_404(db, Equipe, equipe_id, "Equipe")
    jogador = obter_ou_404(db, Jogador, jogador_id, "Jogador")
    if jogador.equipe_id == equipe.id:
        raise BusinessRuleError("Jogador já pertence a esta equipe")
    if jogador.equipe_id is not None:
        raise ConflictError("Jogador tem contrato com outra equipe; dispense-o primeiro")
    jogador.equipe = equipe
    commit(db)
    return obter_detalhe(db, equipe_id)


def dispensar_jogador(db: Session, equipe_id: int, jogador_id: int) -> Equipe:
    obter_ou_404(db, Equipe, equipe_id, "Equipe")
    jogador = obter_ou_404(db, Jogador, jogador_id, "Jogador")
    if jogador.equipe_id != equipe_id:
        raise BusinessRuleError("Jogador não pertence a esta equipe")
    jogador.equipe = None
    commit(db)
    return obter_detalhe(db, equipe_id)


# ---------- Relação 1:1  Equipe -> Técnico ----------


def definir_tecnico(db: Session, equipe_id: int, tecnico_id: int) -> Equipe:
    equipe = obter_detalhe(db, equipe_id)
    tecnico = obter_ou_404(db, Tecnico, tecnico_id, "Técnico")

    if tecnico.equipe_id == equipe.id:
        raise BusinessRuleError("Este técnico já comanda esta equipe")
    if tecnico.equipe_id is not None:
        raise ConflictError("Técnico já comanda outra equipe; libere-o primeiro")

    # Se a equipe já tem técnico, ele é desligado ANTES (flush) para não violar o UNIQUE.
    if equipe.tecnico is not None:
        equipe.tecnico.equipe = None
        db.flush()

    tecnico.equipe = equipe
    commit(db, "Equipe já possui técnico")
    db.expire_all()
    return obter_detalhe(db, equipe_id)


def remover_tecnico(db: Session, equipe_id: int) -> Equipe:
    equipe = obter_detalhe(db, equipe_id)
    if equipe.tecnico is None:
        raise BusinessRuleError("Equipe não possui técnico")
    equipe.tecnico.equipe = None
    commit(db)
    db.expire_all()
    return obter_detalhe(db, equipe_id)
