from typing import ClassVar

from sqlalchemy import CheckConstraint, String
from sqlalchemy.orm import Mapped, declared_attr, mapped_column

from app.db.base import Base, TimestampMixin


class PessoaFisica(TimestampMixin, Base):
    """
    Classe mãe ABSTRATA de toda pessoa física (jogador, técnico, árbitro).

    `__abstract__ = True` faz com que ela NÃO vire tabela: cada classe filha ganha
    a própria tabela com uma cópia destas colunas. Por isso o CPF é único por papel,
    ou seja, a mesma pessoa pode ser cadastrada como jogador e, depois, como técnico.
    """

    __abstract__ = True

    # Cada filha define a sua faixa de idade; vira CHECK no banco e validação na API.
    IDADE_MINIMA: ClassVar[int] = 0
    IDADE_MAXIMA: ClassVar[int] = 120

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), index=True)
    cpf: Mapped[str] = mapped_column(String(11), unique=True)
    idade: Mapped[int]
    nacionalidade: Mapped[str] = mapped_column(String(60))

    @declared_attr.directive
    def __table_args__(cls) -> tuple:
        return (CheckConstraint(f"idade BETWEEN {cls.IDADE_MINIMA} AND {cls.IDADE_MAXIMA}", name="idade_valida"),)
