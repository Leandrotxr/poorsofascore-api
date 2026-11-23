from typing import Annotated

from pydantic import Field

from app.models import Tecnico
from app.schemas.pessoa_fisica.base import PessoaFisicaBase, PessoaFisicaCreate, PessoaFisicaOut, PessoaFisicaUpdate
from app.schemas.resumos import EquipeResumo

Idade = Annotated[int, Field(ge=Tecnico.IDADE_MINIMA, le=Tecnico.IDADE_MAXIMA)]


class TecnicoBase(PessoaFisicaBase):
    idade: Idade


class TecnicoCreate(TecnicoBase, PessoaFisicaCreate):
    pass


class TecnicoUpdate(PessoaFisicaUpdate):
    idade: Idade | None = None


class TecnicoOut(TecnicoBase, PessoaFisicaOut):
    equipe: EquipeResumo | None = None
