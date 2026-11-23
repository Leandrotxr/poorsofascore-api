from typing import Annotated

from pydantic import Field, field_validator

from app.core.validators import validar_cnpj
from app.models import Abrangencia
from app.schemas.pessoa_juridica.base import PessoaJuridicaBase, PessoaJuridicaOut, PessoaJuridicaUpdate
from app.schemas.resumos import ArbitroResumo, CampeonatoResumo, EquipeResumo

Sigla = Annotated[str, Field(min_length=2, max_length=20, pattern=r"^[A-Za-z0-9]+$")]


def _sigla_maiuscula(v: str | None) -> str | None:
    return v.upper() if v else v


class FederacaoBase(PessoaJuridicaBase):
    sigla: Sigla = Field(description="Só letras e números, ex.: FIFA, UEFA, CBF")
    abrangencia: Abrangencia

    _sigla = field_validator("sigla")(_sigla_maiuscula)


class FederacaoCreate(FederacaoBase):
    cnpj: str | None = Field(default=None, description="Opcional: só entidades brasileiras têm CNPJ")

    @field_validator("cnpj")
    @classmethod
    def _cnpj(cls, v: str | None) -> str | None:
        return validar_cnpj(v) if v else None


class FederacaoUpdate(PessoaJuridicaUpdate):
    sigla: Sigla | None = None
    abrangencia: Abrangencia | None = None

    _sigla = field_validator("sigla")(_sigla_maiuscula)


class FederacaoOut(FederacaoBase, PessoaJuridicaOut):
    cnpj: str | None = None


class FederacaoDetalhe(FederacaoOut):
    """Federação com as equipes filiadas, os árbitros e os campeonatos que organiza (todos 1:N)."""

    equipes: list[EquipeResumo] = []
    arbitros: list[ArbitroResumo] = []
    campeonatos: list[CampeonatoResumo] = []
