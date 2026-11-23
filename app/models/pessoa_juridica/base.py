from typing import ClassVar

from sqlalchemy import CheckConstraint, String
from sqlalchemy.orm import Mapped, declared_attr, mapped_column

from app.db.base import Base, TimestampMixin


class PessoaJuridica(TimestampMixin, Base):
    """
    Classe mãe ABSTRATA de toda pessoa jurídica (equipe, federação).

    Não vira tabela: cada filha tem a própria tabela com uma cópia destas colunas.
    O CNPJ fica nas filhas porque nem toda entidade tem um (FIFA e UEFA não têm).
    """

    __abstract__ = True

    FUNDACAO_MINIMA: ClassVar[int] = 1800
    FUNDACAO_MAXIMA: ClassVar[int] = 2100

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), unique=True)
    fundacao: Mapped[int]
    sede: Mapped[str] = mapped_column(String(120))

    @declared_attr.directive
    def __table_args__(cls) -> tuple:
        return (
            CheckConstraint(
                f"fundacao BETWEEN {cls.FUNDACAO_MINIMA} AND {cls.FUNDACAO_MAXIMA}", name="fundacao_valida"
            ),
        )
