"""Versões curtas das entidades, usadas dentro de outras respostas (evita import circular)."""

from pydantic import BaseModel, ConfigDict

from app.models import FuncaoArbitro, Posicao


class _Resumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str


class EquipeResumo(_Resumo):
    pass


class FederacaoResumo(_Resumo):
    sigla: str


class JogadorResumo(_Resumo):
    posicao: Posicao


class TecnicoResumo(_Resumo):
    pass


class CampeonatoResumo(_Resumo):
    temporada: int


class ArbitroResumo(_Resumo):
    funcao: FuncaoArbitro
