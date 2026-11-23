from pydantic import Field

from app.models import Tecnico
from app.schemas.pessoa_fisica.base import PessoaFisicaBase, PessoaFisicaCreate, PessoaFisicaOut, PessoaFisicaUpdate
from app.schemas.resumos import EquipeResumo

_IDADE = {"ge": Tecnico.IDADE_MINIMA, "le": Tecnico.IDADE_MAXIMA}


class TecnicoBase(PessoaFisicaBase):
    idade: int = Field(**_IDADE)


class TecnicoCreate(TecnicoBase, PessoaFisicaCreate):
    pass


class TecnicoUpdate(PessoaFisicaUpdate):
    idade: int | None = Field(default=None, **_IDADE)


class TecnicoOut(TecnicoBase, PessoaFisicaOut):
    equipe: EquipeResumo | None = None
