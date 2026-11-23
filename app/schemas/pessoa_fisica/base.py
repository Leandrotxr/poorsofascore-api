"""Peças comuns a toda pessoa física. As filhas combinam estas classes por herança."""

from pydantic import BaseModel, Field, field_serializer, field_validator

from app.core.validators import mascarar_cpf, validar_cpf
from app.schemas.saida import CONFIG_SAIDA


class PessoaFisicaBase(BaseModel):
    """Campos que entram e saem da API. A `idade` fica nas filhas: cada papel tem sua faixa."""

    nome: str = Field(min_length=2, max_length=120)
    nacionalidade: str = Field(min_length=2, max_length=60)


class PessoaFisicaCreate(BaseModel):
    """Entrada: recebe o CPF com ou sem máscara e guarda só os dígitos."""

    cpf: str = Field(description="Com ou sem máscara: 000.000.000-00")

    @field_validator("cpf")
    @classmethod
    def _cpf(cls, v: str) -> str:
        return validar_cpf(v)


class PessoaFisicaUpdate(BaseModel):
    """PATCH: tudo opcional. O CPF não é editável."""

    nome: str | None = Field(default=None, min_length=2, max_length=120)
    nacionalidade: str | None = Field(default=None, min_length=2, max_length=60)


class PessoaFisicaOut(BaseModel):
    """Saída: nunca devolve o CPF completo (minimização de dados, LGPD)."""

    model_config = CONFIG_SAIDA
    id: int
    cpf: str

    @field_serializer("cpf")
    def _mascara(self, cpf: str) -> str:
        return mascarar_cpf(cpf)
