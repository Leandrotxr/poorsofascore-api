from fastapi import APIRouter, status

from app.api.deps import DbSession, Limit, Skip
from app.schemas import EquipeCreate, EquipeDetalhe, EquipeOut, EquipeUpdate
from app.services import equipes as service

router = APIRouter(prefix="/equipes", tags=["Equipes"])


@router.get("", response_model=list[EquipeOut])
def listar_equipes(db: DbSession, nome: str | None = None, skip: Skip = 0, limit: Limit = 50):
    return service.listar(db, nome=nome, skip=skip, limit=limit)


@router.get("/{equipe_id}", response_model=EquipeDetalhe)
def obter_equipe(equipe_id: int, db: DbSession):
    """Retorna a equipe com o técnico (1:1) e o elenco (1:N)."""
    return service.obter_detalhe(db, equipe_id)


@router.post("", response_model=EquipeOut, status_code=status.HTTP_201_CREATED)
def criar_equipe(dados: EquipeCreate, db: DbSession):
    return service.criar(db, dados)


@router.patch("/{equipe_id}", response_model=EquipeOut)
def atualizar_equipe(equipe_id: int, dados: EquipeUpdate, db: DbSession):
    return service.atualizar(db, equipe_id, dados)


@router.delete("/{equipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_equipe(equipe_id: int, db: DbSession):
    service.remover(db, equipe_id)


# ---- Elenco (1:N) ----


@router.put("/{equipe_id}/jogadores/{jogador_id}", response_model=EquipeDetalhe)
def contratar_jogador(equipe_id: int, jogador_id: int, db: DbSession):
    return service.contratar_jogador(db, equipe_id, jogador_id)


@router.delete("/{equipe_id}/jogadores/{jogador_id}", response_model=EquipeDetalhe)
def dispensar_jogador(equipe_id: int, jogador_id: int, db: DbSession):
    return service.dispensar_jogador(db, equipe_id, jogador_id)


# ---- Técnico (1:1) ----


@router.put("/{equipe_id}/tecnico/{tecnico_id}", response_model=EquipeDetalhe)
def definir_tecnico(equipe_id: int, tecnico_id: int, db: DbSession):
    """Define o técnico. Se a equipe já tiver um, ele é substituído."""
    return service.definir_tecnico(db, equipe_id, tecnico_id)


@router.delete("/{equipe_id}/tecnico", response_model=EquipeDetalhe)
def remover_tecnico(equipe_id: int, db: DbSession):
    return service.remover_tecnico(db, equipe_id)
