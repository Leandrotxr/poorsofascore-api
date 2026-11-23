from fastapi import APIRouter, status

from app.api.deps import DbSession, Limit, Skip
from app.schemas import Pagina, TecnicoCreate, TecnicoOut, TecnicoUpdate
from app.services import tecnicos as service

router = APIRouter(prefix="/tecnicos", tags=["Técnicos"])


@router.get("", response_model=Pagina[TecnicoOut])
def listar_tecnicos(
    db: DbSession, nome: str | None = None, sem_equipe: bool = False, skip: Skip = 0, limit: Limit = 50
):
    return service.listar(db, nome=nome, sem_equipe=sem_equipe, skip=skip, limit=limit)


@router.get("/{tecnico_id}", response_model=TecnicoOut)
def obter_tecnico(tecnico_id: int, db: DbSession):
    return service.obter(db, tecnico_id)


@router.post("", response_model=TecnicoOut, status_code=status.HTTP_201_CREATED)
def criar_tecnico(dados: TecnicoCreate, db: DbSession):
    return service.criar(db, dados)


@router.patch("/{tecnico_id}", response_model=TecnicoOut)
def atualizar_tecnico(tecnico_id: int, dados: TecnicoUpdate, db: DbSession):
    return service.atualizar(db, tecnico_id, dados)


@router.delete("/{tecnico_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_tecnico(tecnico_id: int, db: DbSession):
    service.remover(db, tecnico_id)
