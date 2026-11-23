from datetime import date
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models import Campeonato, FormatoCampeonato
from app.schemas.resumos import EquipeResumo, FederacaoResumo

Temporada = Annotated[int, Field(ge=Campeonato.TEMPORADA_MINIMA, le=Campeonato.TEMPORADA_MAXIMA)]


def _conferir_datas(inicio: date | None, fim: date | None) -> None:
    if inicio and fim and fim < inicio:
        raise ValueError("A data de fim não pode ser anterior à data de início")


class CampeonatoBase(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    temporada: Temporada = Field(description="Ano da temporada, ex.: 2026")
    formato: FormatoCampeonato
    data_inicio: date | None = None
    data_fim: date | None = None

    @model_validator(mode="after")
    def _datas(self):
        _conferir_datas(self.data_inicio, self.data_fim)
        return self


class CampeonatoCreate(CampeonatoBase):
    federacao_id: int = Field(description="Federação organizadora (obrigatória)")


class CampeonatoUpdate(BaseModel):
    """PATCH: tudo opcional. As datas são conferidas de novo no service, com os valores já salvos."""

    nome: str | None = Field(default=None, min_length=2, max_length=120)
    temporada: Temporada | None = None
    formato: FormatoCampeonato | None = None
    data_inicio: date | None = None
    data_fim: date | None = None
    federacao_id: int | None = None


class CampeonatoOut(CampeonatoBase):
    """Já traz a organizadora e as equipes: o front monta as relações sem uma chamada por campeonato."""

    model_config = ConfigDict(from_attributes=True)
    id: int
    federacao: FederacaoResumo
    equipes: list[EquipeResumo] = []
