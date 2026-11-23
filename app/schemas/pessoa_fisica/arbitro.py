from pydantic import Field

from app.models import Arbitro, FuncaoArbitro
from app.schemas.pessoa_fisica.base import PessoaFisicaBase, PessoaFisicaCreate, PessoaFisicaOut, PessoaFisicaUpdate
from app.schemas.resumos import FederacaoResumo

_IDADE = {"ge": Arbitro.IDADE_MINIMA, "le": Arbitro.IDADE_MAXIMA}


class ArbitroBase(PessoaFisicaBase):
    idade: int = Field(**_IDADE)
    funcao: FuncaoArbitro


class ArbitroCreate(ArbitroBase, PessoaFisicaCreate):
    pass


class ArbitroUpdate(PessoaFisicaUpdate):
    idade: int | None = Field(default=None, **_IDADE)
    funcao: FuncaoArbitro | None = None


class ArbitroOut(ArbitroBase, PessoaFisicaOut):
    federacao: FederacaoResumo | None = None
