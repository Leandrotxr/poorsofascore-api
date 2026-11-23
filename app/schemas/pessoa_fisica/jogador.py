from pydantic import Field

from app.models import Jogador, Posicao
from app.schemas.pessoa_fisica.base import PessoaFisicaBase, PessoaFisicaCreate, PessoaFisicaOut, PessoaFisicaUpdate
from app.schemas.resumos import EquipeResumo

_IDADE = {"ge": Jogador.IDADE_MINIMA, "le": Jogador.IDADE_MAXIMA}


class JogadorBase(PessoaFisicaBase):
    idade: int = Field(**_IDADE)
    posicao: Posicao


class JogadorCreate(JogadorBase, PessoaFisicaCreate):
    pass


class JogadorUpdate(PessoaFisicaUpdate):
    idade: int | None = Field(default=None, **_IDADE)
    posicao: Posicao | None = None


class JogadorOut(JogadorBase, PessoaFisicaOut):
    equipe: EquipeResumo | None = None
