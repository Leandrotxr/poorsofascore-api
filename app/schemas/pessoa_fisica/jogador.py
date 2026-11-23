from datetime import date
from typing import Annotated

from pydantic import AfterValidator, Field

from app.core.datas import faixa_etaria
from app.models import Jogador, Posicao
from app.schemas.pessoa_fisica.base import PessoaFisicaBase, PessoaFisicaCreate, PessoaFisicaOut, PessoaFisicaUpdate
from app.schemas.resumos import EquipeResumo

Nascimento = Annotated[
    date,
    AfterValidator(faixa_etaria(Jogador.IDADE_MINIMA, Jogador.IDADE_MAXIMA)),
    Field(description=f"Idade entre {Jogador.IDADE_MINIMA} e {Jogador.IDADE_MAXIMA} anos"),
]


class JogadorBase(PessoaFisicaBase):
    posicao: Posicao


class JogadorCreate(JogadorBase, PessoaFisicaCreate):
    data_nascimento: Nascimento


class JogadorUpdate(PessoaFisicaUpdate):
    data_nascimento: Nascimento | None = None
    posicao: Posicao | None = None


class JogadorOut(JogadorBase, PessoaFisicaOut):
    equipe: EquipeResumo | None = None
    numero_camisa: int | None = Field(default=None, description="Número no contrato atual")
