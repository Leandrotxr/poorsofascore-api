"""campeonatos: federacao 1:N campeonato, campeonato N:N equipe

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-22
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

FORMATOS = ("PONTOS_CORRIDOS", "MATA_MATA", "GRUPOS_E_MATA_MATA")


def upgrade() -> None:
    op.create_table(
        "campeonato",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(120), nullable=False),
        sa.Column("temporada", sa.Integer(), nullable=False),
        sa.Column("formato", sa.Enum(*FORMATOS, name="formatocampeonato", native_enum=False, length=30), nullable=False),
        sa.Column("data_inicio", sa.Date(), nullable=True),
        sa.Column("data_fim", sa.Date(), nullable=True),
        sa.Column("federacao_id", sa.Integer(), nullable=False),
        sa.Column("criado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_campeonato"),
        sa.UniqueConstraint("nome", "temporada", name="uq_campeonato_nome"),
        # RESTRICT: não deixa apagar a federação enquanto ela organizar campeonatos
        sa.ForeignKeyConstraint(
            ["federacao_id"], ["federacao.id"], name="fk_campeonato_federacao_id_federacao", ondelete="RESTRICT"
        ),
        sa.CheckConstraint("temporada BETWEEN 1850 AND 2100", name=op.f("ck_campeonato_temporada_valida")),
        sa.CheckConstraint(
            "data_inicio IS NULL OR data_fim IS NULL OR data_fim >= data_inicio",
            name=op.f("ck_campeonato_datas_validas"),
        ),
    )
    op.create_index("ix_campeonato_nome", "campeonato", ["nome"])
    op.create_index("ix_campeonato_federacao_id", "campeonato", ["federacao_id"])

    # Tabela de ligação N:N. PK composta = a mesma equipe não entra duas vezes no mesmo campeonato.
    op.create_table(
        "campeonato_equipe",
        sa.Column("campeonato_id", sa.Integer(), nullable=False),
        sa.Column("equipe_id", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("campeonato_id", "equipe_id", name="pk_campeonato_equipe"),
        sa.ForeignKeyConstraint(
            ["campeonato_id"], ["campeonato.id"], name="fk_campeonato_equipe_campeonato_id_campeonato",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["equipe_id"], ["equipe.id"], name="fk_campeonato_equipe_equipe_id_equipe", ondelete="CASCADE"
        ),
    )
    op.create_index("ix_campeonato_equipe_equipe_id", "campeonato_equipe", ["equipe_id"])


def downgrade() -> None:
    op.drop_index("ix_campeonato_equipe_equipe_id", table_name="campeonato_equipe")
    op.drop_table("campeonato_equipe")
    op.drop_index("ix_campeonato_federacao_id", table_name="campeonato")
    op.drop_index("ix_campeonato_nome", table_name="campeonato")
    op.drop_table("campeonato")
