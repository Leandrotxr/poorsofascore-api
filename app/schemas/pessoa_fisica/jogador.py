from typing import Annotated

from pydantic import Field

from app.models import Jogador, Posicao
from app.schemas.pessoa_fisica.base import PessoaFisicaBase, PessoaFisicaCreate, PessoaFisicaOut, PessoaFisicaUpdate
from app.schemas.resumos import EquipeResumo

Idade = Annotated[int, Field(ge=Jogador.IDADE_MINIMA, le=Jogador.IDADE_MAXIMA)]


class JogadorBase(PessoaFisicaBase):
    idade: Idade
    posicao: Posicao


class JogadorCreate(JogadorBase, PessoaFisicaCreate):
    pass


class JogadorUpdate(PessoaFisicaUpdate):
    idade: Idade | None = None
    posicao: Posicao | None = None


class JogadorOut(JogadorBase, PessoaFisicaOut):
    equipe: EquipeResumo | None = None
