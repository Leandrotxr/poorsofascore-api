"""Peças comuns a toda pessoa jurídica. As filhas combinam estas classes por herança."""

from pydantic import BaseModel, ConfigDict, Field

from app.models import PessoaJuridica

_FUNDACAO = {"ge": PessoaJuridica.FUNDACAO_MINIMA, "le": PessoaJuridica.FUNDACAO_MAXIMA}


class PessoaJuridicaBase(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    fundacao: int = Field(**_FUNDACAO)
    sede: str = Field(min_length=2, max_length=120)


class PessoaJuridicaUpdate(BaseModel):
    """PATCH: tudo opcional. O CNPJ não é editável."""

    nome: str | None = Field(default=None, min_length=2, max_length=120)
    fundacao: int | None = Field(default=None, **_FUNDACAO)
    sede: str | None = Field(default=None, min_length=2, max_length=120)


class PessoaJuridicaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
