from fastapi import APIRouter, status

from app.api.deps import DbSession, Limit, Skip
from app.models import FuncaoArbitro
from app.schemas import ArbitroCreate, ArbitroOut, ArbitroUpdate
from app.services import arbitros as service

router = APIRouter(prefix="/arbitros", tags=["Árbitros"])


@router.get("", response_model=list[ArbitroOut])
def listar_arbitros(
    db: DbSession,
    nome: str | None = None,
    funcao: FuncaoArbitro | None = None,
    sem_federacao: bool = False,
    skip: Skip = 0,
    limit: Limit = 50,
):
    return service.listar(db, nome=nome, funcao=funcao, sem_federacao=sem_federacao, skip=skip, limit=limit)


@router.get("/{arbitro_id}", response_model=ArbitroOut)
def obter_arbitro(arbitro_id: int, db: DbSession):
    return service.obter(db, arbitro_id)


@router.post("", response_model=ArbitroOut, status_code=status.HTTP_201_CREATED)
def criar_arbitro(dados: ArbitroCreate, db: DbSession):
    return service.criar(db, dados)


@router.patch("/{arbitro_id}", response_model=ArbitroOut)
def atualizar_arbitro(arbitro_id: int, dados: ArbitroUpdate, db: DbSession):
    return service.atualizar(db, arbitro_id, dados)


@router.delete("/{arbitro_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_arbitro(arbitro_id: int, db: DbSession):
    service.remover(db, arbitro_id)
