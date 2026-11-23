from datetime import date
from typing import ClassVar

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.datas import calcular_idade
from app.db.base import Base, TimestampMixin


class PessoaFisica(TimestampMixin, Base):
    """
    Classe mãe ABSTRATA de toda pessoa física (jogador, técnico, árbitro).

    `__abstract__ = True` faz com que ela NÃO vire tabela: cada classe filha ganha
    a própria tabela com uma cópia destas colunas. Por isso o CPF é único por papel,
    ou seja, a mesma pessoa pode ser cadastrada como jogador e, depois, como técnico.
    """

    __abstract__ = True

    # Cada filha define a sua faixa de idade, conferida pela API no cadastro e na edição.
    # (Não vira CHECK no banco: a idade muda com o tempo e o CHECK não pode usar a data de hoje.)
    IDADE_MINIMA: ClassVar[int] = 0
    IDADE_MAXIMA: ClassVar[int] = 120

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), index=True)
    cpf: Mapped[str] = mapped_column(String(11), unique=True)
    # Guardamos a data, não a idade: a idade calculada nunca fica desatualizada.
    data_nascimento: Mapped[date]
    nacionalidade: Mapped[str] = mapped_column(String(60))

    @property
    def idade(self) -> int:
        return calcular_idade(self.data_nascimento)
