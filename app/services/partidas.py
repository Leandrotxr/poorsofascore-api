from sqlalchemy import Select, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.models import Arbitro, Campeonato, Equipe, EventoPartida, Jogador, Partida, StatusPartida, campeonato_equipe
from app.schemas import EventoCreate, PartidaCreate, PartidaUpdate
from app.services.common import Pagina, aplicar_parcial, commit, obter_ou_404, paginar

_COM_RELACOES = (
    joinedload(Partida.campeonato),
    joinedload(Partida.mandante),
    joinedload(Partida.visitante),
    joinedload(Partida.arbitro),
    selectinload(Partida.eventos).joinedload(EventoPartida.jogador),  # placar e lista de eventos
    selectinload(Partida.eventos).joinedload(EventoPartida.equipe),
)


def listar(
    db: Session,
    *,
    campeonato_id: int | None = None,
    equipe_id: int | None = None,
    rodada: int | None = None,
    status: StatusPartida | None = None,
    skip: int = 0,
    limit: int = 50,
) -> Pagina[Partida]:
    stmt: Select = select(Partida)
    if campeonato_id:
        stmt = stmt.where(Partida.campeonato_id == campeonato_id)
    if equipe_id:
        stmt = stmt.where((Partida.mandante_id == equipe_id) | (Partida.visitante_id == equipe_id))
    if rodada:
        stmt = stmt.where(Partida.rodada == rodada)
    if status:
        stmt = stmt.where(Partida.status == status)
    ordem = [Partida.rodada, Partida.data_hora, Partida.id]
    return paginar(db, stmt, skip=skip, limit=limit, ordem=ordem, opcoes=_COM_RELACOES)


def obter(db: Session, partida_id: int) -> Partida:
    stmt = (
        select(Partida)
        .where(Partida.id == partida_id)
        .options(*_COM_RELACOES)
        .execution_options(populate_existing=True)
    )
    partida = db.scalar(stmt)
    if partida is None:
        raise NotFoundError(f"Partida {partida_id} não encontrada")
    return partida


def _exigir_inscrita(db: Session, campeonato_id: int, equipe_id: int) -> None:
    equipe = obter_ou_404(db, Equipe, equipe_id, "Equipe")
    inscrita = db.scalar(
        select(campeonato_equipe.c.equipe_id).where(
            campeonato_equipe.c.campeonato_id == campeonato_id, campeonato_equipe.c.equipe_id == equipe_id
        )
    )
    if not inscrita:
        raise BusinessRuleError(f"{equipe.nome} não está inscrita neste campeonato")


def criar(db: Session, dados: PartidaCreate) -> Partida:
    obter_ou_404(db, Campeonato, dados.campeonato_id, "Campeonato")
    _exigir_inscrita(db, dados.campeonato_id, dados.mandante_id)
    _exigir_inscrita(db, dados.campeonato_id, dados.visitante_id)
    if dados.arbitro_id is not None:
        obter_ou_404(db, Arbitro, dados.arbitro_id, "Árbitro")
    partida = Partida(**dados.model_dump(), status=StatusPartida.AGENDADA)
    db.add(partida)
    commit(db)
    return obter(db, partida.id)


def atualizar(db: Session, partida_id: int, dados: PartidaUpdate) -> Partida:
    partida = obter(db, partida_id)
    mudancas = dados.model_dump(exclude_unset=True)

    for campo in ("mandante_id", "visitante_id", "rodada", "status"):
        if campo in mudancas and mudancas[campo] is None:
            raise BusinessRuleError(f"O campo {campo} não pode ficar vazio")

    trocou_equipes = any(
        mudancas.get(c, getattr(partida, c)) != getattr(partida, c) for c in ("mandante_id", "visitante_id")
    )
    if trocou_equipes:
        if partida.eventos:
            raise BusinessRuleError("A partida já tem eventos; remova-os antes de trocar as equipes")
        mandante = mudancas.get("mandante_id", partida.mandante_id)
        visitante = mudancas.get("visitante_id", partida.visitante_id)
        if mandante == visitante:
            raise BusinessRuleError("Mandante e visitante precisam ser equipes diferentes")
        _exigir_inscrita(db, partida.campeonato_id, mandante)
        _exigir_inscrita(db, partida.campeonato_id, visitante)

    if mudancas.get("status") == StatusPartida.AGENDADA and partida.eventos:
        raise BusinessRuleError("Uma partida com eventos não pode voltar a ser agendada; remova os eventos antes")
    if mudancas.get("arbitro_id") is not None:
        obter_ou_404(db, Arbitro, mudancas["arbitro_id"], "Árbitro")

    aplicar_parcial(partida, mudancas)
    commit(db)
    db.expire_all()
    return obter(db, partida_id)


def remover(db: Session, partida_id: int) -> None:
    db.delete(obter_ou_404(db, Partida, partida_id, "Partida"))  # os eventos somem junto (CASCADE)
    commit(db)


# ---------- Eventos ----------


def adicionar_evento(db: Session, partida_id: int, dados: EventoCreate) -> Partida:
    partida = obter(db, partida_id)
    if partida.status == StatusPartida.AGENDADA:
        raise BusinessRuleError("A partida ainda não começou: mude o status para EM_ANDAMENTO antes")
    jogador = obter_ou_404(db, Jogador, dados.jogador_id, "Jogador")
    if jogador.equipe_id not in (partida.mandante_id, partida.visitante_id):
        raise BusinessRuleError(f"{jogador.nome} não joga por nenhuma das equipes da partida")

    db.add(
        EventoPartida(
            partida=partida, tipo=dados.tipo, minuto=dados.minuto, jogador=jogador, equipe_id=jogador.equipe_id
        )
    )
    commit(db)
    db.expire_all()
    return obter(db, partida_id)


def remover_evento(db: Session, partida_id: int, evento_id: int) -> Partida:
    evento = db.get(EventoPartida, evento_id)
    if evento is None or evento.partida_id != partida_id:
        raise NotFoundError(f"Evento {evento_id} não encontrado nesta partida")
    db.delete(evento)
    commit(db)
    db.expire_all()
    return obter(db, partida_id)
