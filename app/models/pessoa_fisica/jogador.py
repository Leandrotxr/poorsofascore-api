import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.pessoa_fisica.base import PessoaFisica

if TYPE_CHECKING:
    from app.models.pessoa_juridica.equipe import Equipe


class Posicao(str, enum.Enum):
    GOLEIRO = "GOLEIRO"
    ZAGUEIRO = "ZAGUEIRO"
    LATERAL = "LATERAL"
    VOLANTE = "VOLANTE"
    MEIA = "MEIA"
    ATACANTE = "ATACANTE"


class Jogador(PessoaFisica):
    __tablename__ = "jogador"

    IDADE_MINIMA = 14
    IDADE_MAXIMA = 60

    posicao: Mapped[Posicao] = mapped_column(Enum(Posicao, native_enum=False, length=20))

    # N:1 -> vários jogadores pertencem a uma equipe (ou a nenhuma: agente livre).
    # Se a equipe for apagada, o jogador continua existindo, sem equipe.
    equipe_id: Mapped[int | None] = mapped_column(ForeignKey("equipe.id", ondelete="SET NULL"), index=True)
    equipe: Mapped["Equipe | None"] = relationship(back_populates="jogadores")
