from fastapi import APIRouter, status

from app.api.deps import DbSession, Limit, Skip
from app.schemas import Artilheiro, CampeonatoCreate, CampeonatoOut, CampeonatoUpdate, LinhaClassificacao, Pagina
from app.services import campeonatos as service
from app.services import estatisticas

router = APIRouter(prefix="/campeonatos", tags=["Campeonatos"])


@router.get("", response_model=Pagina[CampeonatoOut])
def listar_campeonatos(
    db: DbSession,
    nome: str | None = None,
    temporada: int | None = None,
    federacao_id: int | None = None,
    skip: Skip = 0,
    limit: Limit = 50,
):
    return service.listar(db, nome=nome, temporada=temporada, federacao_id=federacao_id, skip=skip, limit=limit)


@router.get("/{campeonato_id}", response_model=CampeonatoOut)
def obter_campeonato(campeonato_id: int, db: DbSession):
    """Retorna o campeonato com a federação organizadora e as equipes participantes."""
    return service.obter(db, campeonato_id)


@router.get("/{campeonato_id}/classificacao", response_model=list[LinhaClassificacao])
def classificacao(campeonato_id: int, db: DbSession):
    """Tabela com todas as equipes inscritas. Só partidas ENCERRADAS contam.
    Desempate: pontos, vitórias, saldo, gols pró."""
    return estatisticas.classificacao(db, campeonato_id)


@router.get("/{campeonato_id}/artilheiros", response_model=list[Artilheiro])
def artilheiros(campeonato_id: int, db: DbSession):
    """Os 20 maiores goleadores (gols contra não contam)."""
    return estatisticas.artilheiros(db, campeonato_id)


@router.post("", response_model=CampeonatoOut, status_code=status.HTTP_201_CREATED)
def criar_campeonato(dados: CampeonatoCreate, db: DbSession):
    return service.criar(db, dados)


@router.patch("/{campeonato_id}", response_model=CampeonatoOut)
def atualizar_campeonato(campeonato_id: int, dados: CampeonatoUpdate, db: DbSession):
    return service.atualizar(db, campeonato_id, dados)


@router.delete("/{campeonato_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_campeonato(campeonato_id: int, db: DbSession):
    service.remover(db, campeonato_id)


# ---- Equipes participantes (N:N) ----


@router.put("/{campeonato_id}/equipes/{equipe_id}", response_model=CampeonatoOut)
def inscrever_equipe(campeonato_id: int, equipe_id: int, db: DbSession):
    return service.inscrever_equipe(db, campeonato_id, equipe_id)


@router.delete("/{campeonato_id}/equipes/{equipe_id}", response_model=CampeonatoOut)
def remover_equipe(campeonato_id: int, equipe_id: int, db: DbSession):
    return service.remover_equipe(db, campeonato_id, equipe_id)
