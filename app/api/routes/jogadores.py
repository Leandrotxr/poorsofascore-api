from fastapi import APIRouter, status

from app.api.deps import DbSession, Limit, Skip
from app.models import Posicao
from app.schemas import ContratoJogadorOut, JogadorCreate, JogadorOut, JogadorUpdate, Pagina
from app.services import contratos
from app.services import jogadores as service

router = APIRouter(prefix="/jogadores", tags=["Jogadores"])


@router.get("", response_model=Pagina[JogadorOut])
def listar_jogadores(
    db: DbSession,
    nome: str | None = None,
    posicao: Posicao | None = None,
    equipe_id: int | None = None,
    sem_equipe: bool = False,
    skip: Skip = 0,
    limit: Limit = 50,
):
    return service.listar(
        db, nome=nome, posicao=posicao, equipe_id=equipe_id, sem_equipe=sem_equipe, skip=skip, limit=limit
    )


@router.get("/{jogador_id}", response_model=JogadorOut)
def obter_jogador(jogador_id: int, db: DbSession):
    return service.obter(db, jogador_id)


@router.get("/{jogador_id}/contratos", response_model=list[ContratoJogadorOut])
def contratos_do_jogador(jogador_id: int, db: DbSession):
    """Histórico de equipes, do contrato mais recente para o mais antigo."""
    return contratos.contratos_do_jogador(db, jogador_id)


@router.post("", response_model=JogadorOut, status_code=status.HTTP_201_CREATED)
def criar_jogador(dados: JogadorCreate, db: DbSession):
    return service.criar(db, dados)


@router.patch("/{jogador_id}", response_model=JogadorOut)
def atualizar_jogador(jogador_id: int, dados: JogadorUpdate, db: DbSession):
    return service.atualizar(db, jogador_id, dados)


@router.delete("/{jogador_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_jogador(jogador_id: int, db: DbSession):
    service.remover(db, jogador_id)
