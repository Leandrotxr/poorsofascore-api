import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.pessoa_fisica.base import PessoaFisica

if TYPE_CHECKING:
    from app.models.pessoa_juridica.federacao import Federacao


class FuncaoArbitro(str, enum.Enum):
    CENTRAL = "CENTRAL"
    ASSISTENTE = "ASSISTENTE"
    VAR = "VAR"


class Arbitro(PessoaFisica):
    __tablename__ = "arbitro"

    IDADE_MINIMA = 18
    IDADE_MAXIMA = 65

    funcao: Mapped[FuncaoArbitro] = mapped_column(Enum(FuncaoArbitro, native_enum=False, length=20))

    # N:1 -> vários árbitros pertencem a uma federação (ou a nenhuma).
    federacao_id: Mapped[int | None] = mapped_column(ForeignKey("federacao.id", ondelete="SET NULL"), index=True)
    federacao: Mapped["Federacao | None"] = relationship(back_populates="arbitros")
