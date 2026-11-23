"""Versões curtas das entidades, usadas dentro de outras respostas (evita import circular)."""

from pydantic import BaseModel

from app.models import FuncaoArbitro, Posicao
from app.schemas.saida import CONFIG_SAIDA


class _Resumo(BaseModel):
    model_config = CONFIG_SAIDA
    id: int
    nome: str


class EquipeResumo(_Resumo):
    pass


class FederacaoResumo(_Resumo):
    sigla: str


class JogadorResumo(_Resumo):
    posicao: Posicao
    idade: int


class TecnicoResumo(_Resumo):
    idade: int
    nacionalidade: str


class CampeonatoResumo(_Resumo):
    temporada: int


class ArbitroResumo(_Resumo):
    funcao: FuncaoArbitro
