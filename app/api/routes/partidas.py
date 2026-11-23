from fastapi import APIRouter, status

from app.api.deps import DbSession, Limit, Skip
from app.models import StatusPartida
from app.schemas import EventoCreate, Pagina, PartidaCreate, PartidaDetalhe, PartidaOut, PartidaUpdate
from app.services import partidas as service

router = APIRouter(prefix="/partidas", tags=["Partidas"])


@router.get("", response_model=Pagina[PartidaOut])
def listar_partidas(
    db: DbSession,
    campeonato_id: int | None = None,
    equipe_id: int | None = None,
    rodada: int | None = None,
    status: StatusPartida | None = None,
    skip: Skip = 0,
    limit: Limit = 50,
):
    """Ordenadas por rodada e data. `equipe_id` traz os jogos em que a equipe é mandante ou visitante."""
    return service.listar(
        db, campeonato_id=campeonato_id, equipe_id=equipe_id, rodada=rodada, status=status, skip=skip, limit=limit
    )


@router.get("/{partida_id}", response_model=PartidaDetalhe)
def obter_partida(partida_id: int, db: DbSession):
    """Partida com o placar e a lista de eventos (gols e cartões)."""
    return service.obter(db, partida_id)


@router.post("", response_model=PartidaDetalhe, status_code=status.HTTP_201_CREATED)
def criar_partida(dados: PartidaCreate, db: DbSession):
    """As duas equipes precisam estar inscritas no campeonato. A partida nasce AGENDADA."""
    return service.criar(db, dados)


@router.patch("/{partida_id}", response_model=PartidaDetalhe)
def atualizar_partida(partida_id: int, dados: PartidaUpdate, db: DbSession):
    """Também muda o status: AGENDADA → EM_ANDAMENTO → ENCERRADA."""
    return service.atualizar(db, partida_id, dados)


@router.delete("/{partida_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_partida(partida_id: int, db: DbSession):
    service.remover(db, partida_id)


# ---- Eventos (gols, cartões) ----


@router.post("/{partida_id}/eventos", response_model=PartidaDetalhe, status_code=status.HTTP_201_CREATED)
def adicionar_evento(partida_id: int, dados: EventoCreate, db: DbSession):
    """A partida precisa ter começado. A equipe do evento é a equipe atual do jogador."""
    return service.adicionar_evento(db, partida_id, dados)


@router.delete("/{partida_id}/eventos/{evento_id}", response_model=PartidaDetalhe)
def remover_evento(partida_id: int, evento_id: int, db: DbSession):
    return service.remover_evento(db, partida_id, evento_id)
