from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.validators import validar_cnpj
from app.schemas.resumos import JogadorResumo, TecnicoResumo


class EquipeBase(BaseModel):
    nome: str = Field(min_length=2, max_length=120)
    fundacao: int = Field(ge=1800, le=2100)
    sede: str = Field(min_length=2, max_length=120)


class EquipeCreate(EquipeBase):
    cnpj: str = Field(description="Com ou sem máscara: 00.000.000/0000-00")

    @field_validator("cnpj")
    @classmethod
    def _cnpj(cls, v: str) -> str:
        return validar_cnpj(v)


class EquipeUpdate(BaseModel):
    """Todos os campos opcionais: só o que vier no corpo é alterado (PATCH)."""

    nome: str | None = Field(default=None, min_length=2, max_length=120)
    fundacao: int | None = Field(default=None, ge=1800, le=2100)
    sede: str | None = Field(default=None, min_length=2, max_length=120)


class EquipeOut(EquipeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    cnpj: str


class EquipeDetalhe(EquipeOut):
    """Equipe com o técnico (1:1) e o elenco (1:N)."""

    tecnico: TecnicoResumo | None = None
    jogadores: list[JogadorResumo] = []
