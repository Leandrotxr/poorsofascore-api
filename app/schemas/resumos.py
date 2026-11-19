"""Versões curtas das entidades, usadas dentro de outras respostas (evita import circular)."""

from pydantic import BaseModel, ConfigDict

from app.models.jogador import Posicao


class EquipeResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str


class JogadorResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str
    posicao: Posicao


class TecnicoResumo(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str
