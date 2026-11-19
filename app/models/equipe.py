from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.jogador import Jogador
    from app.models.tecnico import Tecnico


class Equipe(TimestampMixin, Base):
    __tablename__ = "equipe"
    __table_args__ = (CheckConstraint("fundacao BETWEEN 1800 AND 2100", name="fundacao_valida"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), unique=True)
    cnpj: Mapped[str] = mapped_column(String(14), unique=True)
    fundacao: Mapped[int]
    sede: Mapped[str] = mapped_column(String(120))

    # 1:N -> uma equipe tem vários jogadores
    jogadores: Mapped[list["Jogador"]] = relationship(back_populates="equipe", order_by="Jogador.nome")

    # 1:1 -> uma equipe tem no máximo um técnico (uselist=False)
    tecnico: Mapped["Tecnico | None"] = relationship(back_populates="equipe", uselist=False)
