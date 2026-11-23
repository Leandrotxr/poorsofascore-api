from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.pessoa_fisica.base import PessoaFisica

if TYPE_CHECKING:
    from app.models.pessoa_juridica.equipe import Equipe


class Tecnico(PessoaFisica):
    __tablename__ = "tecnico"

    IDADE_MINIMA = 18
    IDADE_MAXIMA = 100

    # 1:1 -> unique=True garante NO BANCO que duas linhas não apontem para a mesma equipe.
    # NULL é permitido (técnico sem clube) e o Postgres aceita vários NULLs em coluna UNIQUE.
    equipe_id: Mapped[int | None] = mapped_column(ForeignKey("equipe.id", ondelete="SET NULL"), unique=True)
    equipe: Mapped["Equipe | None"] = relationship(back_populates="tecnico")
