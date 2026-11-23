from fastapi import APIRouter, status

from app.api.deps import ESCRITA, DbSession, Limit, Skip
from app.schemas import (
    ContratoJogadorCreate,
    ContratoTecnicoCreate,
    EquipeCreate,
    EquipeDetalhe,
    EquipeOut,
    EquipeUpdate,
    Pagina,
)
from app.services import equipes as service

router = APIRouter(prefix="/equipes", tags=["Equipes"])


@router.get("", response_model=Pagina[EquipeDetalhe])
def listar_equipes(
    db: DbSession,
    nome: str | None = None,
    federacao_id: int | None = None,
    sem_federacao: bool = False,
    sem_tecnico: bool = False,
    skip: Skip = 0,
    limit: Limit = 50,
):
    """Cada equipe já vem com técnico, elenco e campeonatos."""
    return service.listar(
        db,
        nome=nome,
        federacao_id=federacao_id,
        sem_federacao=sem_federacao,
        sem_tecnico=sem_tecnico,
        skip=skip,
        limit=limit,
    )


@router.get("/{equipe_id}", response_model=EquipeDetalhe)
def obter_equipe(equipe_id: int, db: DbSession):
    """Retorna a equipe com o técnico (1:1) e o elenco (1:N)."""
    return service.obter_detalhe(db, equipe_id)


@router.post("", response_model=EquipeOut, status_code=status.HTTP_201_CREATED, dependencies=ESCRITA)
def criar_equipe(dados: EquipeCreate, db: DbSession):
    return service.criar(db, dados)


@router.patch("/{equipe_id}", response_model=EquipeOut, dependencies=ESCRITA)
def atualizar_equipe(equipe_id: int, dados: EquipeUpdate, db: DbSession):
    return service.atualizar(db, equipe_id, dados)


@router.delete("/{equipe_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=ESCRITA)
def remover_equipe(equipe_id: int, db: DbSession):
    service.remover(db, equipe_id)


# ---- Elenco (1:N) ----


@router.put("/{equipe_id}/jogadores/{jogador_id}", response_model=EquipeDetalhe, dependencies=ESCRITA)
def contratar_jogador(equipe_id: int, jogador_id: int, db: DbSession, dados: ContratoJogadorCreate | None = None):
    """Abre um contrato (corpo opcional: `inicio` e `numero_camisa`). O jogador precisa estar livre."""
    return service.contratar_jogador(db, equipe_id, jogador_id, dados)


@router.delete("/{equipe_id}/jogadores/{jogador_id}", response_model=EquipeDetalhe, dependencies=ESCRITA)
def dispensar_jogador(equipe_id: int, jogador_id: int, db: DbSession):
    """Encerra o contrato atual (fica no histórico do jogador)."""
    return service.dispensar_jogador(db, equipe_id, jogador_id)


# ---- Técnico (1:1) ----


@router.put("/{equipe_id}/tecnico/{tecnico_id}", response_model=EquipeDetalhe, dependencies=ESCRITA)
def definir_tecnico(equipe_id: int, tecnico_id: int, db: DbSession, dados: ContratoTecnicoCreate | None = None):
    """Define o técnico (corpo opcional: `inicio`). Se a equipe já tiver um, o contrato dele é encerrado."""
    return service.definir_tecnico(db, equipe_id, tecnico_id, dados)


@router.delete("/{equipe_id}/tecnico", response_model=EquipeDetalhe, dependencies=ESCRITA)
def remover_tecnico(equipe_id: int, db: DbSession):
    return service.remover_tecnico(db, equipe_id)
