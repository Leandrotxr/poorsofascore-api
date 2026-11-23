from pydantic import Field, field_validator

from app.core.validators import validar_cnpj
from app.schemas.pessoa_juridica.base import PessoaJuridicaBase, PessoaJuridicaOut, PessoaJuridicaUpdate
from app.schemas.resumos import CampeonatoResumo, FederacaoResumo, JogadorResumo, TecnicoResumo


class EquipeCreate(PessoaJuridicaBase):
    cnpj: str = Field(description="Com ou sem máscara: 00.000.000/0000-00")

    @field_validator("cnpj")
    @classmethod
    def _cnpj(cls, v: str) -> str:
        return validar_cnpj(v)


class EquipeUpdate(PessoaJuridicaUpdate):
    pass


class EquipeOut(PessoaJuridicaBase, PessoaJuridicaOut):
    cnpj: str
    federacao: FederacaoResumo | None = None


class EquipeDetalhe(EquipeOut):
    """Equipe com o técnico (1:1), o elenco (1:N) e os campeonatos (N:N)."""

    tecnico: TecnicoResumo | None = None
    jogadores: list[JogadorResumo] = []
    campeonatos: list[CampeonatoResumo] = []
