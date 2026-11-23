import enum
from datetime import date
from typing import TYPE_CHECKING, ClassVar

from sqlalchemy import CheckConstraint, Column, Enum, ForeignKey, Integer, String, Table, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.competicao.partida import Partida
    from app.models.pessoa_juridica.equipe import Equipe
    from app.models.pessoa_juridica.federacao import Federacao


class FormatoCampeonato(enum.StrEnum):
    PONTOS_CORRIDOS = "PONTOS_CORRIDOS"  # Brasileirão, Premier League
    MATA_MATA = "MATA_MATA"  # Copa do Brasil
    GRUPOS_E_MATA_MATA = "GRUPOS_E_MATA_MATA"  # Copa do Mundo, Champions League


# N:N -> tabela de ligação pura (sem classe própria). A chave primária composta impede
# inscrever a mesma equipe duas vezes no mesmo campeonato. Apagar a equipe ou o
# campeonato apaga só a inscrição (CASCADE), nunca o outro lado.
campeonato_equipe = Table(
    "campeonato_equipe",
    Base.metadata,
    Column("campeonato_id", Integer, ForeignKey("campeonato.id", ondelete="CASCADE"), primary_key=True),
    Column("equipe_id", Integer, ForeignKey("equipe.id", ondelete="CASCADE"), primary_key=True, index=True),
)


class Campeonato(TimestampMixin, Base):
    __tablename__ = "campeonato"

    TEMPORADA_MINIMA: ClassVar[int] = 1850
    TEMPORADA_MAXIMA: ClassVar[int] = 2100

    __table_args__ = (
        # "Brasileirão 2025" e "Brasileirão 2026" podem existir; dois "Brasileirão 2026", não.
        UniqueConstraint("nome", "temporada"),
        CheckConstraint(f"temporada BETWEEN {TEMPORADA_MINIMA} AND {TEMPORADA_MAXIMA}", name="temporada_valida"),
        CheckConstraint("data_inicio IS NULL OR data_fim IS NULL OR data_fim >= data_inicio", name="datas_validas"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), index=True)
    temporada: Mapped[int]
    formato: Mapped[FormatoCampeonato] = mapped_column(Enum(FormatoCampeonato, native_enum=False, length=30))
    data_inicio: Mapped[date | None]
    data_fim: Mapped[date | None]

    # N:1 -> todo campeonato tem uma federação organizadora (obrigatória).
    # RESTRICT: o banco não deixa apagar uma federação que ainda organiza campeonatos.
    federacao_id: Mapped[int] = mapped_column(ForeignKey("federacao.id", ondelete="RESTRICT"), index=True)
    federacao: Mapped["Federacao"] = relationship(back_populates="campeonatos")

    # N:N -> equipes participantes
    equipes: Mapped[list["Equipe"]] = relationship(
        secondary=campeonato_equipe, back_populates="campeonatos", order_by="Equipe.nome"
    )

    # 1:N -> partidas do campeonato (apagar o campeonato apaga as partidas)
    partidas: Mapped[list["Partida"]] = relationship(
        back_populates="campeonato",
        order_by="Partida.rodada, Partida.data_hora, Partida.id",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
