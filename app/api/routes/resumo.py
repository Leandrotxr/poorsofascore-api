from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import func, select

from app.api.deps import DbSession
from app.models import Arbitro, Campeonato, Equipe, Federacao, Jogador, Tecnico

router = APIRouter(prefix="/resumo", tags=["Resumo"])


class Resumo(BaseModel):
    """Quantos registros existem de cada entidade (cards do painel)."""

    federacoes: int
    campeonatos: int
    equipes: int
    jogadores: int
    tecnicos: int
    arbitros: int


@router.get("", response_model=Resumo)
def obter_resumo(db: DbSession):
    """Totais de cada entidade, numa única consulta."""
    modelos = {
        "federacoes": Federacao,
        "campeonatos": Campeonato,
        "equipes": Equipe,
        "jogadores": Jogador,
        "tecnicos": Tecnico,
        "arbitros": Arbitro,
    }
    consulta = select(*(select(func.count()).select_from(m).scalar_subquery().label(k) for k, m in modelos.items()))
    return db.execute(consulta).mappings().one()
