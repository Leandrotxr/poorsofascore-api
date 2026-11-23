import enum
from datetime import datetime
from typing import TYPE_CHECKING, ClassVar

from sqlalchemy import CheckConstraint, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.competicao.campeonato import Campeonato
    from app.models.pessoa_fisica.arbitro import Arbitro
    from app.models.pessoa_fisica.jogador import Jogador
    from app.models.pessoa_juridica.equipe import Equipe


class StatusPartida(enum.StrEnum):
    AGENDADA = "AGENDADA"
    EM_ANDAMENTO = "EM_ANDAMENTO"
    ENCERRADA = "ENCERRADA"  # só partidas encerradas contam na classificação


class TipoEvento(enum.StrEnum):
    GOL = "GOL"
    GOL_CONTRA = "GOL_CONTRA"  # conta para o ADVERSÁRIO da equipe do jogador
    CARTAO_AMARELO = "CARTAO_AMARELO"
    CARTAO_VERMELHO = "CARTAO_VERMELHO"


class Partida(TimestampMixin, Base):
    """
    Jogo entre duas equipes inscritas num campeonato.

    O placar NÃO é uma coluna: é calculado a partir dos eventos de gol. Assim placar e artilharia
    nunca se contradizem.
    """

    __tablename__ = "partida"
    __table_args__ = (
        CheckConstraint("mandante_id <> visitante_id", name="equipes_distintas"),
        CheckConstraint("rodada >= 1", name="rodada_valida"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    # CASCADE: apagar o campeonato apaga as partidas dele.
    campeonato_id: Mapped[int] = mapped_column(ForeignKey("campeonato.id", ondelete="CASCADE"), index=True)
    rodada: Mapped[int]
    data_hora: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    local: Mapped[str | None] = mapped_column(String(120))
    status: Mapped[StatusPartida] = mapped_column(
        Enum(StatusPartida, native_enum=False, length=20), default=StatusPartida.AGENDADA
    )

    # RESTRICT: uma equipe com partidas registradas não pode ser apagada (perderíamos o histórico).
    mandante_id: Mapped[int] = mapped_column(ForeignKey("equipe.id", ondelete="RESTRICT"), index=True)
    visitante_id: Mapped[int] = mapped_column(ForeignKey("equipe.id", ondelete="RESTRICT"), index=True)
    # Árbitro central. Apagar o árbitro não apaga a partida.
    arbitro_id: Mapped[int | None] = mapped_column(ForeignKey("arbitro.id", ondelete="SET NULL"), index=True)

    campeonato: Mapped["Campeonato"] = relationship(back_populates="partidas")
    mandante: Mapped["Equipe"] = relationship(foreign_keys=[mandante_id])
    visitante: Mapped["Equipe"] = relationship(foreign_keys=[visitante_id])
    arbitro: Mapped["Arbitro | None"] = relationship()
    eventos: Mapped[list["EventoPartida"]] = relationship(
        back_populates="partida",
        order_by="EventoPartida.minuto, EventoPartida.id",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )

    def gols_de(self, equipe_id: int) -> int:
        """Gols marcados pela equipe: os gols dela + os gols contra do adversário."""
        return sum(
            1
            for e in self.eventos
            if (e.tipo == TipoEvento.GOL and e.equipe_id == equipe_id)
            or (e.tipo == TipoEvento.GOL_CONTRA and e.equipe_id != equipe_id)
        )

    @property
    def gols_mandante(self) -> int:
        return self.gols_de(self.mandante_id)

    @property
    def gols_visitante(self) -> int:
        return self.gols_de(self.visitante_id)


class EventoPartida(TimestampMixin, Base):
    __tablename__ = "evento_partida"

    MINUTO_MAXIMO: ClassVar[int] = 130  # 90 + prorrogação + acréscimos

    __table_args__ = (CheckConstraint(f"minuto BETWEEN 0 AND {MINUTO_MAXIMO}", name="minuto_valido"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    partida_id: Mapped[int] = mapped_column(ForeignKey("partida.id", ondelete="CASCADE"), index=True)
    tipo: Mapped[TipoEvento] = mapped_column(Enum(TipoEvento, native_enum=False, length=20))
    minuto: Mapped[int]
    # A equipe fica gravada no evento: se o jogador for apagado (SET NULL) ou trocar de clube,
    # o placar e a artilharia da partida continuam corretos.
    equipe_id: Mapped[int] = mapped_column(ForeignKey("equipe.id", ondelete="CASCADE"), index=True)
    jogador_id: Mapped[int | None] = mapped_column(ForeignKey("jogador.id", ondelete="SET NULL"), index=True)

    partida: Mapped[Partida] = relationship(back_populates="eventos")
    equipe: Mapped["Equipe"] = relationship()
    jogador: Mapped["Jogador | None"] = relationship()
