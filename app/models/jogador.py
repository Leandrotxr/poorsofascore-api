import enum
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.equipe import Equipe


class Posicao(str, enum.Enum):
    GOLEIRO = "GOLEIRO"
    ZAGUEIRO = "ZAGUEIRO"
    LATERAL = "LATERAL"
    VOLANTE = "VOLANTE"
    MEIA = "MEIA"
    ATACANTE = "ATACANTE"


class Jogador(TimestampMixin, Base):
    __tablename__ = "jogador"
    __table_args__ = (CheckConstraint("idade BETWEEN 14 AND 60", name="idade_valida"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), index=True)
    cpf: Mapped[str] = mapped_column(String(11), unique=True)
    idade: Mapped[int]
    nacionalidade: Mapped[str] = mapped_column(String(60))
    posicao: Mapped[Posicao] = mapped_column(Enum(Posicao, native_enum=False, length=20))

    # N:1 -> vários jogadores pertencem a uma equipe (ou a nenhuma: agente livre).
    # Se a equipe for apagada, o jogador continua existindo, sem equipe.
    equipe_id: Mapped[int | None] = mapped_column(ForeignKey("equipe.id", ondelete="SET NULL"), index=True)
    equipe: Mapped["Equipe | None"] = relationship(back_populates="jogadores")
