from datetime import date
from typing import Annotated

from pydantic import AfterValidator, Field

from app.core.datas import faixa_etaria
from app.models import Arbitro, FuncaoArbitro
from app.schemas.pessoa_fisica.base import PessoaFisicaBase, PessoaFisicaCreate, PessoaFisicaOut, PessoaFisicaUpdate
from app.schemas.resumos import FederacaoResumo

Nascimento = Annotated[
    date,
    AfterValidator(faixa_etaria(Arbitro.IDADE_MINIMA, Arbitro.IDADE_MAXIMA)),
    Field(description=f"Idade entre {Arbitro.IDADE_MINIMA} e {Arbitro.IDADE_MAXIMA} anos"),
]


class ArbitroBase(PessoaFisicaBase):
    funcao: FuncaoArbitro


class ArbitroCreate(ArbitroBase, PessoaFisicaCreate):
    data_nascimento: Nascimento


class ArbitroUpdate(PessoaFisicaUpdate):
    data_nascimento: Nascimento | None = None
    funcao: FuncaoArbitro | None = None


class ArbitroOut(ArbitroBase, PessoaFisicaOut):
    federacao: FederacaoResumo | None = None
