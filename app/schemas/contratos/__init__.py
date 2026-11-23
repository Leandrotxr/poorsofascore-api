from datetime import date

from pydantic import BaseModel, Field, field_validator

from app.core.datas import hoje
from app.schemas.resumos import EquipeResumo
from app.schemas.saida import CONFIG_SAIDA


def _nao_futuro(v: date | None) -> date | None:
    if v and v > hoje():
        raise ValueError("O início do contrato não pode estar no futuro")
    return v


class ContratoTecnicoCreate(BaseModel):
    """Corpo opcional ao definir o técnico. Sem `inicio`, vale a data de hoje."""

    inicio: date | None = None

    _inicio = field_validator("inicio")(_nao_futuro)


class ContratoJogadorCreate(ContratoTecnicoCreate):
    """Corpo opcional ao contratar. Sem `inicio`, vale a data de hoje."""

    numero_camisa: int | None = Field(default=None, ge=1, le=99)


class ContratoTecnicoOut(BaseModel):
    model_config = CONFIG_SAIDA
    id: int
    equipe: EquipeResumo
    inicio: date
    fim: date | None = Field(description="Vazio = contrato em andamento")


class ContratoJogadorOut(ContratoTecnicoOut):
    numero_camisa: int | None
