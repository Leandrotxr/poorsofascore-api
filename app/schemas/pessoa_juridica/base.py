"""Peças comuns a toda pessoa jurídica. As filhas combinam estas classes por herança."""

from typing import Annotated

from pydantic import BaseModel, Field

from app.models import PessoaJuridica
from app.schemas.saida import CONFIG_SAIDA

Fundacao = Annotated[int, Field(ge=PessoaJuridica.FUNDACAO_MINIMA, le=PessoaJuridica.FUNDACAO_MAXIMA)]


class PessoaJuridicaBase(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    fundacao: Fundacao
    sede: str = Field(min_length=2, max_length=120)


class PessoaJuridicaUpdate(BaseModel):
    """PATCH: tudo opcional. O CNPJ não é editável."""

    nome: str | None = Field(default=None, min_length=2, max_length=120)
    fundacao: Fundacao | None = None
    sede: str | None = Field(default=None, min_length=2, max_length=120)


class PessoaJuridicaOut(BaseModel):
    model_config = CONFIG_SAIDA
    id: int
