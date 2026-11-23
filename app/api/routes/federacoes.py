from fastapi import APIRouter, status

from app.api.deps import ESCRITA, DbSession, Limit, Skip
from app.models import Abrangencia
from app.schemas import FederacaoCreate, FederacaoDetalhe, FederacaoOut, FederacaoUpdate, Pagina
from app.services import federacoes as service

router = APIRouter(prefix="/federacoes", tags=["Federações"])


@router.get("", response_model=Pagina[FederacaoDetalhe])
def listar_federacoes(
    db: DbSession, nome: str | None = None, abrangencia: Abrangencia | None = None, skip: Skip = 0, limit: Limit = 50
):
    """Filtro `nome` procura no nome e na sigla. Cada federação já vem com equipes, árbitros e campeonatos."""
    return service.listar(db, nome=nome, abrangencia=abrangencia, skip=skip, limit=limit)


@router.get("/{federacao_id}", response_model=FederacaoDetalhe)
def obter_federacao(federacao_id: int, db: DbSession):
    """Retorna a federação com as equipes filiadas e os árbitros."""
    return service.obter_detalhe(db, federacao_id)


@router.post("", response_model=FederacaoOut, status_code=status.HTTP_201_CREATED, dependencies=ESCRITA)
def criar_federacao(dados: FederacaoCreate, db: DbSession):
    return service.criar(db, dados)


@router.patch("/{federacao_id}", response_model=FederacaoOut, dependencies=ESCRITA)
def atualizar_federacao(federacao_id: int, dados: FederacaoUpdate, db: DbSession):
    return service.atualizar(db, federacao_id, dados)


@router.delete("/{federacao_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=ESCRITA)
def remover_federacao(federacao_id: int, db: DbSession):
    service.remover(db, federacao_id)


# ---- Equipes filiadas (1:N) ----


@router.put("/{federacao_id}/equipes/{equipe_id}", response_model=FederacaoDetalhe, dependencies=ESCRITA)
def filiar_equipe(federacao_id: int, equipe_id: int, db: DbSession):
    return service.filiar_equipe(db, federacao_id, equipe_id)


@router.delete("/{federacao_id}/equipes/{equipe_id}", response_model=FederacaoDetalhe, dependencies=ESCRITA)
def desfiliar_equipe(federacao_id: int, equipe_id: int, db: DbSession):
    return service.desfiliar_equipe(db, federacao_id, equipe_id)


# ---- Árbitros (1:N) ----


@router.put("/{federacao_id}/arbitros/{arbitro_id}", response_model=FederacaoDetalhe, dependencies=ESCRITA)
def vincular_arbitro(federacao_id: int, arbitro_id: int, db: DbSession):
    return service.vincular_arbitro(db, federacao_id, arbitro_id)


@router.delete("/{federacao_id}/arbitros/{arbitro_id}", response_model=FederacaoDetalhe, dependencies=ESCRITA)
def desvincular_arbitro(federacao_id: int, arbitro_id: int, db: DbSession):
    return service.desvincular_arbitro(db, federacao_id, arbitro_id)
