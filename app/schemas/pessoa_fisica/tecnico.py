from datetime import date
from typing import Annotated

from pydantic import AfterValidator, Field

from app.core.datas import faixa_etaria
from app.models import Tecnico
from app.schemas.pessoa_fisica.base import PessoaFisicaBase, PessoaFisicaCreate, PessoaFisicaOut, PessoaFisicaUpdate
from app.schemas.resumos import EquipeResumo

Nascimento = Annotated[
    date,
    AfterValidator(faixa_etaria(Tecnico.IDADE_MINIMA, Tecnico.IDADE_MAXIMA)),
    Field(description=f"Idade entre {Tecnico.IDADE_MINIMA} e {Tecnico.IDADE_MAXIMA} anos"),
]


class TecnicoCreate(PessoaFisicaBase, PessoaFisicaCreate):
    data_nascimento: Nascimento


class TecnicoUpdate(PessoaFisicaUpdate):
    data_nascimento: Nascimento | None = None


class TecnicoOut(PessoaFisicaBase, PessoaFisicaOut):
    equipe: EquipeResumo | None = None
