from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.equipe import Equipe


class Tecnico(TimestampMixin, Base):
    __tablename__ = "tecnico"
    __table_args__ = (CheckConstraint("idade BETWEEN 18 AND 100", name="idade_valida"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), index=True)
    cpf: Mapped[str] = mapped_column(String(11), unique=True)
    idade: Mapped[int]
    nacionalidade: Mapped[str] = mapped_column(String(60))

    # 1:1 -> unique=True garante NO BANCO que duas linhas não apontem para a mesma equipe.
    # NULL é permitido (técnico sem clube) e o Postgres aceita vários NULLs em coluna UNIQUE.
    equipe_id: Mapped[int | None] = mapped_column(
        ForeignKey("equipe.id", ondelete="SET NULL"), unique=True
    )
    equipe: Mapped["Equipe | None"] = relationship(back_populates="tecnico")
