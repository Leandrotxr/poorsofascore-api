from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from app.core.validators import mascarar_cpf, validar_cpf
from app.schemas.resumos import EquipeResumo


class TecnicoBase(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    idade: int = Field(ge=18, le=100)
    nacionalidade: str = Field(min_length=2, max_length=60)


class TecnicoCreate(TecnicoBase):
    cpf: str = Field(description="Com ou sem máscara: 000.000.000-00")

    @field_validator("cpf")
    @classmethod
    def _cpf(cls, v: str) -> str:
        return validar_cpf(v)


class TecnicoUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=120)
    idade: int | None = Field(default=None, ge=18, le=100)
    nacionalidade: str | None = Field(default=None, min_length=2, max_length=60)


class TecnicoOut(TecnicoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    cpf: str
    equipe: EquipeResumo | None = None

    @field_serializer("cpf")
    def _mascara(self, cpf: str) -> str:
        return mascarar_cpf(cpf)
