from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Index, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.pessoa_fisica.jogador import Jogador
    from app.models.pessoa_fisica.tecnico import Tecnico
    from app.models.pessoa_juridica.equipe import Equipe

# Contrato ATIVO = sem data de fim. Os índices únicos parciais (WHERE fim IS NULL) garantem NO BANCO
# que ninguém tenha dois contratos ativos ao mesmo tempo, sem impedir o histórico de contratos antigos.
_ATIVO = text("fim IS NULL")


class Periodo:
    """Início e fim de um vínculo. Fim vazio = vínculo em andamento."""

    inicio: Mapped[date]
    fim: Mapped[date | None]

    @property
    def ativo(self) -> bool:
        return self.fim is None


class ContratoJogador(Periodo, TimestampMixin, Base):
    """
    Histórico de passagens de um jogador pelas equipes.

    `jogador.equipe_id` continua existindo como atalho para "equipe atual"; o service mantém os dois
    em sincronia (contratar abre um contrato, dispensar fecha).
    """

    __tablename__ = "contrato_jogador"
    __table_args__ = (
        CheckConstraint("fim IS NULL OR fim >= inicio", name="periodo_valido"),
        CheckConstraint("numero_camisa IS NULL OR numero_camisa BETWEEN 1 AND 99", name="numero_valido"),
        Index("uq_contrato_jogador_ativo", "jogador_id", unique=True, postgresql_where=_ATIVO, sqlite_where=_ATIVO),
        # A mesma camisa não pode estar com dois jogadores ativos da mesma equipe.
        Index(
            "uq_contrato_jogador_camisa",
            "equipe_id",
            "numero_camisa",
            unique=True,
            postgresql_where=text("fim IS NULL AND numero_camisa IS NOT NULL"),
            sqlite_where=text("fim IS NULL AND numero_camisa IS NOT NULL"),
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    # CASCADE: apagar o jogador ou a equipe apaga as passagens dele(a).
    jogador_id: Mapped[int] = mapped_column(ForeignKey("jogador.id", ondelete="CASCADE"), index=True)
    equipe_id: Mapped[int] = mapped_column(ForeignKey("equipe.id", ondelete="CASCADE"), index=True)
    numero_camisa: Mapped[int | None]

    jogador: Mapped["Jogador"] = relationship(back_populates="contratos")
    equipe: Mapped["Equipe"] = relationship()


class ContratoTecnico(Periodo, TimestampMixin, Base):
    """Histórico de equipes comandadas por um técnico."""

    __tablename__ = "contrato_tecnico"
    __table_args__ = (
        CheckConstraint("fim IS NULL OR fim >= inicio", name="periodo_valido"),
        Index("uq_contrato_tecnico_ativo", "tecnico_id", unique=True, postgresql_where=_ATIVO, sqlite_where=_ATIVO),
        # Uma equipe tem no máximo um técnico ativo (o mesmo que o UNIQUE de tecnico.equipe_id).
        Index(
            "uq_contrato_tecnico_equipe_ativa", "equipe_id", unique=True, postgresql_where=_ATIVO, sqlite_where=_ATIVO
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    tecnico_id: Mapped[int] = mapped_column(ForeignKey("tecnico.id", ondelete="CASCADE"), index=True)
    equipe_id: Mapped[int] = mapped_column(ForeignKey("equipe.id", ondelete="CASCADE"), index=True)

    tecnico: Mapped["Tecnico"] = relationship(back_populates="contratos")
    equipe: Mapped["Equipe"] = relationship()
