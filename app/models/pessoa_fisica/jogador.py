import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.pessoa_fisica.base import PessoaFisica

if TYPE_CHECKING:
    from app.models.contratos.contrato import ContratoJogador
    from app.models.pessoa_juridica.equipe import Equipe


class Posicao(enum.StrEnum):
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

    # Histórico de equipes (o mais recente primeiro) e o contrato em andamento, se houver.
    contratos: Mapped[list["ContratoJogador"]] = relationship(
        back_populates="jogador",
        order_by="ContratoJogador.inicio.desc(), ContratoJogador.id.desc()",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    contrato_atual: Mapped["ContratoJogador | None"] = relationship(
        primaryjoin="and_(ContratoJogador.jogador_id == Jogador.id, ContratoJogador.fim.is_(None))",
        viewonly=True,
        uselist=False,
    )

    @property
    def numero_camisa(self) -> int | None:
        return self.contrato_atual.numero_camisa if self.contrato_atual else None
