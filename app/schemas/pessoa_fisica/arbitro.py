from typing import Annotated

from pydantic import Field

from app.models import Arbitro, FuncaoArbitro
from app.schemas.pessoa_fisica.base import PessoaFisicaBase, PessoaFisicaCreate, PessoaFisicaOut, PessoaFisicaUpdate
from app.schemas.resumos import FederacaoResumo

Idade = Annotated[int, Field(ge=Arbitro.IDADE_MINIMA, le=Arbitro.IDADE_MAXIMA)]


class ArbitroBase(PessoaFisicaBase):
    idade: Idade
    funcao: FuncaoArbitro


class ArbitroCreate(ArbitroBase, PessoaFisicaCreate):
    pass


class ArbitroUpdate(PessoaFisicaUpdate):
    idade: Idade | None = None
    funcao: FuncaoArbitro | None = None


class ArbitroOut(ArbitroBase, PessoaFisicaOut):
    federacao: FederacaoResumo | None = None
