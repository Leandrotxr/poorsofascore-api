"""partidas e eventos (gols, cartões) — o placar é calculado a partir dos gols

Revision ID: 0005
Revises: 0004
Create Date: 2026-11-23
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "0005"
down_revision: str | None = "0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

STATUS = ("AGENDADA", "EM_ANDAMENTO", "ENCERRADA")
TIPOS = ("GOL", "GOL_CONTRA", "CARTAO_AMARELO", "CARTAO_VERMELHO")


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "partida",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("campeonato_id", sa.Integer(), nullable=False),
        sa.Column("rodada", sa.Integer(), nullable=False),
        sa.Column("data_hora", sa.DateTime(timezone=True), nullable=True),
        sa.Column("local", sa.String(120), nullable=True),
        sa.Column("status", sa.Enum(*STATUS, name="statuspartida", native_enum=False, length=20), nullable=False),
        sa.Column("mandante_id", sa.Integer(), nullable=False),
        sa.Column("visitante_id", sa.Integer(), nullable=False),
        sa.Column("arbitro_id", sa.Integer(), nullable=True),
        *_timestamps(),
        sa.PrimaryKeyConstraint("id", name="pk_partida"),
        sa.ForeignKeyConstraint(
            ["campeonato_id"], ["campeonato.id"], name="fk_partida_campeonato_id_campeonato", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["mandante_id"], ["equipe.id"], name="fk_partida_mandante_id_equipe", ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["visitante_id"], ["equipe.id"], name="fk_partida_visitante_id_equipe", ondelete="RESTRICT"
        ),
        sa.ForeignKeyConstraint(
            ["arbitro_id"], ["arbitro.id"], name="fk_partida_arbitro_id_arbitro", ondelete="SET NULL"
        ),
        sa.CheckConstraint("mandante_id <> visitante_id", name=op.f("ck_partida_equipes_distintas")),
        sa.CheckConstraint("rodada >= 1", name=op.f("ck_partida_rodada_valida")),
    )
    for coluna in ("campeonato_id", "mandante_id", "visitante_id", "arbitro_id"):
        op.create_index(f"ix_partida_{coluna}", "partida", [coluna])

    op.create_table(
        "evento_partida",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("partida_id", sa.Integer(), nullable=False),
        sa.Column("tipo", sa.Enum(*TIPOS, name="tipoevento", native_enum=False, length=20), nullable=False),
        sa.Column("minuto", sa.Integer(), nullable=False),
        sa.Column("equipe_id", sa.Integer(), nullable=False),
        sa.Column("jogador_id", sa.Integer(), nullable=True),
        *_timestamps(),
        sa.PrimaryKeyConstraint("id", name="pk_evento_partida"),
        sa.ForeignKeyConstraint(
            ["partida_id"], ["partida.id"], name="fk_evento_partida_partida_id_partida", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["equipe_id"], ["equipe.id"], name="fk_evento_partida_equipe_id_equipe", ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["jogador_id"], ["jogador.id"], name="fk_evento_partida_jogador_id_jogador", ondelete="SET NULL"
        ),
        sa.CheckConstraint("minuto BETWEEN 0 AND 130", name=op.f("ck_evento_partida_minuto_valido")),
    )
    for coluna in ("partida_id", "equipe_id", "jogador_id"):
        op.create_index(f"ix_evento_partida_{coluna}", "evento_partida", [coluna])


def downgrade() -> None:
    for coluna in ("partida_id", "equipe_id", "jogador_id"):
        op.drop_index(f"ix_evento_partida_{coluna}", table_name="evento_partida")
    op.drop_table("evento_partida")
    for coluna in ("campeonato_id", "mandante_id", "visitante_id", "arbitro_id"):
        op.drop_index(f"ix_partida_{coluna}", table_name="partida")
    op.drop_table("partida")
