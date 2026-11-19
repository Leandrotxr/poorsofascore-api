from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator

from app.core.validators import mascarar_cpf, validar_cpf
from app.models.jogador import Posicao
from app.schemas.resumos import EquipeResumo


class JogadorBase(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    idade: int = Field(ge=14, le=60)
    nacionalidade: str = Field(min_length=2, max_length=60)
    posicao: Posicao


class JogadorCreate(JogadorBase):
    cpf: str = Field(description="Com ou sem máscara: 000.000.000-00")

    @field_validator("cpf")
    @classmethod
    def _cpf(cls, v: str) -> str:
        return validar_cpf(v)


class JogadorUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=120)
    idade: int | None = Field(default=None, ge=14, le=60)
    nacionalidade: str | None = Field(default=None, min_length=2, max_length=60)
    posicao: Posicao | None = None


class JogadorOut(JogadorBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    cpf: str
    equipe: EquipeResumo | None = None

    @field_serializer("cpf")
    def _mascara(self, cpf: str) -> str:
        return mascarar_cpf(cpf)
